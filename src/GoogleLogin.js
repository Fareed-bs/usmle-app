// src/components/GoogleLoginButton.js
import React from 'react';

const GoogleLogin = () => {
  const handleGoogleLogin = () => {
    // Redirect to the backend Google login route
    window.location.href = 'http://localhost:5000/api/auth/login/google';
  };

  return (
    <button 
      onClick={handleGoogleLogin} 
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#4285F4', // Google's blue
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img 
        // src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo" 
        style={{ marginRight: '10px', height: '20px' }} 
      />
      Login with Google
    </button>
  );
};

export default GoogleLogin;
