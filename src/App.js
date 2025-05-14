import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import HomePage from "./HomePage";
import QuizPage from "./QuizPage";
import ChatPage from "./ChatPage";
import BasicQuiz from "./BasicQuiz";
import LoginPage from "./LoginPage"; // NEW: Login page
import RegisterPage from "./RegisterPage"; // NEW: Register page
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    fetch("/api/auth/status", {
      credentials: "include" // Required for session cookies
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then(data => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    }).then(() => setUser(null));
  };

  return (
    <Router>
      <div className="app-layout">
        {/* Top navbar */}
        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/chat">Chat Support</Link>
          {user ? (
            <>
              <span>👤 {user.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>

        {/* Main section */}
        <div className="main-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <h3 className="sidebar-title">📝 Practice Sections</h3>
            <h4 className="sidebar-subtitle">Step-1</h4>
            <Link to="/basicquiz" className="sidebar-link">Basic</Link>
            <Link to="/quiz" className="sidebar-link">Core</Link>
          </aside>

          {/* Page content */}
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/quiz" element={<ProtectedRoute user={user}><QuizPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute user={user}><ChatPage /></ProtectedRoute>} />
              <Route path="/basicquiz" element={<ProtectedRoute user={user}><BasicQuiz /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage setUser={setUser} />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

// 🔒 Component to protect routes
const ProtectedRoute = ({ user, children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  return user ? children : null;
};

export default App;






/*
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import QuizPage from "./QuizPage";
import ChatPage from "./ChatPage";
import BasicQuiz from "./BasicQuiz";
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app-layout">
        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/chat">Chat Support</Link>
        </nav>

        <div className="main-layout">
          <aside className="sidebar">
            <h3 className="sidebar-title">📝 Practice Sections</h3>
            <h4 className="sidebar-subtitle">Step-1</h4>
            <Link to="/basicquiz" className="sidebar-link"> Basic </Link>
            <Link to="/quiz" className="sidebar-link"> Core </Link>
          </aside>

          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/basicquiz" element={<BasicQuiz />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;

*/