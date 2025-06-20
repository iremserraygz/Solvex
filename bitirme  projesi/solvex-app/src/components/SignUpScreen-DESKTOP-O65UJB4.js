import React, { useState } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService';

function SignUpScreen({ onBack, onSwitchToLogin }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(''); // Yeni state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    // authService'e firstName ve lastName'i ayrı ayrı gönder
    authService.register(firstName, lastName, email, password)
      .then(
        (response) => {
          console.log("Sign Up successful:", response.data); // Dönen string mesajı
          alert('Registration successful! Please check your email to activate your account.');
          setLoading(false);
          onSwitchToLogin();
        },
        (error) => {
          const resMessage =
            (error.response &&
              error.response.data &&
              (typeof error.response.data === 'string' ? error.response.data : error.response.data.message)) || // String veya obje mesajı
            error.message ||
            error.toString();
          console.error("Sign Up error:", error.response || error); // Detaylı hata logu
          setError(resMessage);
          setLoading(false);
        }
      );
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={onBack} className="card-back-button" aria-label="Go Back">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <form onSubmit={handleSubmit} className="auth-form-content">
          <div className="form-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join Solvex today!</p>
          </div>

          {error && <p className="error-message">{error}</p>}

          {/* Input Alanları */}
          <div className="input-group">
            <span className="input-icon-wrapper">
              <FontAwesomeIcon icon={faUser} className="input-icon" />
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name" // Değişti
              required
              className="input-field"
              aria-label="First Name"
            />
          </div>

          <div className="input-group">
            <span className="input-icon-wrapper">
              <FontAwesomeIcon icon={faUser} className="input-icon" />
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name" // Yeni input
              required
              className="input-field"
              aria-label="Last Name"
            />
          </div>


          <div className="input-group">
            <span className="input-icon-wrapper">
              <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="input-field"
              aria-label="Email"
            />
          </div>

          <div className="input-group">
            <span className="input-icon-wrapper">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 chars)"
              required
              minLength={6}
              className="input-field"
              aria-label="Password"
            />
          </div>

          <div className="input-group">
            <span className="input-icon-wrapper">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="input-field"
              aria-label="Confirm Password"
            />
          </div>

          <button type="submit" className="submit-button signup-submit" disabled={loading}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>

          <p className="auth-switch-link">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="switch-button">
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUpScreen;