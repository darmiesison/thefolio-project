import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SplashPage() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevWidth) => {
        if (prevWidth >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevWidth + 1;
      });
    }, 30);

    if (progress === 100) {
    const timer = setTimeout(() => {
    navigate("/home"); // This MUST match the path in App.js
     }, 500);
    return () => clearTimeout(timer);
}

    return () => clearInterval(interval);
  }, [progress, navigate]);

  return (
    <div id="splash">
      <div className="splash-content">
        {/* Step 2: Self-closing tags and className */}
        <img src="assets/logo-cat.png" alt="Cat Logo" className="logo" />
        <h1>Welcome, Cat Lover!</h1>
        <p id="pLoading">Loading purr-fect content...</p>

        <div className="loading-bar">
          {/* Step 4: Dynamic styling based on state */}
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}

export default SplashPage;
