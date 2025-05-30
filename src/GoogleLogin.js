// Example: src/LoginComponent.js or part of App.js

import React, { useEffect, useState } from 'react';

function GoogleLogin() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Backend API base URL
    const API_BASE_URL = 'http://localhost:5000'; // Your Flask backend URL

    // Function to initiate Google Login
    const handleGoogleLogin = () => {
        // Redirects the user to your backend's Google login route.
        // The backend will then redirect to Google, and after success,
        // Google will redirect back to your backend's callback,
        // which then redirects to your FRONTEND_URL_AFTER_LOGIN.
        window.location.href = `${API_BASE_URL}/login_with_google`;
    };

    const handleLogout = async () => {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        setUser(null);
    };

    // Function to check authentication status
    const checkAuthStatus = async () => {
        setIsLoading(true);
        try {
            // Use {credentials: 'include'} to send cookies with the request
            const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
                credentials: 'include', // Crucial for sending session cookies
            });

            if (response.ok) {
                const data = await response.json();
                if (data.logged_in) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } else {
                // If status endpoint returns an error (e.g., 401), user is not logged in
                setUser(null);
                console.error('Auth status check failed:', response.statusText);
            }
        } catch (error) {
            setUser(null);
            console.error('Error checking auth status:', error);
        }
        setIsLoading(false);
    };

    // Check auth status when the component mounts
    // This is important because after Google login, the backend redirects
    // the user back to the frontend. This effect will then run and
    // fetch the user's status.
    useEffect(() => {
        checkAuthStatus();
    }, []); // Empty dependency array means this runs once on mount

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            {user ? (
                <div>
                    <p>Welcome, {user.username}!</p>
                    {user.email && <p>Email: {user.email}</p>} {/* Display email if available from Google */}
                    <button onClick={handleLogout}>Logout</button>
                    {/* Your authenticated app content here */}
                </div>
            ) : (
                <div>
                    <p>You are not logged in.</p>
                    <button onClick={handleGoogleLogin}>
                        Login with Google
                    </button>
                    {/* You can also add your local login form fields here */}
                </div>
            )}
        </div>
    );
}

export default GoogleLogin;

// In your App.js, you might import and use LoginComponent
// or integrate similar logic directly.
// If you use React Router, the page you are redirected to after login
// (e.g., /dashboard) would be a good place to ensure this auth check happens.
