import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
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
import { AuthProvider, useAuth } from "./AuthContext";
import AnalyzeWithAI from "./AnalyzeWithAI";
import IncorrectAnswersViewer from './IncorrectAnswersViewer';
import Dashboard from "./Dashboard";
import GoogleLogin from "./GoogleLogin";
import "./App.css";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      {/* Top navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/">Home</Link>
          <Link to="/chat">Chat Support</Link>
          <Link to="/analyze-with-ai">Analyze With AI</Link>
          <Link to="/incorrect-answers">Incorrect Answers</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="navbar-right">
          {user ? (
            <>
              <span className="welcome-message">Welcome, {user.username}</span>
              <button onClick={logout} className="auth-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-button">Login</Link>
              <Link to="/register" className="auth-button">Register</Link>
              <GoogleLogin />
            </>
          )}
        </div>
      </nav>

      {/* Main section */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">📝 Practice Sections</h3>
          <h4 className="sidebar-subtitle"><strong>Step-1</strong></h4>
          <Link to="/basicquiz" className="sidebar-link">1.Basic</Link>
          <Link to="/quiz" className="sidebar-link">2.Core</Link>
          <h4 className="sidebar-subtitle"><strong>Step-2</strong></h4>
          <Link to="/step2basic" className="sidebar-link">1.Basic</Link>
          <Link to="/step2core" className="sidebar-link">2.Core</Link>
          <h4 className="sidebar-subtitle"><strong>Step-3</strong></h4>
          <Link to="/step3basic" className="sidebar-link">1.Basic</Link>
          <Link to="/fipquiz" className="sidebar-link">2.FIP</Link>
          <Link to="/acmquiz" className="sidebar-link">3.ACM</Link>
        </aside>

        {/* Page content */}
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/quiz" element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/basicquiz" element={
              <ProtectedRoute>
                <BasicQuiz />
              </ProtectedRoute>
            } />
            <Route path="/step2basic" element={
              <ProtectedRoute>
                <Step2Basic />
              </ProtectedRoute>
            } />
            <Route path="/step2core" element={
              <ProtectedRoute>
                <Step2Core />
              </ProtectedRoute>
            } />
            <Route path="/step3basic" element={
              <ProtectedRoute>
                <Step3Basic />
              </ProtectedRoute>
            } />
            <Route path="/fipquiz" element={
              <ProtectedRoute>
                <FipQuizPage />
              </ProtectedRoute>
            } />
            <Route path="/acmquiz" element={
              <ProtectedRoute>
                <ACMQuiz />
              </ProtectedRoute>
            } />
              <Route path="/analyze-with-ai" element={
              <ProtectedRoute>
                <AnalyzeWithAI /> 
              </ProtectedRoute>
            } />
              <Route path="/incorrect-answers" element={
              <ProtectedRoute>
                <IncorrectAnswersViewer /> 
              </ProtectedRoute> 
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard /> 
              </ProtectedRoute>
            } />      
          </Routes>
        </div>
      </div>
    </div>
  );
};

function QuizResultsPage() {
  return (
    <div>
      <h2>Review Your Mistakes</h2>
      <IncorrectAnswersViewer quizType="step1" />
      {/* or */}
      <IncorrectAnswersViewer quizType="step2" />
    </div>
  );
}


const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;