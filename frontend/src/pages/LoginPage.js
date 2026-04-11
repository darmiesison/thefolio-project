import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.state?.from?.pathname || "/cat";

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/auth/login", { email, password });
      
      // Save user data and token to global state
      login(response.data.user, response.data.token);
      
      if (response.data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <main>
      <h2>Login to Your Account</h2>
      <form id="loginForm" onSubmit={handleLogin}>
        {error && <div className="error-message">{error}</div>}
        
        <label>Email or Username</label>
        <input 
          type="text" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />

        <label>Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />

        <button type="submit">Login</button>
        <p style={{marginTop: '10px'}}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        <p>
          Forgot your password? <Link to="/forgot-password">Reset it here</Link>
        </p>
      </form>
    </main>
  );
}

export default LoginPage;