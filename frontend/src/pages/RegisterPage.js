import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from '../api/axios';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const validate = () => {
    let tempErrors = {};
    if (!formData.username) tempErrors.username = "Username is required";
    if (!formData.email.includes("@")) tempErrors.email = "Valid email is required";
    if (!formData.password) tempErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) tempErrors.match = "Passwords do not match";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      try {
        // By logging 'response', the warning "declared but never read" will disappear
        const response = await API.post('/auth/register', {
          name: formData.username,
          email: formData.email,
          password: formData.password
        });

        console.log("Server Response:", response.data); // Now 'response' is being read!

        setSuccess("🎉 Registration successful! You can now login.");
        setErrors({});
        setFormData({ username: "", email: "", password: "", confirmPassword: "" });
        
      } catch (err) {
        setErrors({ server: err.response?.data?.message || "Registration failed" });
      }
    }
  };

  return (
    <main>
      <h2>Join the Community</h2>
      <form id="registerForm" onSubmit={handleSubmit}>
        {/* Show server-side errors if they exist */}
        {errors.server && <div className="error-message">{errors.server}</div>}
        
        <label>Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <div className="error">{errors.username}</div>

        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <div className="error">{errors.email}</div>

        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <div className="error">{errors.password}</div>

        <label>Confirm Password</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        />
        <div className="error">{errors.match}</div>

        <button type="submit">Register</button>
        {success && <div className="success">{success}</div>}
      </form>

      <div className="alternate-action">
        <p>
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;