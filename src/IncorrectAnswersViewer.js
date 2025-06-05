import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const IncorrectAnswersViewer = () => {
  const [selectedQuizType, setSelectedQuizType] = useState('step1');
  const [incorrectAnswers, setIncorrectAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user from AuthContext
  const isAuthenticated = !!user; // Derive isAuthenticated status
  const navigate = useNavigate();

  const quizTypes = [
    { value: 'step1', label: 'Step 1 Core' },
    { value: 'step2', label: 'Step 2 Core' },
    { value: 'fip', label: 'Step 3 FIP' }
  ];

  useEffect(() => {
    // ProtectedRoute should handle this, but as a safeguard:
    // If user is not available (which means not authenticated after ProtectedRoute's loading)
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchIncorrectAnswers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let endpoint;
        switch (selectedQuizType) {
          case 'step1':
            endpoint = '/api/incorrect_answers_step1';
            break;
          case 'step2':
            endpoint = '/api/incorrect_answers_step2';
            break;
          case 'fip':
            endpoint = '/api/incorrect_answers_fip';
            break;
          default:
            endpoint = '/api/incorrect_answers_step1';
        }

        const response = await axios.get(endpoint, {
          withCredentials: true
        });
        
        if (response.data && response.data.length > 0) {
          // The API returns an array of attempts, we take the most recent one
          const mostRecentAttempt = response.data[0];
          setIncorrectAnswers(mostRecentAttempt.incorrect_answers || []);
        } else {
          setIncorrectAnswers([]);
        }
      } catch (err) {
        console.error('Error fetching incorrect answers:', err);
        setError(err.response?.data?.message || 'Failed to fetch incorrect answers');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIncorrectAnswers();
    // Depend on `user` instead of the previously undefined `isAuthenticated`
  }, [selectedQuizType, user, navigate]);

  const handleQuizTypeChange = (type) => {
    setSelectedQuizType(type);
  };

  if (!user) { // Check against user object
    return null; // Already handled by useEffect redirect
  }

  return (
    <div className="incorrect-answers-container">
      <h2 className="page-title">Review Your Incorrect Answers</h2>
      
      <div className="quiz-type-selector">
        {quizTypes.map((type) => (
          <button
            key={type.value}
            className={`quiz-type-btn ${selectedQuizType === type.value ? 'active' : ''}`}
            onClick={() => handleQuizTypeChange(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-message">Loading your incorrect answers...</div>}
      
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && incorrectAnswers.length === 0 && (
        <div className="no-answers-message">
          No incorrect answers found for this quiz type. You either haven't taken this quiz yet or got everything right!
        </div>
      )}

      {!loading && !error && incorrectAnswers.length > 0 && (
        <div className="answers-list">
          <div className="summary-header">
            <h3>{quizTypes.find(t => t.value === selectedQuizType)?.label} Incorrect Answers</h3>
            <p>You got {incorrectAnswers.length} questions wrong in your last attempt</p>
          </div>
          
          {incorrectAnswers.map((item, index) => (
            <div key={index} className="answer-card incorrect">
              <div className="question-section">
                <h4 className="question-text">{item.question}</h4>
              </div>
              
              <div className="answer-section">
                <div className="user-answer">
                  <span className="label">Your Answer:</span>
                  <span className="value wrong">{item.user_answer || "No answer provided"}</span>
                </div>
                
                <div className="correct-answer">
                  <span className="label">Correct Answer:</span>
                  <span className="value correct">{item.correct_answer}</span>
                </div>
              </div>
              
              {item.explanation && (
                <div className="explanation-section">
                  <h5>Explanation:</h5>
                  <p>{item.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncorrectAnswersViewer;