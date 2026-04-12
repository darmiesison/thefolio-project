import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

// Components
import Nav from "./components/Nav";

// Pages
import SplashPage from "./pages/SplashPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CatPage from "./pages/CatPage";
import MyPostsPage from "./pages/MyPostsPage";
import PostDetailPage from "./pages/PostDetailPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className={`app-container ${theme}`}>
      <Routes>
        {/* 1. The Splash Page (No Navigation visible here) */}
        <Route path="/" element={<SplashPage />} />

        {/* 2. All other routes are wrapped with Nav and Footer */}
        <Route
          path="/home"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <HomePage />
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/about"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <AboutPage />
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/contact"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ContactPage />
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/register"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <RegisterPage />
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/cat"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ProtectedRoute>
                  <CatPage />
                </ProtectedRoute>
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/my-posts"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ProtectedRoute>
                  <MyPostsPage />
                </ProtectedRoute>
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/admin"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ProtectedRoute role="admin">
                  <AdminPage />
                </ProtectedRoute>
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/profile"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/post/:id"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ProtectedRoute>
                  <PostDetailPage />
                </ProtectedRoute>
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/login"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <LoginPage />
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <div className="page-wrapper">
              <Nav toggleTheme={toggleTheme} currentTheme={theme} />
              <div className="container">
                <ForgotPasswordPage />
              </div>
              <footer><p>© 2026 All About Cats</p></footer>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;