import json

with open('fip.json') as f:
    data = json.load(f)

#Function to get questions and options
def get_fip_questions():
    return [
        {
            "id":i+1,
            "question":q.get("question",""),
            "options":q.get("options",[])
            
        }
        for i,q in enumerate(data)
        ]

#Function to get question along with its options and answer
def get_fip_qa():
    return [
        {
            "id":i+1,
            "question": q.get("question",""), # Corrected typo from "questio"
            "options":q.get("options",[]),
            "answer":q.get("answer",""),
            "explanation":q.get("explanation", "")
        }
        for i,q in enumerate(data)
        ]