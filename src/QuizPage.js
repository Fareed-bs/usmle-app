// QuizPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuestions = () => {
    setLoading(true);
    setError(null); // Clear previous errors
    axios.get("http://localhost:5000/api/questions", {
      withCredentials: true // Add this to send session cookie
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

  const handleOptionChange = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  };

  const handleSubmit = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/submit",
      { answers },  // Data object
      { withCredentials: true }  // Config object as third parameter
    );
    setError(null); // Clear previous submission errors
    setResults(response.data);
    setSubmitted(true);
  } catch (err) {
    console.error("Submission error", err);
    setError("Failed to submit answers. Please try again.");
  }
};

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setError(null); // Clear errors
    fetchQuestions(); // Re-fetch questions
  };

  // Handle loading state for initial fetch or restart
  if (loading && !submitted) {
    return <p style={{ padding: "2rem", fontFamily: "Arial" }}>Loading questions...</p>;
  }

  // Handle error state for initial fetch or restart if no questions are loaded
  if (error && !questions.length && !submitted) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Arial" }}>
        <h1>USMLE Practice Quiz</h1>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchQuestions} style={{ padding: "0.5rem 1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>USMLE Practice Quiz</h1>

      {/* Display error messages (e.g., from submission failure) */}
      {error && !loading && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {!submitted && questions.length > 0 && (
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
        </form>
      )}

      {submitted && results && !error && ( // Only show results if submission was successful and results are available
        <div>
          <h2>Score: {results.score} / {results.total}</h2>
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
