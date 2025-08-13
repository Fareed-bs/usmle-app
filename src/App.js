import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import "./App.css";

// Pages
import MainPortal from "./MainPortal";
import HomePage from "./HomePage";
import QuizPage from "./QuizPage";
import ChatPage from "./ChatPage";
import BasicQuiz from "./BasicQuiz";
import Step2Basic from "./Step2Basic";
import Step2Core from "./Step2Core";
import Step3Basic from "./Step3Basic";
import FipQuizPage from "./FipQuizPage";
import ACMQuiz from "./ACMQuiz";
import Login from "./Login";
import Register from "./Register";
import AnalyzeWithAI from "./AnalyzeWithAI";
import IncorrectAnswersViewer from './IncorrectAnswersViewer';
import Dashboard from "./Dashboard";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// USMLE Layout Component
const USMLEApp = () => {
  return (
    <div className="app-layout">
      {/* Top navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/">AI Portal</Link>
          <Link to="/usmle">USMLE Home</Link>
          <Link to="/usmle/chat">Chat Support</Link>
          <Link to="/usmle/analyze-with-ai">Analyze With AI</Link>
          <Link to="/usmle/incorrect-answers">Incorrect Answers</Link>
          <Link to="/usmle/dashboard">Dashboard</Link>
        </div>
      </nav>

      {/* Main section */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">📝 Practice Sections</h3>
          <h4 className="sidebar-subtitle"><strong>Step-1</strong></h4>
          <Link to="/usmle/basicquiz" className="sidebar-link">1.Basic</Link>
          <Link to="/usmle/quiz" className="sidebar-link">2.Core</Link>
          <h4 className="sidebar-subtitle"><strong>Step-2</strong></h4>
          <Link to="/usmle/step2basic" className="sidebar-link">1.Basic</Link>
          <Link to="/usmle/step2core" className="sidebar-link">2.Core</Link>
          <h4 className="sidebar-subtitle"><strong>Step-3</strong></h4>
          <Link to="/usmle/step3basic" className="sidebar-link">1.Basic</Link>
          <Link to="/usmle/fipquiz" className="sidebar-link">2.FIP</Link>
          <Link to="/usmle/acmquiz" className="sidebar-link">3.ACM</Link>
        </aside>

        {/* Page content */}
        <div className="container">
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="basicquiz" element={<ProtectedRoute><BasicQuiz /></ProtectedRoute>} />
            <Route path="quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="step2basic" element={<ProtectedRoute><Step2Basic /></ProtectedRoute>} />
            <Route path="step2core" element={<ProtectedRoute><Step2Core /></ProtectedRoute>} />
            <Route path="step3basic" element={<ProtectedRoute><Step3Basic /></ProtectedRoute>} />
            <Route path="fipquiz" element={<ProtectedRoute><FipQuizPage /></ProtectedRoute>} />
            <Route path="acmquiz" element={<ProtectedRoute><ACMQuiz /></ProtectedRoute>} />
            <Route path="analyze-with-ai" element={<ProtectedRoute><AnalyzeWithAI /></ProtectedRoute>} />
            <Route path="incorrect-answers" element={<ProtectedRoute><IncorrectAnswersViewer /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/usmle/*" element={<USMLEApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
