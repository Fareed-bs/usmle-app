import json

# Load all 20 questions from the JSON file
with open('step2basic.json') as f:
    data = json.load(f)

# 1. Return full questions with answers and explanations (for result evaluation)
def step2_basic_questions_ans():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "answer": q.get("answer", ""),
            "explanation": q.get("explanation", "")
        }
        for i, q in enumerate(data)
    ]

# 2. Return only questions and options (for quiz display)
def step2_basic_questions():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }
        for i, q in enumerate(data)
    ]
