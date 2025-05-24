import json

with open('step3basic.json') as f: 
    data = json.load(f)
    # Load the JSON data from the file

# 1. Return only questions and options from the JSON data
def step3_basic_questions():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }
        for i, q in enumerate(data)
    ]

# 2. Return full questions with answers and explanations (for result evaluation)
def step3_basic_full():
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