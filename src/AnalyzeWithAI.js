import React, { useState } from 'react';
import axios from 'axios';

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
            Get Relevant Resources
          </label>
          
          <label>
            <input
              type="radio"
              checked={promptType === 'practice'}
              onChange={() => setPromptType('practice')}
            />
            Get Practice Material 
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
      
      <button 
        onClick={handleSubmit}
        disabled={isLoading || (promptType === 'custom' && !customPrompt.trim())}
        className="analyze-button"
      >
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {response && (
        <div className="ai-response">
          <h3>AI Analysis:</h3>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: response.replace(/\n/g, '<br />') 
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default AnalyzeWithAI;