import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import HomePage from "./HomePage";
import QuizPage from "./QuizPage";
import ChatPage from "./ChatPage";
import BasicQuiz from "./BasicQuiz";
import LoginPage from "./LoginPage"; // NEW: Login page
import RegisterPage from "./RegisterPage"; // NEW: Register page
import Step2Basic from "./Step2Basic"; // NEW: Step2Basic page
import Step2Core from "./Step2Core"; // NEW: Step2Core page
import Step3Basic from "./Step3Basic"; // NEW: Step3Basic page
import FipQuizPage from "./FipQuizPage"; // NEW: FipQuizPage
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
  fetch("/api/auth/status", {
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => setUser(data.logged_in ? data.user : null))
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
        {/* Top navbar - Using flexbox to separate left and right */}
        <nav className="navbar">
          <div className="navbar-left">
            <Link to="/">Home</Link>
            <Link to="/chat">Chat Support</Link>
          </div>
          <div className="navbar-right">
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
          </div>
        </nav>

        {/* Main section */}
        <div className="main-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <h3 className="sidebar-title">📝 Practice Sections</h3>
            <h4 className="sidebar-subtitle">Step-1</h4>
            <Link to="/basicquiz" className="sidebar-link">Basic</Link>
            <Link to="/quiz" className="sidebar-link">Core</Link>
            <h4 className="sidebar-subtitle">Step-2</h4>
            <Link to="/step2basic" className="sidebar-link">Basic</Link>
            <Link to="/step2core" className="sidebar-link">Core</Link>
            <h4 className="sidebar-subtitle">Step-3</h4>
            <Link to="/step3basic" className="sidebar-link">Basic</Link>
            <Link to="/fipquiz" className="sidebar-link">FIP</Link>
          </aside>

          {/* Page content */}
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/quiz" element={<ProtectedRoute user={user}><QuizPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute user={user}><ChatPage /></ProtectedRoute>} />
              <Route path="/basicquiz" element={<ProtectedRoute user={user}><BasicQuiz /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage setUser={setUser} />} />
              <Route path="/step2basic" element={<ProtectedRoute user={user}><Step2Basic /></ProtectedRoute>} /> 
              <Route path="/step2core" element={<ProtectedRoute user={user}><Step2Core /></ProtectedRoute>} />
              <Route path="/step3basic" element={<ProtectedRoute user={user}><Step3Basic /></ProtectedRoute>} />
              <Route path="/fipquiz" element={<ProtectedRoute user={user}><FipQuizPage /></ProtectedRoute>} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};


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






