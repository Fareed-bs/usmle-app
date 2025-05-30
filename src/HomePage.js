// HomePage.js
import React from "react";

const summary = {
  title: "USMLE Practice App",
  description:
    "Welcome to the USMLE Practice App! Prepare for your exams with realistic questions, instant feedback, and personalized study resources.",
  features: [
    "Practice USMLE-style questions for Step 1, Step 2, and Step 3",
    "Instant scoring and detailed explanations",
    "Personalized AI feedback and learning resources",
    "Progress tracking and performance analytics",
  ],
  
  "USMLE Pattern": {
    "Step 1": {
      description:
        "Focuses on the basic sciences fundamental to the practice of medicine.",
      questions: "280 multiple-choice questions",
      duration: "8 hours",
      format: "Multiple-choice, divided into 7 blocks",
    },
    "Step 2 CK": {
      description:
        "Assesses the medical knowledge and understanding of clinical science necessary for patient care.",
      questions: "318 multiple-choice questions",
      duration: "9 hours",
      format: "Multiple-choice, divided into 8 blocks",
    },
    "Step 3": {
      description:
        "Assesses whether the examinee can apply medical knowledge and understanding of biomedical and clinical science essential for the unsupervised practice of medicine.",
      questions: "Approximately 413 multiple-choice questions + 13 case simulations",
      duration: "2 days (7 hours + 9 hours)",
      format: "Multiple-choice and computer-based case simulations",
    },
  },
};

const HomePage = () => (
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
              backgroundColor: "#f9f9f9",
            }}
          >
            <h4>{step}</h4>
            <p>
              <strong>Description:</strong> {details.description}
            </p>
            <p>
              <strong>Questions:</strong> {details.questions}
            </p>
            <p>
              <strong>Duration:</strong> {details.duration}
            </p>
            <p>
              <strong>Format:</strong> {details.format}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default HomePage;





