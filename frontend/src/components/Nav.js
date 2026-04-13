import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Nav({ toggleTheme, currentTheme }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header>
      <div className="logo-container">
        <img src="/assets/logo-cat.png" alt="Logo" className="logo" />
        <h1>All About Cats</h1>
      </div>
      <nav>
        <ul>
          <li>
            <Link
              to="/home"
              className={location.pathname === "/home" ? "active" : ""}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={location.pathname === "/about" ? "active" : ""}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={location.pathname === "/contact" ? "active" : ""}
            >
              Contact
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link
                  to="/cat"
                  className={location.pathname === "/cat" ? "active" : ""}
                >
                  Feed
                </Link>
              </li>
              {user.role === 'admin' && (
                <li>
                  <Link
                    to="/admin"
                    className={location.pathname === "/admin" ? "active" : ""}
                  >
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/profile"
                  className={location.pathname === "/profile" ? "active" : ""}
                >
                  Profile
                </Link>
              </li>
              <li>
                <button type="button" onClick={logout} className="theme-toggle">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/register"
                  className={location.pathname === "/register" ? "active" : ""}
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className={location.pathname === "/login" ? "active" : ""}
                >
                  Sign In
                </Link>
              </li>
            </>
          )}
          <li>
            <button onClick={toggleTheme} className="theme-toggle">
              {currentTheme === "light" ? "🌙" : "☀️"}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Nav;
