// src/components/MainScreen.js
import React from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignInAlt,
  faUserPlus
  // Removed faTachometerAlt and faUserGraduate as they are no longer used
} from '@fortawesome/free-solid-svg-icons';

// --- MODIFIED: Removed unused props ---
function MainScreen({ onLoginClick, onSignUpClick }) {

  const handleLoginClick = () => onLoginClick();
  const handleSignUpClick = () => onSignUpClick();

  // --- REMOVED: Handlers for dev buttons ---
  // const handleGoToDashboard = () => onGoToDashboardClick();
  // const handleGoToStudentDashboard = () => { ... };

  return (
      <div className="main-screen-container">
        <h1 className="app-title">Solvex</h1>
        <div className="button-container">
          {/* Login Button */}
          <button className="auth-button login-button" onClick={handleLoginClick}>
            <FontAwesomeIcon icon={faSignInAlt} /> <span>Login</span>
          </button>
          {/* Sign Up Button */}
          <button className="auth-button signup-button" onClick={handleSignUpClick}>
            <FontAwesomeIcon icon={faUserPlus} /> <span>Sign Up</span>
          </button>

          {/* --- REMOVED: Developer Buttons --- */}
          {/* <button className="auth-button dev-button" onClick={handleGoToDashboard} title="Development Only"> ... </button> */}
          {/* <button className="auth-button student-dev-button" onClick={handleGoToStudentDashboard} title="Development Only"> ... </button> */}
          {/* --- --- --- */}

        </div>
      </div>
  );
}

export default MainScreen;