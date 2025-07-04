import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css"; // Or create Dashboard.css for custom styles

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/api/dashboard", { withCredentials: true })
      .then((res) => setDashboard(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-message">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">User Dashboard</h2>
      <div className="dashboard-section">
        <h3>Status</h3>
        <p>
          {dashboard.status === "Not started"
            ? "You have not started any quiz yet."
            : `Your latest activity: ${dashboard.status}`}
        </p>
      </div>
      <div className="dashboard-section">
        <h3>Scores & Percentages</h3>
        <ul>
          {Object.entries(dashboard.scores).map(([quiz, value]) => (
            <li key={quiz}>
              <strong>{quiz}:</strong> {typeof value === "string" ? value : 
                <span>
                  {value.score} / 40 (Percentage: {value.percentage}%)
                  <progress className="quiz-progress" value={value.percentage} max="100"></progress>
                </span>
}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;