import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './MainPortal.css';

const MainPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Example Google login handler
  const handleGoogleLogin = () => {
    // Redirect to your backend Google auth endpoint
    window.location.href = 'http://localhost:5000/api/auth/login/google'; 
  };

  return (
    <div className="portal-container">
      <header className="portal-header">
        <h1>AI Assistants Hub</h1>
        <div className="user-info">
          {user ? (
            <>
              <span>Welcome, {user.username}</span>
              <button onClick={logout} className="auth-button">Logout</button>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-button">Login</Link>
              <Link to="/register" className="auth-button">Register</Link>
              <button onClick={handleGoogleLogin} className="auth-button">
                Google Login
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="assistants-grid">
        <Link to="/usmle" className="assistant-card">
          <div className="assistant-icon">🏥</div>
          <h2>USMLE Assistant</h2>
          <p>Prepare for your medical licensing exams with AI-powered practice questions and analysis.</p>
        </Link>

        <div className="assistant-card coming-soon">
          <div className="assistant-icon">💻</div>
          <h2>Code Generator</h2>
          <p>Coming soon: Generate code snippets and solutions in multiple programming languages.</p>
        </div>

        <div className="assistant-card coming-soon">
          <div className="assistant-icon">✅</div>
          <h2>To-Do List</h2>
          <p>Coming soon: AI-powered task management and productivity assistant.</p>
        </div>
      </main>
    </div>
  );
};

export default MainPortal;
