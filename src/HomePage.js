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
          <div className="feature-card">
            <h3>📚 Practice Questions</h3>
            <p>Access thousands of high-yield practice questions for all USMLE steps.</p>
            <Link to="/usmle/quiz" className="btn btn-primary">Start Practicing</Link>
          </div>
          
          <div className="feature-card">
            <h3>💬 AI Chat Support</h3>
            <p>Get instant explanations and study help from our AI assistant.</p>
            <Link to="/usmle/chat" className="btn btn-secondary">Chat Now</Link>
          </div>
          
          <div className="feature-card">
            <h3>📊 Performance Analytics</h3>
            <p>Track your progress and identify areas for improvement.</p>
            <Link to="/usmle/dashboard" className="btn btn-tertiary">View Dashboard</Link>
          </div>
        </section>

        <section className="quick-links">
          <h2>Quick Access</h2>
          <div className="link-buttons">
            <button 
              className="btn btn-step btn-step-1"
              onClick={() => navigate('/usmle/basicquiz')}
            >
              Step 1: Basic Sciences
            </button>
            <button 
              className="btn btn-step btn-step-2"
              onClick={() => navigate('/usmle/step2basic')}
            >
              Step 2: Clinical Knowledge
            </button>
            <button 
              className="btn btn-step btn-step-3"
              onClick={() => navigate('/usmle/step3basic')}
            >
              Step 3: Patient Care
            </button>
          </div>
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
