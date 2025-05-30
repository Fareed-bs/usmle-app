import os
import google.generativeai as genai

# Load Gemini API Key from environment variable
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize the Gemini model
model = genai.GenerativeModel("gemini-1.5-flash-latest")

def get_chat_response(user_query):

    """
Generates a response to the user's query using an AI model.

Purpose:
    Act as a knowledgeable and supportive USMLE tutor chatbot, assisting students 
    with their medical exam preparation.

Behavior Guidelines:
    - Focus only on USMLE-related topics (e.g., medical concepts, test strategies).
    - Offer accurate, concise, and clearly structured explanations.
    - Maintain a friendly, encouraging, and professional tone.

Response Formatting:
    - Use clear and concise language.
    - Employ bullet points, numbered lists, or headings where appropriate.
    - Emphasize key facts and important distinctions.
    - Avoid excessive jargon; explain complex terms in simple language.

Return:
    str: The AI-generated response tailored to the user's query. 
         If an error occurs during generation, return a default error message.
"""

    try:
        response = model.generate_content(user_query)

        # Safely access the text content
        if hasattr(response, 'text') and response.text:
            return response.text.strip()
        elif hasattr(response, 'candidates') and response.candidates:
            # Fallback if 'text' is missing but candidates exist
            return response.candidates[0].content.parts[0].text.strip()
        else:
            return "Sorry, I couldn't generate a response."

    except Exception as e:
        print("Gemini error:", e)
        return "Sorry, there was an issue with the AI response."



