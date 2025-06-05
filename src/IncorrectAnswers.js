import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Make sure to install axios: npm install axios or yarn add axios

/**
 * Fetches and displays incorrect answers for the most recent attempt of a specified quiz.
 *
 * @param {object} props - The component's props.
 * @param {string} props.quizType - The type of quiz (e.g., "step1", "step2", "fip").
 *                                  This determines which API endpoint to call.
 */
function IncorrectAnswers({ quizType }) {
  const [attemptData, setAttemptData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quizType) {
      setError("Quiz type not specified.");
      return;
    }

    const fetchIncorrectAnswers = async () => {
      setIsLoading(true);
      setError(null);
      setAttemptData(null);

      let apiUrl = '';
      switch (quizType.toLowerCase()) {
        case 'step1':
          apiUrl = '/api/incorrect_answers_step1';
          break;
        case 'step2':
          apiUrl = '/api/incorrect_answers_step2';
          break;
        case 'fip':
          apiUrl = '/api/incorrect_answers_fip';
          break;
        // Note: For 'acm', a dedicated endpoint like '/api/incorrect_answers_acm'
        // would be needed, similar to the others, to fetch the most recent attempt's
        // incorrect answers directly. The current /api/acm/submit stores them,
        // but there isn't a GET endpoint to retrieve just the latest incorrect answers.
        default:
          setError(`Unsupported or not yet implemented quiz type for incorrect answers: ${quizType}`);
          setIsLoading(false);
          return;
      }

      try {
        // Assuming your Flask backend is running on the same domain or proxied.
        // If not, use the full URL: e.g., http://localhost:5000${apiUrl}
        const response = await axios.get(apiUrl, { withCredentials: true });

        // The API returns an array, which should contain 0 or 1 item (the most recent attempt)
        if (response.data && response.data.length > 0) {
          setAttemptData(response.data[0]);
        } else {
          setAttemptData(null); // No attempts or no incorrect answers for the last attempt
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError("Unauthorized. Please log in to view your results.");
        } else {
          setError(err.response?.data?.message || "Failed to fetch incorrect answers. Please try again later.");
        }
        console.error(`Error fetching incorrect answers for ${quizType}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncorrectAnswers();
  }, [quizType]); // Re-fetch if quizType changes

  if (isLoading) {
    return <p>Loading incorrect answers for {quizType.toUpperCase()}...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!attemptData || !attemptData.incorrect_answers || attemptData.incorrect_answers.length === 0) {
    return <p>No incorrect answers found for your most recent {quizType.toUpperCase()} quiz attempt, or you haven't attempted this quiz yet.</p>;
  }

  return (
    <div className="incorrect-answers-container">
      <h2>Incorrect Answers: {quizType.toUpperCase()} Quiz (Most Recent)</h2>
      <p><strong>Your Score:</strong> {attemptData.score} / {attemptData.total_questions}</p>
      <p><strong>Attempted On:</strong> {new Date(attemptData.timestamp).toLocaleString()}</p>
      <h3>Details:</h3>
      <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {attemptData.incorrect_answers.map((item, index) => (
          <li key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <p><strong>Question {index + 1}:</strong> {item.question}</p>
            <p><strong>Your Answer:</strong> <span style={{ color: 'red' }}>{item.user_answer || "Not answered"}</span></p>
            <p><strong>Correct Answer:</strong> <span style={{ color: 'green' }}>{item.correct_answer}</span></p>
            <p><strong>Explanation:</strong> {item.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default IncorrectAnswers;