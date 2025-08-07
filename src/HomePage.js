// HomePage.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to USMLE Assistant</h1>
        <p>Your comprehensive study companion for USMLE preparation</p>
      </header>

      <main className="home-main">
        <section className="features">
          <h2>Overview of Features</h2>
          <ul className="feature-list">
            <li>Practice Exams: Take quizzes for Step 1, 2, and 3 to test your knowledge.</li>
            <li>AI Tutor: Get personalized feedback, study tips, and custom questions based on your weak spots</li>         
            <li>Progress Tracking: View your quiz scores and monitor improvement with a personal dashboard.</li>
            <li>Check left sidebar for practice questions</li>
          </ul>
        </section>

        <section className="analyze-with-ai">
          <h2>Analyze with AI</h2>
          <p>The AI analyzes the results dynamically using the Gemini LLM and suggests areas where the student needs improvement.</p>
          <ul>
            <li>The AI analyzes your incorrect answers and provides direct links to free resources that explain the exact concepts you missed.</li>
            <li>Based on your weak areas, the AI generates brand-new, USMLE-style questions, giving you focused practice where you need it most.</li>
          </ul>
        </section>

        {!user && (
          <section className="auth-cta">
            <h2>Ready to boost your USMLE preparation?</h2>
            <p>Create a free account to save your progress and unlock premium features.</p>
            <div className="auth-buttons">
              <Link to="/register" className="btn btn-primary">Sign Up Free</Link>
              <Link to="/login" className="btn btn-outline">Log In</Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePage;