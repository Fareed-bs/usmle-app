import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AnalyzeWithAI = () => {
  const [promptType, setPromptType] = useState('resources');
  const [collectionType, setCollectionType] = useState('step1');
  const [customPrompt, setCustomPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/analyze-with-ai', {
        prompt_type: promptType,
        collection_type: collectionType,
        custom_prompt: customPrompt
      }, {
        withCredentials: true
      });
      
      setResponse(res.data.response);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze with AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="analyze-container">
      <h2>Analyze Your Weak Areas with AI</h2>
      
      <div className="collection-selector">
        <h3>Select Exam Type:</h3>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="step1"
              checked={collectionType === 'step1'}
              onChange={() => setCollectionType('step1')}
            />
            Step 1
          </label>
          
          <label>
            <input
              type="radio"
              value="step2"
              checked={collectionType === 'step2'}
              onChange={() => setCollectionType('step2')}
            />
            Step 2
          </label>
          
          <label>
            <input
              type="radio"
              value="fip"
              checked={collectionType === 'fip'}
              onChange={() => setCollectionType('fip')}
            />
            Step 3 (Foundations of Independent Practice)
          </label>
          
          <label>
            <input
              type="radio"
              value="acm"
              checked={collectionType === 'acm'}
              onChange={() => setCollectionType('acm')}
            />
            Step 3 (Advanced Clinical Medicine)
          </label>
        </div>
      </div>
      
      <div className="prompt-selector">
        <h3>Analysis Type:</h3>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={promptType === 'resources'}
              onChange={() => setPromptType('resources')}
            />
            Get Relevant Resource Links
          </label>
          
          <label>
            <input
              type="radio"
              checked={promptType === 'practice'}
              onChange={() => setPromptType('practice')}
            />
            Get Practice Material Links
          </label>
          
          <label>
            <input
              type="radio"
              checked={promptType === 'questions'}
              onChange={() => setPromptType('questions')}
            />
            Get Practice Questions 
          </label>


          <label>
            <input
              type="radio"
              checked={promptType === 'custom'}
              onChange={() => setPromptType('custom')}
            />
            Custom Question
          </label>
        </div>
      </div>
      
      {promptType === 'custom' && (
        <div className="custom-prompt">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ask anything about your incorrect answers..."
            rows={3}
          />
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={handleSubmit}
          disabled={isLoading || (promptType === 'custom' && !customPrompt.trim())}
          className="analyze-button"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
        {isLoading && (
          <div className="analyzing-extra-outside" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '0.9em' }}>
            <span>Please wait...</span>
            <span>Thanks for your patience <span role="img" aria-label="smile">😊</span></span>
          </div>
        )}
      </div>

      
      {error && <div className="error">{error}</div>}
      
      
    {response && (
  <div className="ai-response">
    <h3>AI Analysis:</h3>
    {promptType === 'questions' ? (() => {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.slice(7);
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3);
      }

      let data;
      try {
        data = JSON.parse(cleanResponse);
      } catch (e) {
        return <div className="error">AI response is not valid JSON.</div>;
      }
      // Debug: Show the parsed data (remove or comment out in production)
      return (
        <>
          {/* <pre style={{ background: "#f5f5f5", color: "#333", padding: "8px", borderRadius: "4px", overflowX: "auto", fontSize: "0.85em" }}>
            {JSON.stringify(data, null, 2)}
          </pre> */}
          {Array.isArray(data) && data.length > 0 ? data.map((item, idx) => (
            <Accordion key={idx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <strong>{item.concept_name || `Question ${idx + 1}`}</strong>
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  <strong>Concept Summary:</strong> {item.concept_summary || <em>N/A</em>}
                </div>
                <div style={{ margin: '10px 0' }}>
                  <strong>Knowledge Check:</strong><br />
                  {item.question || <em>No question text provided.</em>}
                  <ul>
                    {Array.isArray(item.options) && item.options.length > 0 ? item.options.map((opt, i) => (
                      <li key={i}>{String.fromCharCode(65 + i)}) {opt}</li>
                    )) : <li><em>No options provided.</em></li>}
                  </ul>
                </div>
                <div>
                  <strong>Answer:</strong> {item.answer || <em>N/A</em>}
                </div>
                <div>
                  <strong>Explanation:</strong> {item.explanation || <em>N/A</em>}
                </div>
              </AccordionDetails>
            </Accordion>
          )) : (
            <div className="error">No questions found in AI response.</div>
          )}
        </>
      );
    })() : (
      <ReactMarkdown>{response}</ReactMarkdown>
    )}
  </div>
)}      
    </div>
  );
};

export default AnalyzeWithAI;
