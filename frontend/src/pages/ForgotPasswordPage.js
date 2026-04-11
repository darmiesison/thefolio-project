import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setError("Please enter a valid Gmail address.");
      return;
    }

    try {
      const response = await API.post("/auth/forgot-password", { email });
      setMessage(
        `Reset token generated. For this demo, use the token below to continue: ${response.data.token}`
      );
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to request password reset.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await API.post("/auth/reset-password", {
        email,
        token,
        newPassword,
      });
      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    }
  };

  return (
    <main>
      <h2>Forgot Password</h2>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {step === 1 ? (
        <form onSubmit={handleRequestReset}>
          <label>Gmail Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="yourname@gmail.com"
          />
          <button type="submit">Send Reset Token</button>
          <p>
            Remembered your password? <Link to="/login">Login here</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <label>Gmail Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Reset Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Reset Password</button>
          <p>
            Not your Gmail? <Link to="/forgot-password">Start over</Link>
          </p>
        </form>
      )}
    </main>
  );
}

export default ForgotPasswordPage;
