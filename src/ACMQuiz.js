import React, { useEffect, useState } from "react";
import axios from "axios";

const ACMQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [quizStarted, setQuizStarted] = useState(false); // New state for quiz start
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission loading

  const QUESTIONS_PER_PAGE = 10;
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  const fetchQuestions = () => {
    setLoading(true);
    setError(null);
    axios.get("http://localhost:5000/api/acm", {
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
    if (submitted || isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const response = await axios.post(
        "http://localhost:5000/api/acm/submit",
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
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
    setCurrentPage(1); // Reset to first page
    setIsSubmitting(false); // Reset submitting state
    fetchQuestions();
  };

  const paginatedQuestions = questions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

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
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <h1>Step 3 ACM (Advanced Clinical Medicine)</h1>
      <p>This section is after FIP (Foundations of Indipendent Practice).</p>

      {error && !loading && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {!quizStarted && !submitted && questions.length > 0 && (
        <div style={{ textAlign: "left", margin: "2rem 0" }}>
          <h2>Guidelines:</h2>
          <p>1. You will have 60 minutes to complete the quiz.</p>
          <p>2. Each question has multiple-choice answers.</p>
          <p>3. Select the best answer for each question.</p>
          <p>4. If the time runs out before submitting, the quiz will be automatically submitted.</p>
          <p>5. You can only submit once.</p>
          <p>6. Good luck!</p>
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
        <form onSubmit={e => e.preventDefault()}>
          {paginatedQuestions.map((q) => (
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

          <div style={{ display: "flex", justifyContent: "flex-start", gap: "2rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{ padding: "0.5rem 1rem", opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            {currentPage < totalPages ? (
              <button
                type="button"
                onClick={handleNextPage}
                style={{ padding: "0.5rem 1rem" }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                style={{ padding: "0.5rem 1rem" }}
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
            )}
          </div>

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
            color: timeLeft <= 300 ? "red" : "black"
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

export default ACMQuiz;