import json

with open('acm.json',encoding='utf-8') as f:
    data = json.load(f)

# Function to extract questions and options
def acm_questions():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }   
        for i, q in enumerate(data)
    ]

# Function to extract questions, options, answers, and explanations
def acm_qa():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "answer": q.get("answer", ""),
            "explanation": q.get("explanation", "")
        }
        for i, q in enumerate (data)
    ]
