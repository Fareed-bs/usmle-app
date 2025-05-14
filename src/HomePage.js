// HomePage.js
import React, { useEffect, useState } from "react";

const HomePage = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/home")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
      })
      .catch((error) => {
        console.error("Error fetching home summary:", error);
        setSummary({
          title: "USMLE Quiz App",
          description: "Welcome to the USMLE Prep App!",
          features: [],
        });
      });
  }, []);

  if (!summary) return <p>Loading...</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>{summary.title}</h2>
      <p>{summary.description}</p>

      <h3>🚀 Features</h3>
      <ul>
        {summary.features.map((feature, idx) => (
          <li key={idx}>{feature}</li>
        ))}
      </ul>

      {summary["USMLE Pattern"] && (
        <div>
          <h3>📘 USMLE Exam Pattern</h3>
          {Object.entries(summary["USMLE Pattern"]).map(([step, details]) => (
            <div
              key={step}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9"
              }}
            >
              <h4>{step}</h4>
              <p><strong>Description:</strong> {details.description}</p>
              <p><strong>Questions:</strong> {details.questions}</p>
              <p><strong>Duration:</strong> {details.duration}</p>
              <p><strong>Format:</strong> {details.format}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;





/*
// HomePage.js
import React, { useEffect, useState } from "react";

const HomePage = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/home")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
      })
      .catch((error) => {
        console.error("Error fetching home summary:", error);
        setSummary({
          title: "USMLE Quiz App",
          description: "Welcome to the USMLE Prep App!",
          features: [],
        });
      });
  }, []);

  if (!summary) return <p>Loading...</p>;

  return (
    <div>
      <h2>{summary.title}</h2>
      
      <p>{summary.description}</p>
      <ul>
        {summary.features.map((feature, idx) => (
          <li key={idx}>{feature}</li>
        ))}
      </ul>
    </div>
  );
};

export default HomePage;
*/
