import React, { useEffect, useState } from "react";
import axios from "axios";

const Step3Basic = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false); // New state for quiz start
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission loading


  const fetchQuestions = () => {
    setLoading(true);
    setError(null);
    axios.get("http://localhost:5000/api/step3/basic", { withCredentials: true })
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

  const handleOptionChange = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleSubmit = async () => {
    if (submitted || isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const response = await axios.post(
        "http://localhost:5000/api/step3/basic/submit",
        { answers },
        { withCredentials: true}
      );
      setError(null);
      setResults(response.data);
      setAiFeedback(response.data.ai_feedback || "");
      setSubmitted(true);
      setQuizStarted(false); // Stop the timer
    } catch (err) {
      console.error("Submission error", err);
      setError("Failed to submit answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setAiFeedback("");
    setError(null);
    setQuizStarted(false); // Reset quiz start state
    setIsSubmitting(false); // Reset submitting state
    fetchQuestions();
  };

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
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <h1>USMLE Step 3 Starter Quiz</h1>

      {error && !loading && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {!quizStarted && !submitted && questions.length > 0 && (
        <div style={{ textAlign: "left", margin: "2rem 0" }}>
          <h2>Overview:</h2>
          <p>1. Designed to simulate USMLE Step 3-style questions.</p>
          <p>2. Contains 20 basic-level questions.</p>
          <p>3. Serves as a warm-up quiz before the main (core Step 3 FIP) quiz.</p>
          <p>4. Ideal for light practice and familiarization with the question format.</p>
          <h2>Click Start to begin</h2>          
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
        <form onSubmit={e => e.preventDefault()}>
          {questions.map((q) => ( // Changed from paginatedQuestions to questions
            <div key={q.id} style={{ marginBottom: "1.5rem" }}>
              <h3>
                <span style={{ color: "red" }}>Q{q.id}.</span>{" "}
                <span style={{ whiteSpace: "pre-wrap" }}>{q.question}</span>
              </h3>

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

          {/* Submit button now appears directly after questions */}
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{ padding: "0.8rem 2rem", fontSize: "1.1rem" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  Submitting...
                  <span style={{ marginLeft: "8px", display: "inline-block" }}>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(0,0,0,0.1)",
                      borderLeftColor: "#000",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 1s linear infinite"
                    }}></div>
                  </span>
                </>
              ) : "Submit"}
            </button>
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
              <h3>
                <span style={{ color: "red" }}>Q{res.id}.</span>{" "}
                <span style={{ whiteSpace: "pre-wrap" }}>{res.question}</span>
              </h3>

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

export default Step3Basic;