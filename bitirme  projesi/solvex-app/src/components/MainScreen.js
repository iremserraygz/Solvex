import React from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignInAlt,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';

function MainScreen({ onLoginClick, onSignUpClick }) {

  const handleLoginClick = () => onLoginClick();
  const handleSignUpClick = () => onSignUpClick();



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


        </div>
      </div>
  );
}

export default MainScreen;