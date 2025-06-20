import React, { useState } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService';

function LoginScreen({ onBack, onSwitchToSignUp, onLoginSuccess, onForgotPasswordClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form gönderildiğinde
  const handleSubmit = (event) => {
    event.preventDefault(); // Sayfa yenilenmesini engelle
    setError('');
    setLoading(true);

    // authService.login fonksiyonunu çağır
    authService.login(email, password)
        .then(
            (userInfo) => { // Başarılı olursa userInfo objesi döner (token değil)
              console.log('[LoginScreen] Login successful, calling onLoginSuccess prop with:', userInfo);
              setLoading(false); // Yükleniyor durumunu bitir
              // App.js'deki handleLoginSuccess fonksiyonunu çağır ve userInfo'yu ilet
              if (onLoginSuccess) {
                onLoginSuccess(userInfo);
              } else {
                console.error("[LoginScreen] onLoginSuccess prop is missing!");
              }
            },
            (error) => { // Hata olursa (authService'den fırlatılan Error objesi)
              const resMessage = error.message || "An unexpected error occurred.";
              console.error("[LoginScreen] Login error:", error);
              setError(resMessage); // Hatayı state'e yazarak kullanıcıya göster
              setLoading(false);
            }
        );
  };

  return (
      <div className="auth-container">
        <div className="auth-card">
          {onBack && (
              <button onClick={onBack} className="card-back-button" aria-label="Go Back" disabled={loading}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
          )}

          <form onSubmit={handleSubmit} className="auth-form-content">
            <div className="form-header">
              <h2 className="auth-title">Login</h2>
              <p className="auth-subtitle">Welcome back to Solvex!</p>
            </div>

            {error && <p className="error-message">{error}</p>}

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
                  disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="input-group">
            <span className="input-icon-wrapper">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
            </span>
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="input-field"
                  aria-label="Password"
                  disabled={loading}
              />
            </div>

            {/* Forgot Password Butonu/Linki */}
            <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
              {onForgotPasswordClick && (
                  <button
                      type="button"
                      onClick={onForgotPasswordClick}
                      className="switch-button"
                      style={{ fontSize: '0.8rem', padding: '0' }}
                      disabled={loading}
                  >
                    Forgot Password?
                  </button>
              )}
            </div>

            {/* Login Butonu */}
            <button type="submit" className="submit-button login-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login Now'}
            </button>

            {/* Sign Up Linki */}
            <p className="auth-switch-link">
              Don't have an account?{' '}
              <button type="button" onClick={onSwitchToSignUp} className="switch-button" disabled={loading}>
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </div>
  );
}

export default LoginScreen;