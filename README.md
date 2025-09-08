# AI Portal Application

- A central hub for multiple AI assistants.
- User can select the desired assistant on the main portal.
- Current version: Includes USMLE Assistant.

# 1. USMLE Quiz App

- An online platform where medical students can take a variety of practice quizzes for different USMLE steps (Step 1, Step 2, Step 3) to test their knowledge.

## Features

- Multiple-choice questions with explanations
- Real-time quiz interface
- User authentication (Google Login supported)
- Result analysis & feedback
- User dashboard
- MongoDB backend for data storage
- React-based frontend for smooth UX

### Analyze with AI

- The AI analyzes the results dynamically using the Gemini LLM and suggest areas where the student needs improvement.
- Get Targeted Learning Resources: The AI analyzes your incorrect answers and provides direct links to free that explain the exact concepts you missed.
- Generate Custom Practice Questions: Based on your weak areas, the AI generates brand-new, USMLE-style questions, giving you focused practice where you need it most.

## Tech Stack

- Frontend: React.js (MainPortal.js)
- Backend: Flask (Python)
- Database: MongoDB (for storing sessions / users / chat history)
- LLM Integration: Gemini API
