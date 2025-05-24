from flask import Flask, jsonify, request
from flask_cors import CORS
from chatbot import get_chat_response
from basic_questions import get_basic_questions, get_basic_questions_public # type: ignore
from core import get_dataset_questions, get_dataset_qa # type: ignore
from step2basic import step2_basic_questions, step2_basic_questions_ans # type: ignore
from step2core import get_sampletest_questions, get_sampletest_qa # type: ignore
from step3basic import step3_basic_questions, step3_basic_full # type: ignore
from fip import get_fip_questions, get_fip_qa # type: ignore

import os
from flask_sqlalchemy import SQLAlchemy # type: ignore
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# --- Configuration ---
# IMPORTANT: Use environment variables for sensitive data in production!
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_very_secret_key_for_dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True) # Allow credentials for session cookies

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.session_protection = "strong" # Protects against session tampering

# --------------------------
# Route 1: Home Summary
# --------------------------
@app.route('/api/home', methods=['GET'])
def home_summary():
    summary = {
        "title": "USMLE Practice App",
        "description": [
            "This application helps students prepare for the USMLE exam through interactive quizzes and chat support.",
            "This application has practice sections for the three steps of the USMLE exam. Each step has two sections:",
            "  - First section has basic science questions and answers.",
            "  - Second section has core questions that are fetched from Kaggle dataset.",
            "",  # Represents a blank line
            "You can go to 'Practice sections' to practice the questions and answers.",
            "",  # Represents a blank line
            "The app also includes a chat that helps clarify USMLE-related doubts and topics."
        ],

        "features": [
            "🎯 Quiz section with MCQs that has basic questions focuses on basic science.",
            "🧠 Core Quiz section with advanced questions from a Kaggle dataset",
            "💬 USMLE chat support for study guidance",
            "📊 Score evaluation with explanations"
        ],

        "USMLE Pattern": {
            "Step 1": {
                "description": "Basic medical sciences and principles.",
                "questions": 280,
                "duration": "8 hours",
                "format": "Multiple-choice questions (MCQs)"
            },
            "Step 2 CK": {
                "description": "Clinical knowledge and patient care.",
                "questions": 318,
                "duration": "9 hours",
                "format": "Multiple-choice questions (MCQs)"
            },
            "Step 3": {
                "description": "Patient management in ambulatory settings.",
                "questions": 233,
                "duration": "7 hours",
                "format": "Multiple-choice questions (MCQs)"
            }
        }
        
    }
    return jsonify(summary)

# --- User Model and Auth Setup ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False) # Increased length for hash

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    """Custom unauthorized handler to return JSON for API."""
    return jsonify(message="Authentication required. Please log in."), 401

# --- Database Creation Command (Run once) ---
# You can run this using Flask CLI or a separate script:
# from app import app, db
# with app.app_context():
#   db.create_all()
# print("Database tables created.")

# --------------------------
# Route 2: BasicQuiz from basic.json
# --------------------------
@app.route('/api/basic', methods=['GET']) #Create an endpoint to get all questions from the basic.json file
@login_required
def get_basic_quiz_questions():
    return jsonify(get_basic_questions_public())

@app.route('/api/basic/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate 
@login_required
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



## --------------------------
# Route 3: Core Quiz from kaggle dataset
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
    incorrect_answers_details = [] # Store details for AI feedback
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1

        if not correct:
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

    # --- Generate AI Feedback ---
    ai_feedback = ""
    if incorrect_answers_details:
        # Construct a prompt for the AI based on incorrect answers
        prompt = "As a USMLE tutor, please analyze the following incorrect answers from a practice quiz and provide feedback on specific topics or concepts the student should focus on for improvement. Be concise and actionable.\n\nIncorrect Answers:\n"
        for item in incorrect_answers_details:
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


# --------------------------
# Route 4: Step 2 Basic Quiz
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
# Route 5: Step 2 Core
# --------------------------
@app.route('/api/step2core',methods=['GET'])
@login_required
def get_sample_questions():
    # Return only questions and options (for quiz display)
    return jsonify(get_sampletest_questions())

#Endpoint to get user answers and evaluate 
@app.route('/api/step2core/submit',methods=['POST'])
@login_required
def step2_core_submit():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    
    user_answers = data.get("answers", {})
    full_data = get_sampletest_qa()
    results = []
    incorrect_answers_details = []
    score = 0

    # Process answers and collect incorrect ones
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

    # --- Improved AI Feedback Generation ---
    ai_feedback = ""
    if incorrect_answers_details:
        prompt = """As a USMLE tutor, analyze these incorrect answers and provide:
1. **Direct feedback** starting with "Focus on:" 
2. **Key concept** needing review (bolded)
3. **1-sentence explanation** of the mistake
4. **Free resource** with clickable URL

**Requirements:**
- Speak directly to the student (use "you" instead of "the student")
- Only recommend freely accessible resources (no paid/subscription content)
- Format URLs as clickable links: `[Resource Name](https://example.com)`
- Keep each concept to 3 lines maximum

**Example Output:**
**Focus on:** Heart failure classification  
**Why:** You confused NYHA Class II vs III symptoms (dyspnea on mild vs moderate exertion).  
**Resource:** [AMBOSS Heart Failure Guide](https://www.amboss.com/us/library/free-content#cardiology)

**Incorrect Answers:**"""
        
        for item in incorrect_answers_details:
            prompt += f"""
            Question: {item['question']}
            Your Answer: {item['user_answer']}
            Correct Answer: {item['correct_answer']}
            Explanation: {item['explanation']}\n"""
        
        try:
            ai_feedback = get_chat_response(prompt)
            # Post-process to ensure consistent formatting
            ai_feedback = ai_feedback.replace("The student should", "Focus on")
        except Exception as e:
            ai_feedback = f"Feedback generation failed: {str(e)}"

    return jsonify({
        "score": score,
        "total": len(full_data),
        "results": results,
        "ai_feedback": ai_feedback,
        "feedback_message": "Great job!" if score/len(full_data) >= 0.7 else "Keep practicing!"
    })

# --------------------------
# Route 6: Step 3 Basic
# --------------------------
@app.route('/api/step3basic', methods=['GET']) #Create an endpoint to get all questions from the step3basic.json file
@login_required
def get_step3_basic_quiz_questions():
    return jsonify(step3_basic_questions())

@app.route('/api/step3basic/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate
@login_required
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
# Route 7: Step 3 FIP (Foundations of Independent Practice.)
# --------------------------
@app.route('/api/fip', methods=['GET']) #Create an endpoint to get all questions from the fip.json file
@login_required
def get_fip_quiz_questions():
    return jsonify(get_fip_questions())

@app.route('/api/fip/submit', methods=['POST']) #Create an endpoint to get user answers and evaluate
@login_required
def submit_fip_quiz():
    data = request.get_json()
    if not data or "answers" not in data:
        return jsonify({"message": "Missing answers in request body"}), 400
    user_answers = data.get("answers", {})
    full_data = get_fip_qa()

    results = []
    incorrect_answers_details = [] # Store details for AI feedback
    score = 0

    for q in full_data:
        qid = str(q["id"])
        user_answer = user_answers.get(qid)
        correct = user_answer == q["answer"]
        if correct:
            score += 1

        if not correct:
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

    # --- Generate AI Feedback ---
    ai_feedback = ""
    if incorrect_answers_details:
        # Construct a prompt for the AI based on incorrect answers
        prompt = "As a USMLE tutor, please analyze the following incorrect answers from a practice quiz and provide feedback on specific topics or concepts the student should focus on for improvement. Be concise and actionable.\n\nIncorrect Answers:\n"
        for item in incorrect_answers_details:
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


# --------------------------
# Route 8: Chat Support
# --------------------------
@app.route("/api/chat", methods=["POST"]) # Changed route to /api/chat for consistency
@login_required
def chat(): 
    data = request.get_json() #Get the JSON data from the request
    if not data or "query" not in data:
        return jsonify({"message": "Missing query in request body"}), 400
    user_query = data.get("query", "") #Get the user query from the JSON data
    response = get_chat_response(user_query) #Get the response from the chatbot
    return jsonify({"response": response}) #Return the response as JSON

# --------------------------
# Route 6: Authentication
# --------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409 # Conflict

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        login_user(user) # Manages session
        return jsonify({
            "message": "Login successful",
            "user": {"id": user.id, "username": user.username}
        }), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required # Ensure user is logged in to log out
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"}), 200

@app.route('/api/auth/status', methods=['GET'])
@login_required # This will trigger unauthorized handler if not logged in
def auth_status():
    return jsonify({
        "logged_in": True,
        "user": {"id": current_user.id, "username": current_user.username}
    }), 200


if __name__ == '__main__': #Run the Flask app
    with app.app_context(): # Create database tables if they don't exist
        db.create_all()
    app.run(debug=True) # Set debug=True for development; set to False in production