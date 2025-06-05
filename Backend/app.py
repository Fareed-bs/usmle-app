from flask import Flask, jsonify, request, session
from flask_cors import CORS
from chatbot import get_chat_response
from basic_questions import get_basic_questions, get_basic_questions_public # type: ignore
from core import get_dataset_questions, get_dataset_qa # type: ignore
from step2basic import step2_basic_questions, step2_basic_questions_ans # type: ignore
from step2core import get_sampletest_questions, get_sampletest_qa # type: ignore
from step3basic import step3_basic_questions, step3_basic_full # type: ignore
from fip import get_fip_questions, get_fip_qa # type: ignore
from acm import acm_questions, acm_qa # type: ignore
import datetime
import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import timedelta
app = Flask(__name__)

# --- Configuration ---
# IMPORTANT: Use environment variables for sensitive data in production!
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_very_secret_key_for_dev')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Session will expire after 7 days

CORS(app, supports_credentials=True) # Allow credentials for session cookies

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

#Login
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

#Logout
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

from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --------------------------
# Route 1: BasicQuiz from basic.json
# --------------------------
@app.route('/api/basic', methods=['GET']) #Create an endpoint to get all questions from the basic.json file
@login_required
def get_basic_quiz_questions():
    return jsonify(get_basic_questions_public())

@app.route('/api/basic/submit', methods=['POST'])
def submit_basic_quiz():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    
    user_answers = data.get("answers", {})
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


## --------------------------
# Route 2: Step-1 Core Quiz from kaggle dataset
# --------------------------

#Endpoint to get all questions from the dataset
@app.route('/api/questions',methods=['GET'])
@login_required
def get_questions():
    # Return only questions and options (for quiz display)
    return jsonify(get_dataset_questions())

#Endpoint to get user answers and evaluate 
@app.route('/api/submit',methods=['POST'])
@login_required
def submit():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    
    user_answers = data.get("answers", {})
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
        user_id= session['user_id']
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
        {"_id": 0, "incorrect_answers": 1, "timestamp": 1, "score": 1, "total_questions": 1}
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
# Route 3: Step 2 Basic Quiz
# --------------------------
@app.route('/api/step2basic', methods=['GET']) #Create an endpoint to get all questions from the step2basic.json file
@login_required
def get_step2_basic_quiz_questions():
    return jsonify(step2_basic_questions()) 
      

@app.route('/api/step2basic/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate
def submit_step2_basic_quiz():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = data.get("answers", {})
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
    if score >= 15: # Assuming 15 is the passing score for the basic quiz
        feedback_message = "Congratulations! You have passed the quiz. You are good to go with the next step."
    else:
        feedback_message = "Your score is less. Please try again. You can do it."   
        
    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "feedback_message": feedback_message # Add the message here
    })


# --------------------------
# Route 4: Step 2 Core
# --------------------------
@app.route('/api/step2core',methods=['GET'])
@login_required
def get_sample_questions():
    # Return only questions and options (for quiz display)
    return jsonify(get_sampletest_questions())

#Endpoint to get user answers and evaluate 
@app.route('/api/step2core/submit',methods=['POST'])
def step2_core_submit():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    
    user_answers = data.get("answers", {})
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
                "user_id" : user_id,
                "timestamp" : datetime.datetime.now(),
                "incorrect_answers" : incorrect_answers_details_step2,
                "score" : score,
                "total_questions" : len(full_data)
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
        {"_id": 0, "incorrect_answers": 1, "timestamp": 1, "score": 1, "total_questions": 1}
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
# Route 5: Step 3 Basic
# --------------------------
@app.route('/api/step3basic', methods=['GET']) #Create an endpoint to get all questions from the step3basic.json file
@login_required
def get_step3_basic_quiz_questions():
    return jsonify(step3_basic_questions())

@app.route('/api/step3basic/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate
def submit_step3_basic_quiz():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = data.get("answers", {})
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
    if score >= 15: # Assuming 15 is the passing score for the basic quiz
        feedback_message = "Congratulations! You have passed the quiz. You are good to go with the next step."
    else:
        feedback_message = "Your score is less. Please try again. You can do it."   
    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "feedback_message": feedback_message # Add the message here
    })

# --------------------------
# Route 6: Step 3 FIP (Foundations of Independent Practice.)
# --------------------------
@app.route('/api/fip', methods=['GET']) #Create an endpoint to get all questions from the fip.json file
@login_required
def get_fip_quiz_questions():
    return jsonify(get_fip_questions())

@app.route('/api/fip/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate
def submit_fip_quiz():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = data.get("answers", {})
    full_data = get_fip_qa()

    results = []
    incorrect_answers_details_fip = [] # Store details for AI feedback
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
        {"_id": 0, "incorrect_answers": 1,  "timestamp": 1,  "score": 1,"total_questions": 1}
    ).sort("timestamp", -1).limit(1)) # Added .limit(1) here

    # Convert datetime to string for JSON serialization
    # This loop will run at most once, if an attempt is found
    for attempt_data in user_fip_attempts:
        attempt_data['timestamp'] = attempt_data['timestamp'].isoformat()

    return jsonify(user_fip_attempts)



# --------------------------
# Route 7: Step 3 ACM (Advanced Clinical Medicine)
# --------------------------
@app.route('/api/acm', methods=['GET']) #Create an endpoint to get all questions from the acm.json file
@login_required
def get_acm_quiz_questions():
    return jsonify(acm_questions())

@app.route('/api/acm/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate
def submit_acm_quiz():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = data.get("answers", {})
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
    # --- Generate AI Feedback ---
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
        "ai_feedback": ai_feedback, # Include AI feedback in the response
        "results": results
    })

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
        return jsonify ({"message": "Invalid collection type"}), 400
    

    user_answers = list(collection.find(
        {"user_id": user_id},
        {"_id": 0, "incorrect_answers": 1}
    ).sort("timestamp", -1).limit(1))  # Now only gets the single most recent attempt

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
        "resources": f"""Based on these incorrect answers, suggest 3-5 specific free learning resources (with URLs) that would help the user improve. Format as markdown links.
        
        Incorrect Answers:
        {context}
        
        Provide output in this exact format:
        - [Resource 1 Name](URL1) - Brief reason why it's relevant
        - [Resource 2 Name](URL2) - Brief reason why it's relevant""",
        
        "practice": f"""Based on these incorrect answers, suggest 3-5 specific free practice resources (with URLs) that would help the user to attempt the practice questions. Format as markdown links.
        
        Incorrect Answers:
        {context}

        Provide output in this exact format:
        - [Resource 1 Name](URL1) - Brief reason why it's relevant
        - [Resource 2 Name](URL2) - Brief reason why it's relevant"""
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
@app.route("/api/chat", methods=["POST"]) # Changed route to /api/chat for consistency
def chat(): 
    data = request.get_json() #Get the JSON data from the request
    if not data or "query" not in data:
        return jsonify({"message": "Missing query in request body"}), 400
    user_query = data.get("query", "") #Get the user query from the JSON data
    response = get_chat_response(user_query) #Get the response from the chatbot
    return jsonify({"response": response}) #Return the response as JSON


if __name__ == '__main__': #Run the Flask app
    app.run(debug=True) # Set debug=True for development; set to False in production