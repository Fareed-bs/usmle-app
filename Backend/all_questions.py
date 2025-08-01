import json
# Step 1: Basic Questions
# Load all 20 questions from the JSON file
with open('step1_basic.json') as f:
    step1_basic_data = json.load(f)

# 1. Return full questions with answers and explanations (for result evaluation)


def get_basic_questions():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "answer": q.get("answer", ""),
            "explanation": q.get("explanation", "")
        }
        for i, q in enumerate(step1_basic_data)
    ]

# 2. Return only questions and options (for quiz display)


def get_basic_questions_public():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }
        for i, q in enumerate(step1_basic_data)
    ]

# Step 1: Core questions


with open('step1_core.json', encoding='utf-8') as f:
    step1_core_data = json.load(f)


def get_dataset_questions():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", [])

        }
        for i, q in enumerate(step1_core_data)
    ]


def get_dataset_qa():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),  # Corrected typo from "questio"
            "options": q.get("options", []),
            "answer": q.get("answer", ""),
            "explanation": q.get("explanation", "")
        }
        for i, q in enumerate(step1_core_data)
    ]


# Step 2: Basic Questions
with open('step2_basic.json') as f:
    step2_basic_data = json.load(f)

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
        for i, q in enumerate(step2_basic_data)
    ]

# 2. Return only questions and options (for quiz display)


def step2_basic_questions():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }
        for i, q in enumerate(step2_basic_data)
    ]


# Step 2: Core Questions
with open('step2_core.json', encoding='utf-8') as f:
    step2_core_data = json.load(f)

# The JSON file is expected to contain a list of dictionaries, each with a question, options, answer, and explanation
# The script defines two functions to extract questions and answers from the loaded data
# The first function returns a list of dictionaries with question IDs, questions, and options


def get_sampletest_questions():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", [])

        }
        for i, q in enumerate(step2_core_data)
    ]

# The second function returns a list of dictionaries with question IDs, questions, options, answers, and explanations


def get_sampletest_qa():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "answer": q.get("answer", ""),
            "explanation": q.get("explanation", "")
        }
        for i, q in enumerate(step2_core_data)
    ]


# Step3: Basic Questions
with open('step3_basic.json') as f:
    step3_basic_data = json.load(f)
    # Load the JSON data from the file

# 1. Return only questions and options from the JSON data


def step3_basic_questions():
    return [
        {
            "id": i + 1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }
        for i, q in enumerate(step3_basic_data)
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
        for i, q in enumerate(step3_basic_data)
    ]


# Step 3: Core FIP Questions
with open('step3_fip.json', encoding='utf-8') as f:
    step3_fip_data = json.load(f)

# Function to get questions and options


def get_fip_questions():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", [])

        }
        for i, q in enumerate(step3_fip_data)
    ]

# Function to get question along with its options and answer


def get_fip_qa():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),  # Corrected typo from "questio"
            "options": q.get("options", []),
            "answer": q.get("answer", ""),
            "explanation": q.get("explanation", "")
        }
        for i, q in enumerate(step3_fip_data)
    ]


# Step 3: Core ACM Questions
with open('step3_acm.json', encoding='utf-8') as f:
    step3_acm_data = json.load(f)

# Function to extract questions and options


def acm_questions():
    return [
        {
            "id": i+1,
            "question": q.get("question", ""),
            "options": q.get("options", [])
        }
        for i, q in enumerate(step3_acm_data)
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
        for i, q in enumerate(step3_acm_data)
    ]
