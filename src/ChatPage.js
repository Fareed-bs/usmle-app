// ChatPage.js
import React, { useState } from "react";
import axios from "axios";

const ChatPage = () => {
  const [query, setQuery] = useState("");
  const [chatLog, setChatLog] = useState([]);

  const handleSend = async () => {
    if (!query.trim()) return;

    setChatLog(prev => [...prev, { sender: "user", text: query }]);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", { query }, {
        withCredentials: true // Send cookies for session management if needed
      });
      setChatLog(prev => [...prev, { sender: "bot", text: res.data.response }]);
    } catch (err) {
      console.error("Chat error", err);
      setChatLog(prev => [...prev, { sender: "bot", text: "Error contacting chatbot." }]);
    }

    setQuery("");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Ask the USMLE Chatbot</h1>
      <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
        {chatLog.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === "user" ? "right" : "left", marginBottom: "0.5rem" }}>
            <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong>
            {' '} {/* Adds a space after the colon for better readability */}
            {msg.sender === "bot" ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
            ) : (
              msg.text /* User's text can be rendered as is */
            )}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a USMLE question..."
        style={{ width: "70%", padding: "0.5rem" }}
      />
      <button onClick={handleSend} style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}>Send</button>
    </div>
  );
};

export default ChatPage;


