// src/components/ForgotPasswordScreen.js
import React, { useState } from 'react';
import '../App.css'; // Global CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService'; // Güncellenmiş authService

// Props: onBack (Geri dönmek için), onSwitchToLogin (Login'e geçmek için - opsiyonel)
function ForgotPasswordScreen({ onBack, onSwitchToLogin }) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(''); // Başarı veya bilgi mesajı
    const [error, setError] = useState('');     // Hata mesajı
    const [loading, setLoading] = useState(false); // İşlem durumu

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        // --- npm satırı kaldırıldı ---

        // --- GERÇEK API ÇAĞRISI ---
        authService.forgotPassword(email)
            .then(responseMessage => {
                // Başarılı yanıt alındı (backend'den gelen mesaj)
                setLoading(false);
                setMessage(responseMessage); // Backend'den gelen mesajı göster
                // setEmail(''); // E-posta alanını temizlemek isteğe bağlı
            })
            .catch(error => {
                // Hata yakalandı (authService'den fırlatılan Error objesi)
                setLoading(false);
                setError(error.message || "An unexpected error occurred. Please try again."); // Hata mesajını göster
            });
        // --- --- ---
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Geri Butonu */}
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

                    {/* Mesaj ve Hata Alanları */}
                    {/* Başarı mesajı için stil (App.css'e eklenebilir veya buradaki gibi inline) */}
                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    {/* E-posta Girişi */}
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
                            // Yükleniyorsa veya BAŞARI mesajı gösteriliyorsa pasif yap (hata varsa aktif kalabilir)
                            disabled={loading || !!message}
                        />
                    </div>

                    {/* Gönderme Butonu */}
                    {/* Başarı mesajı gösterilmiyorsa butonu göster */}
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

                    {/* Login'e Dönüş Linki (Opsiyonel) */}
                    {/* Başarı mesajı gösterilmiyorsa ve onSwitchToLogin varsa */}
                    {onSwitchToLogin && !message && (
                        <p className="auth-switch-link">
                            Remembered your password?{' '}
                            <button type="button" onClick={onSwitchToLogin} className="switch-button" disabled={loading}>
                                Login
                            </button>
                        </p>
                    )}
                    {/* Başarı mesajı gösteriliyorsa ve onSwitchToLogin varsa */}
                    {message && onSwitchToLogin && (
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="submit-button secondary-action"
                            style={{marginTop: '15px'}}
                            disabled={loading} // Butonun tekrar tıklanmasını engellemek için loading'i de kontrol et
                        >
                            Back to Login
                        </button>
                    )}
                </form>
            </div>
            {/* Başarı mesajı için stil (App.css'e eklenebilir) */}
            <style jsx>{`
                .success-message {
                    color: #10b981; /* Yeşil tonu */
                    background-color: rgba(16, 185, 129, 0.1); /* Yeşil arka plan */
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    padding: 10px 15px;
                    border-radius: 5px; /* Stilinize uygun radius */
                    text-align: center;
                    font-size: .85rem;
                    margin-top: -8px;
                    margin-bottom: 15px; /* Butonlarla arayı aç */
                }
                .submit-button.secondary-action {
                    background: rgba(255, 255, 255, 0.1);
                    color: #cbd5e1; /* Açık gri/beyaz */
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 2px 4px rgba(0,0,0,.1); /* Daha hafif gölge */
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