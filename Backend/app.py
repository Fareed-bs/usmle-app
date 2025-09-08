from functools import wraps
from flask import Flask, jsonify, request, session, redirect, url_for
from flask_cors import CORS
from chatbot import get_chat_response
from all_questions import get_basic_questions, get_basic_questions_public, get_dataset_questions, get_dataset_qa, step2_basic_questions_ans, step2_basic_questions, get_sampletest_questions, get_sampletest_qa, step3_basic_questions, step3_basic_full, get_fip_questions, get_fip_qa, acm_questions, acm_qa  # type: ignore
import datetime
import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import timedelta
from authlib.integrations.flask_client import OAuth
app = Flask(__name__)

oauth = OAuth(app)

# --- Configuration ---
app.config['SECRET_KEY'] = os.environ.get(
    'FLASK_SECRET_KEY', 'your_very_secret_key_for_dev')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(
    days=7)  # Session will expire after 7 days
app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID',)
app.config['GOOGLE_CLIENT_SECRET'] = os.environ.get('GOOGLE_CLIENT_SECRET')
app.config['GOOGLE_DISCOVERY_URL'] = "https://accounts.google.com/.well-known/openid-configuration"

CORS(app, supports_credentials=True)  # Allow credentials for session cookies

google = oauth.register(
    name='google',
    client_id=app.config['GOOGLE_CLIENT_ID'],
    client_secret=app.config['GOOGLE_CLIENT_SECRET'],
    server_metadata_url=app.config['GOOGLE_DISCOVERY_URL'],
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# MongoDB setup
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client.get_database('usmle_quiz')  # Replace with your database name
users_collection = db.users

# New database for user answers
user_answers_db = client.get_database('user_answers')
user_answers_step1_collection = user_answers_db.user_answers_step1
user_answers_step2_collection = user_answers_db.user_answers_step2
user_answers_fip_collection = user_answers_db.user_answers_fip
user_answers_acm_collection = user_answers_db.user_answers_acm


# --------------------------
# Authentication Routes
# --------------------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Username and password required"}), 400

    username = data['username']
    password = data['password']

    # Check if user already exists
    if users_collection.find_one({'username': username}):
        return jsonify({"message": "Username already exists"}), 409

    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        '_id': user_id,
        'username': username,
        'password': hashed_password,
        'quizzes': []  # You can store quiz results here later
    })

    return jsonify({"message": "User created successfully"}), 201

# Login


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Username and password required"}), 400

    username = data['username']
    password = data['password']

    user = users_collection.find_one({'username': username})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"message": "Invalid username or password"}), 401

    # Create session
    session.permanent = True
    session['user_id'] = user['_id']
    session['username'] = user['username']

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user['_id'],
            "username": user['username']
        }
    })

# Logout


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"})


@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        user = users_collection.find_one({'_id': session['user_id']})
        if user:
            return jsonify({
                "isAuthenticated": True,
                "user": {
                    "id": user['_id'],
                    "username": user['username']
                }
            })
    return jsonify({"isAuthenticated": False})


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --------------------------
# Google OAuth Routes
# --------------------------
# Login


@app.route('/api/auth/login/google')
def login_with_google():
    redirect_uri = url_for('google_auth_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

# Callback after Google authentication


@app.route('/api/auth/callback/google')
def google_auth_callback():
    token = google.authorize_access_token()
    user_info = token.get('userinfo')

    if not user_info:
        return jsonify({"message": "Google authentication failed"}), 400

    google_id = user_info['sub']
    email = user_info['email']
    username = user_info.get('name', email.split('@')[0])

    user = users_collection.find_one({'google_id': google_id})

    if not user:
        # Create new user in DB
        user_id = str(uuid.uuid4())
        user = {
            '_id': user_id,
            'username': username,
            'email': email,
            'google_id': google_id,
            'quizzes': []
        }
        users_collection.insert_one(user)

    # Create session
    session.permanent = True
    session['user_id'] = user['_id']
    session['username'] = user['username']

    # redirect to frontend (React)
    return redirect("http://localhost:3000")

# --------------------------
# Step 1 BasicQuiz from basic.json
# --------------------------


# Create an endpoint to get all questions from the basic.json file
@app.route('/api/step1/basic', methods=['GET'])
@login_required
def get_basic_quiz_questions():
    return jsonify(get_basic_questions_public())


@app.route('/api/step1/basic/submit', methods=['POST'])
def submit_basic_quiz():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400

    user_answers = submitted_data.get("answers", {})
    full_data = get_basic_questions()
    results = []
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1

        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })

    feedback_message = ""
    if score >= 15:
        feedback_message = "Congratulations! You have passed the quiz. You are good to go with the next step."
    else:
        feedback_message = "Your score is less. Please try again. You can do it."

    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "feedback_message": feedback_message
    })


# --------------------------
# Step-1 Core Quiz (from kaggle dataset)
# --------------------------

# Endpoint to get all questions from the dataset
@app.route('/api/questions', methods=['GET'])
@login_required
def get_questions():
    # Return only questions and options (for quiz display)
    return jsonify(get_dataset_questions())

# Endpoint to get user answers and evaluate


@app.route('/api/submit', methods=['POST'])
@login_required
def submit():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400

    user_answers = submitted_data.get("answers", {})
    full_data = get_dataset_qa()
    results = []
    incorrect_answers_details = []
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1
        else:
            incorrect_answers_details.append({
                "question": q["question"],
                "user_answer": user_answer,
                "correct_answer": q["answer"],
                "explanation": q["explanation"]
            })

        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })

    # Store users answers in the new collection
    if incorrect_answers_details and 'user_id' in session:
        user_id = session['user_id']
        document = {
            "user_id": user_id,
            "timestamp": datetime.datetime.now(),
            "incorrect_answers": incorrect_answers_details,
            "score": score,
            "total": len(full_data)
        }
        user_answers_step1_collection.insert_one(document)

    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results
    })

# endpoint to retrieve a user's incorrect answers


@app.route('/api/incorrect_answers_step1', methods=['GET'])
@login_required
def get_user_incorrect_answers():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    user_id = session['user_id']
    user_step1_attempts = list(user_answers_step1_collection.find(
        {"user_id": user_id},
        {"_id": 0, "incorrect_answers": 1, "timestamp": 1,
            "score": 1, "total_questions": 1}
    ).sort("timestamp", -1).limit(1))  # Sort by most recent first ))

    # Convert datetime to string for JSON serialization
    # This loop will run at most once, if an attempt is found
    for attempt_data in user_step1_attempts:
        attempt_data['timestamp'] = attempt_data['timestamp'].isoformat()

    # user_step2_attempts will be a list containing either:
    # 1. The single most recent attempt object (if one exists)
    # 2. An empty list (if no attempts exist for the user)
    return jsonify(user_step1_attempts)


# --------------------------
# Step 2 Basic Quiz
# --------------------------
# Endpoint to get all questions from the step2basic.json file
@app.route('/api/step2/basic', methods=['GET'])
@login_required
def get_step2_basic_quiz_questions():
    return jsonify(step2_basic_questions())


# Endpoint to get user answers and evaluate
@app.route('/api/step2/basic/submit', methods=['POST'])
def submit_step2_basic_quiz():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = submitted_data.get("answers", {})
    full_data = step2_basic_questions_ans()
    results = []
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1

        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })
    feedback_message = ""
    if score >= 15:  # Assuming 15 is the passing score for the basic quiz
        feedback_message = "Congratulations! You have passed the quiz. You are good to go with the next step."
    else:
        feedback_message = "Your score is less. Please try again. You can do it."

    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "feedback_message": feedback_message
    })


# --------------------------
# Step 2 Core
# --------------------------
@app.route('/api/step2core', methods=['GET'])
@login_required
def get_sample_questions():
    # Return only questions and options (for quiz display)
    return jsonify(get_sampletest_questions())

# Endpoint to get user answers and evaluate


@app.route('/api/step2core/submit', methods=['POST'])
def step2_core_submit():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400

    user_answers = submitted_data.get("answers", {})
    full_data = get_sampletest_qa()
    results = []
    incorrect_answers_details_step2 = []
    score = 0

    # Process answers and collect incorrect ones
    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]

        if correct:
            score += 1
        else:
            incorrect_answers_details_step2.append({
                "question": q["question"],
                "user_answer": user_answer,
                "correct_answer": q["answer"],
                "explanation": q["explanation"]
            })

        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })

        # Store incorrect answers in a database
        if incorrect_answers_details_step2 and 'user_id' in session:
            user_id = session['user_id']
            document = {
                "user_id": user_id,
                "timestamp": datetime.datetime.now(),
                "incorrect_answers": incorrect_answers_details_step2,
                "score": score,
                "total_questions": len(full_data)
            }
            user_answers_step2_collection.insert_one(document)

    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "feedback_message": "Great job!" if score/len(full_data) >= 0.7 else "Keep practicing!"
    })

# Endpoint to retrive user's incorrect aswers


@app.route('/api/incorrect_answers_step2', methods=['GET'])
@login_required
def get_user_incorrect_answers_step2():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    user_id = session['user_id']
    # Find the most recent attempt by adding .limit(1)
    user_step2_attempts = list(user_answers_step2_collection.find(
        {"user_id": user_id},
        {"_id": 0, "incorrect_answers": 1, "timestamp": 1,
            "score": 1, "total_questions": 1}
    ).sort("timestamp", -1).limit(1))  # Added .limit(1) here

    # Convert datetime to string for JSON serialization
    # This loop will run at most once, if an attempt is found
    for attempt_data in user_step2_attempts:
        attempt_data['timestamp'] = attempt_data['timestamp'].isoformat()

    # user_step2_attempts will be a list containing either:
    # 1. The single most recent attempt object (if one exists)
    # 2. An empty list (if no attempts exist for the user)
    return jsonify(user_step2_attempts)

# --------------------------
# Step 3 Basic
# --------------------------


# Endpoint to get all questions from the step3basic.json file
@app.route('/api/step3/basic', methods=['GET'])
@login_required
def get_step3_basic_quiz_questions():
    return jsonify(step3_basic_questions())


# Endpoint to get user answers and evaluate
@app.route('/api/step3/basic/submit', methods=['POST'])
def submit_step3_basic_quiz():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = submitted_data.get("answers", {})
    full_data = step3_basic_full()
    results = []
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1

        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })
    feedback_message = ""
    if score >= 15:  # Assuming 15 is the passing score for the basic quiz
        feedback_message = "Congratulations! You have passed the quiz. You are good to go with the next step."
    else:
        feedback_message = "Your score is less. Please try again. You can do it."
    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "feedback_message": feedback_message  # Add the message here
    })

# --------------------------
# Step 3 FIP (Foundations of Independent Practice.)
# --------------------------


# Endpoint to get all questions from the fip.json file
@app.route('/api/fip', methods=['GET'])
@login_required
def get_fip_quiz_questions():
    return jsonify(get_fip_questions())


# Endpoint to get user answers and evaluate
@app.route('/api/fip/submit', methods=['POST'])
def submit_fip_quiz():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = submitted_data.get("answers", {})
    full_data = get_fip_qa()

    results = []
    incorrect_answers_details_fip = []  # Store details for AI feedback
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1

        if not correct:
            incorrect_answers_details_fip.append({
                "question": q["question"],
                "user_answer": user_answer,
                "correct_answer": q["answer"],
                "explanation": q["explanation"]
            })
        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })

    # Store user answers in the new collection
    if incorrect_answers_details_fip and 'user_id' in session:
        user_id = session['user_id']
        document = {
            "user_id": user_id,
            "timestamp": datetime.datetime.now(),
            "incorrect_answers": incorrect_answers_details_fip,
            "score": score,
            "total_questions": len(full_data)
        }
        user_answers_fip_collection.insert_one(document)

    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results
    })

# Endpoint to retrive user's incorrect answers


@app.route('/api/incorrect_answers_fip', methods=['GET'])
@login_required
def get_user_incorrect_answers_fip():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    user_id = session['user_id']
    # Find the most recent attempt by adding .limit(1)
    user_fip_attempts = list(user_answers_fip_collection.find(
        {"user_id": user_id},
        {"_id": 0, "incorrect_answers": 1,  "timestamp": 1,
            "score": 1, "total_questions": 1}
    ).sort("timestamp", -1).limit(1))  # Added .limit(1) here

    # Convert datetime to string for JSON serialization
    # This loop will run at most once, if an attempt is found
    for attempt_data in user_fip_attempts:
        attempt_data['timestamp'] = attempt_data['timestamp'].isoformat()

    return jsonify(user_fip_attempts)


# --------------------------
# Step 3 ACM (Advanced Clinical Medicine)
# --------------------------
# Endpoint to get all questions from the acm.json file
@app.route('/api/acm', methods=['GET'])
@login_required
def get_acm_quiz_questions():
    return jsonify(acm_questions())


# Endpoint to get user answers and evaluate
@app.route('/api/acm/submit', methods=['POST'])
def submit_acm_quiz():
    submitted_data = request.get_json()
    if not submitted_data or "answers" not in submitted_data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = submitted_data.get("answers", {})
    full_data = acm_qa()
    results = []
    incorrect_answers_details_acm = []
    score = 0
    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1
        if not correct:
            incorrect_answers_details_acm.append({
                "question": q["question"],
                "user_answer": user_answer,
                "correct_answer": q["answer"],
                "explanation": q["explanation"]
            })

        results.append({
            "id": qid,
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })

    # Store user answers in the new collection
    if incorrect_answers_details_acm and 'user_id' in session:
        user_id = session['user_id']
        document = {
            "user_id": user_id,
            "timestamp": datetime.datetime.now(),
            "incorrect_answers": incorrect_answers_details_acm,
            "score": score,
            "total_questions": len(full_data)
        }
        user_answers_acm_collection.insert_one(document)
    # AI Feedback
    ai_feedback = ""
    if incorrect_answers_details_acm:
        prompt = """ As a USMLE tutor, please analyze the following incorrect answers from a practice quiz and provide feedback on specific topics or concepts the student should focus on for improvement. Be concise and actionable.\n\nIncorrect Answers:\n"""
        for item in incorrect_answers_details_acm:
            prompt += f"- Question: {item['question']}\n"
            prompt += f"  User Answer: {item['user_answer']}\n"
            prompt += f"  Correct Answer: {item['correct_answer']}\n"
            prompt += f"  Explanation: {item['explanation']}\n\n"

        ai_feedback = get_chat_response(prompt)

    return jsonify({
        "score": score,
        "total": len(full_data),
        "ai_feedback": ai_feedback,  # Include AI feedback in the response
        "results": results
    })

# Endpoint to retrive the user's incorrect answers


@app.route('/api/incorrect_answers_acm', methods=['GET'])
def get_user_incorrect_answers_acm():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    user_id = session['user_id']

    # Find the most recent attempt by adding .limit(1)
    user_acm_attempts = list(user_answers_acm_collection.find(
        {"user_id": user_id},
        {"_id": 0, "incorrect_answers": 1, "timestamp": 1,
            "score": 1, "total_questions": 1}
    ).sort("timestamp", -1).limit(1))

    # Convert datetime to string for JSON serialization
    # This loop will run at most once, if an attempt is found

    for attempt_data in user_acm_attempts:
        attempt_data['timestamp'] = attempt_data['timestamp'].isoformat()

    return jsonify(user_acm_attempts)

# Analyze with AI


@app.route('/api/analyze-with-ai', methods=['POST'])
@login_required
def analyze_with_ai():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()
    if not data or "prompt_type" not in data:
        return jsonify({"message": "Prompt type required"}), 400

    user_id = session['user_id']

    # Determine which collection to use based on the selected radio button

    collection_type = data['collection_type']
    if collection_type == 'step1':
        collection = user_answers_step1_collection
    elif collection_type == 'step2':
        collection = user_answers_step2_collection
    elif collection_type == 'fip':
        collection = user_answers_fip_collection
    elif collection_type == 'acm':
        collection = user_answers_acm_collection
    else:
        return jsonify({"message": "Invalid collection type"}), 400

    user_answers = list(collection.find(
        {"user_id": user_id},
        {"_id": 0, "incorrect_answers": 1}
        # Now only gets the single most recent attempt
    ).sort("timestamp", -1).limit(1))

    if not user_answers:
        return jsonify({"message": "No incorrect answers found"}), 404

    # Prepare context from incorrect answers
    context = "\n".join(
        f"Question: {item['question']}\nYour Answer: {item['user_answer']}\nCorrect Answer: {item['correct_answer']}\nExplanation: {item['explanation']}"
        for attempt in user_answers
        for item in attempt['incorrect_answers']
    )

    # Define prompts
    prompts = {
        "resources": f"""Based on these incorrect answers, suggest 3-5 specific, free, reputable online learning resources that directly address the weak areas.

        For each resource, provide:
        - A real, working URL to the resource (no placeholders or example URLs)
        - The resource name as a markdown link to the URL
        - A brief explanation of why it is relevant

        Only include resources that are freely accessible and reputable (such as Khan Academy, MedEd, offical medical association sites, etc).

        Incorrect Answers:
        {context}

        Provide output in this exact format:
        - [Resource 1 Name](https://actual-url.com) - Brief reason why it's relevant
        - [Resource 2 Name](https://actual-url.com) - Brief reason how it improves understanding""",

        "practice": f"""Based on these incorrect answers, suggest 3-5 specific free practice resources (with URLs) that help reinforce learning. Provide markdown links and a brief reason why they are beneficial.

        Incorrect Answers:
        {context}

        Provide output in this exact format:
        - [Resource 1 Name](URL) - Focus area it strengthens

        - [Resource 2 Name](URL) - Type of questions included""",

        "questions": f"""      

        You are a USMLE Step 1 medical tutor. Based on the following incorrect answers, generate targeted concept reviews and one question per topic.

        Incorrect answers:
        {context}

        For EACH incorrect concept, respond with a JSON array of objects. Each object should include:
        - "concept_name": The concept/topic name
        - "concept_summary": 1-2 sentence explanation of the core concept
        - "question": A USMLE-style multiple choice question (as a string)
        - "options": An array of 4 answer choices (A, B, C, D)
        - "answer": The correct letter (e.g., "B")
        - "explanation": 1-2 sentence explanation of why the answer is correct

        Requirements:
        - One object per incorrect concept
        - Use clear medical terminology
        - Explanations concise but accurate
        - Questions should be typical Step 1 difficulty
        - Output only pure JSON. Do not include markdown, code blocks, quotes, or explanatory text.

        """
    }

    prompt_type = data['prompt_type']
    custom_prompt = data.get('custom_prompt', '')

    if prompt_type == 'custom' and custom_prompt:
        final_prompt = f"User's incorrect answers:\n{context}\n\nUser's question: {custom_prompt}"
    else:
        final_prompt = prompts.get(prompt_type, prompts['resources'])

    # Call Gemini API
    try:
        gemini_response = get_chat_response(final_prompt)
        return jsonify({"response": gemini_response})
    except Exception as e:
        return jsonify({"message": f"AI analysis failed: {str(e)}"}), 500

# --------------------------
# Route 8: Chat Support
# --------------------------
# Changed route to /api/chat for consistency


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()  # Get the JSON data from the request
    if not data or "query" not in data:
        return jsonify({"message": "Missing query in request body"}), 400
    user_query = data.get("query", "")  # Get the user query from the JSON data
    # Get the response from the chatbot
    response = get_chat_response(user_query)
    return jsonify({"response": response})  # Return the response as JSON

# Dashboard


@app.route('/api/dashboard', methods=['GET'])
@login_required
def get_dashboard_data():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    user_id = session['user_id']

    # Define collections and labels
    quiz_types = [
        {
            "label": "Step 1",
            "collection": user_answers_step1_collection
        },
        {
            "label": "Step 2",
            "collection": user_answers_step2_collection
        },
        {
            "label": "FIP",
            "collection": user_answers_fip_collection
        },
        {
            "label": "ACM",
            "collection": user_answers_acm_collection
        }
    ]

    scores = {}
    latest_attempt = None
    latest_timestamp = None

    # For each quiz type, get the most recent attempt
    for quiz in quiz_types:
        attempt = quiz["collection"].find_one(
            {"user_id": user_id},
            sort=[("timestamp", -1)]
        )
        if attempt:
            score = attempt.get("score", 0)
            # Use 40 as a total for percentage calculation
            percentage = round((score/40)*100, 2) if score is not None else 0
            scores[quiz["label"]] = {
                "score": score,
                "percentage": percentage
            }
            # Track latest attempt for status
            if not latest_timestamp or attempt["timestamp"] > latest_timestamp:
                latest_timestamp = attempt["timestamp"]
                latest_attempt = quiz["label"]

        else:
            scores[quiz["label"]] = "Not attempted"

    return jsonify({
        "status": latest_attempt if latest_attempt else "Not attempted",
        "scores": scores
    })


if __name__ == '__main__':  # Run the Flask app
    # Set debug=True for development; set to False in production
    app.run(debug=True)
