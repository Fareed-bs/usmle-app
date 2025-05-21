// QuizPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [quizStarted, setQuizStarted] = useState(false); // New state for quiz start

  const fetchQuestions = () => {
    setLoading(true);
    setError(null);
    axios.get("http://localhost:5000/api/questions", {
      withCredentials: true
    })
      .then(res => setQuestions(res.data))
      .catch(err => {
        console.error("Error loading questions", err);
        setError("Failed to load questions. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let timer;
    // Only start timer if quiz is started, questions are loaded, and quiz isn't submitted
    if (quizStarted && questions.length > 0 && !submitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, questions.length, submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionChange = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleSubmit = async () => {
    if (submitted) return; // Prevent multiple submissions
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/submit",
        { answers },
        { withCredentials: true }
      );
      setError(null);
      setResults(response.data);
      setAiFeedback(response.data.ai_feedback || "");
      setSubmitted(true);
      setQuizStarted(false); // Stop the timer
    } catch (err) {
      console.error("Submission error", err);
      setError("Failed to submit answers. Please try again.");
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setAiFeedback("");
    setError(null);
    setTimeLeft(60 * 60); // Reset timer
    setQuizStarted(false); // Reset quiz start state
    fetchQuestions();
  };

  if (loading && !submitted) {
    return <p style={{ padding: "2rem", fontFamily: "Arial" }}>Loading questions...</p>;
  }

  if (error && !questions.length && !submitted) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Arial" }}>
        <h1>Step 1 Core Questions</h1>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchQuestions} style={{ padding: "0.5rem 1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", position: "relative", minHeight: "100vh" }}>
      <h1>Step 1 Core Questions</h1>
      <p>This section is after basic quiz. It contains questions that are more difficult than the basic quiz.</p>

      {error && !loading && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {!quizStarted && !submitted && questions.length > 0 && (
        <div style={{ textAlign: "left", margin: "2rem 0" }}>
          <h2>Guidelines:</h2>
          <p>1. You will have 60 minutes to complete the quiz.</p>
          <p>2. Each question has multiple-choice answers.</p>
          <p>3. Select the best answer for each question.</p>
          <p>8. If the time runs out before submitting, the quiz will be automatically submitted.</p>
          <p>4. You can only submit once.</p>
          <p>6. You can restart the quiz at any time.</p>
          <p>7. Good luck!</p>
          <h2>Ready to begin your quiz?</h2>          
          <p style={{ color: 'red' }}>You will have 60 minutes to complete {questions.length} questions.</p>
          <button 
            onClick={handleStartQuiz}
            style={{
              padding: "0.8rem 1.5rem",
              fontSize: "1.2rem",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Start Quiz
          </button>
        </div>
      )}

      {quizStarted && !submitted && questions.length > 0 && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: "1.5rem" }}>
              <h3>Q{q.id}. {q.question}</h3>
              {q.options.map((option, idx) => (
                <label key={idx} style={{ display: "block", marginLeft: "1rem" }}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => handleOptionChange(q.id, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
          <button type="submit" style={{ padding: "0.5rem 1rem" }}>Submit</button>
          
          {/* Timer display */}
          <div style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#f0f0f0",
            padding: "10px 15px",
            borderRadius: "5px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            fontWeight: "bold",
            color: timeLeft <= 300 ? "red" : "black" // Turns red when 5 minutes or less remain
          }}>
            Time Remaining: {formatTime(timeLeft)}
          </div>
        </form>
      )}

      {submitted && results && !error && (
        <div>
          <h2>Score: {results.score} / {results.total}</h2>

          {aiFeedback && (
            <div style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', border: '1px solid #007bff', borderRadius: '5px', backgroundColor: '#f0f8ff' }}>
              <h3>💡 Personalized AI Feedback:</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{aiFeedback}</p>
            </div>
          )}

          {results.results.map((res, idx) => (
            <div key={idx} style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "6px" }}>
              <h3>Q{res.id}. {res.question}</h3>
              <p><strong>Your Answer:</strong> {res.user_answer || "Not Answered"}</p>
              <p><strong>Correct Answer:</strong> {res.correct_answer}</p>
              <p style={{ color: res.is_correct ? "green" : "red" }}>
                {res.is_correct ? "Correct ✅" : "Incorrect ❌"}
              </p>
              <p><strong>Explanation:</strong> {res.explanation}</p>
            </div>
          ))}
          <button onClick={handleRestart} style={{ padding: "0.5rem 1rem", marginTop: "1rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Restart Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;