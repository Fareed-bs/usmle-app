#json library is used to handle JSON data
import json

# This script is used to load a JSON file containing questions and answers
with open('step2core.json',encoding='utf-8') as f:
    data = json.load(f)
    
# The JSON file is expected to contain a list of dictionaries, each with a question, options, answer, and explanation
# The script defines two functions to extract questions and answers from the loaded data
# The first function returns a list of dictionaries with question IDs, questions, and options
 
def get_sampletest_questions():
    return [
        {
            "id":i+1,
            "question":q.get("question",""),
            "options":q.get("options",[])
            
        }
        for i,q in enumerate(data)
        ]
    
# The second function returns a list of dictionaries with question IDs, questions, options, answers, and explanations   
def get_sampletest_qa():
    return [
        {
            "id":i+1,
            "question": q.get("question",""), 
            "options":q.get("options",[]),
            "answer":q.get("answer",""),
            "explanation":q.get("explanation", "")
        }
        for i,q in enumerate(data)
        ]
