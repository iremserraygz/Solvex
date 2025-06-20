import React, { useState } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService';

function ForgotPasswordScreen({ onBack, onSwitchToLogin }) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);


        authService.forgotPassword(email)
            .then(responseMessage => {
                setLoading(false);
                setMessage(responseMessage);
            })
            .catch(error => {
                setLoading(false);
                setError(error.message || "An unexpected error occurred. Please try again."); // Hata mesajını göster
            });
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
                        <h2 className="auth-title">Forgot Password</h2>
                        <p className="auth-subtitle">Enter your email to receive reset instructions.</p>
                    </div>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <div className="input-group">
                        <span className="input-icon-wrapper">
                          <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            className="input-field"
                            aria-label="Email Address"
                            disabled={loading || !!message}
                        />
                    </div>

                    {!message && (
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? (
                                'Sending...'
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '8px'}} />
                                    Send Reset Instructions
                                </>
                            )}
                        </button>
                    )}

                    {onSwitchToLogin && !message && (
                        <p className="auth-switch-link">
                            Remembered your password?{' '}
                            <button type="button" onClick={onSwitchToLogin} className="switch-button" disabled={loading}>
                                Login
                            </button>
                        </p>
                    )}
                    {message && onSwitchToLogin && (
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="submit-button secondary-action"
                            style={{marginTop: '15px'}}
                            disabled={loading}
                        >
                            Back to Login
                        </button>
                    )}
                </form>
            </div>
            <style jsx>{`
                .success-message {
                    color: #10b981; 
                    background-color: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    padding: 10px 15px;
                    border-radius: 5px; 
                    text-align: center;
                    font-size: .85rem;
                    margin-top: -8px;
                    margin-bottom: 15px; 
                }
                .submit-button.secondary-action {
                    background: rgba(255, 255, 255, 0.1);
                    color: #cbd5e1; /* Açık gri/beyaz */
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 2px 4px rgba(0,0,0,.1); 
                }
                .submit-button.secondary-action:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255,255,255,.3);
                }
            `}</style>
        </div>
    );
}

export default ForgotPasswordScreen;