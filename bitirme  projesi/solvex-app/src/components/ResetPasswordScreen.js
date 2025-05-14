// src/components/ResetPasswordScreen.js
import React, { useState, useEffect } from 'react';
// react-router-dom importları KALDIRILDI
// import { useSearchParams, useNavigate } from 'react-router-dom';
import '../App.css'; // Global CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheckCircle, faTimesCircle, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService'; // Doğru yolu kontrol edin

// --- PROPS GÜNCELLENDİ ---
// token: App.js'ten gelen URL token'ı
// onPasswordResetSuccess: Başarılı sıfırlama sonrası çağrılacak fonksiyon (App.js'teki navigateToLogin)
function ResetPasswordScreen({ token, onPasswordResetSuccess }) {

    // State'ler
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- URL'den token okuma useEffect'i KALDIRILDI ---
    // Token artık prop olarak geliyor. Başlangıçta token kontrolü yapalım.
    useEffect(() => {
        if (!token) {
            console.error("ResetPasswordScreen: Token prop is missing.");
            setError("Invalid password reset link or token missing.");
            // Token yoksa formu göstermenin anlamı yok.
        } else {
            console.log("ResetPasswordScreen: Received token via props:", token);
        }
    }, [token]); // token prop'u değişirse (pek olası değil ama) çalışır

    // Şifre görünürlüğünü değiştirme fonksiyonları
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    // Form gönderildiğinde
    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        // Token var mı diye tekrar kontrol et (prop üzerinden)
        if (!token) {
            setError("Missing password reset token. Cannot proceed.");
            return;
        }
        // Şifre kontrolleri
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        // authService.resetPassword fonksiyonunu çağır
        authService.resetPassword(token, password)
            .then(responseMessage => {
                setLoading(false);
                setMessage(responseMessage || "Password has been reset successfully!");
                setError('');
                setPassword(''); // Alanları temizle
                setConfirmPassword('');

                // Başarı sonrası App.js'e bildir (login'e yönlendirme için)
                if (onPasswordResetSuccess) {
                    // Yönlendirmeden önce mesajın görünmesi için kısa bir bekleme ekleyebiliriz
                    setTimeout(() => {
                        onPasswordResetSuccess(); // App.js'teki navigateToLogin'i çağırır
                    }, 2000); // 2 saniye sonra yönlendir
                }
            })
            .catch(error => {
                setLoading(false);
                setError(error.message || "Failed to reset password. Please try again or request a new link.");
                setMessage('');
            });
    };

    // Formu sadece geçerli bir token varsa ve başarı mesajı yoksa göster
    const shouldShowForm = token && !message;

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Geri butonu genellikle bu sayfada olmaz */}

                <form onSubmit={handleSubmit} className="auth-form-content">
                    <div className="form-header">
                        <h2 className="auth-title">Reset Password</h2>
                        {/* Mesaj durumuna göre alt başlık */}
                        {shouldShowForm && <p className="auth-subtitle">Enter your new password below.</p>}
                        {!token && !error && <p className="auth-subtitle">Loading token...</p>}
                    </div>

                    {/* Mesaj ve Hata Alanları */}
                    {message && <p className="success-message"><FontAwesomeIcon icon={faCheckCircle} /> {message}</p>}
                    {error && <p className="error-message"><FontAwesomeIcon icon={faTimesCircle} /> {error}</p>}

                    {/* Formu göster */}
                    {shouldShowForm && (
                        <>
                            {/* Yeni Şifre Input */}
                            <div className="input-group">
                                <span className="input-icon-wrapper">
                                  <FontAwesomeIcon icon={faLock} className="input-icon" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New Password (min. 6 chars)"
                                    required
                                    minLength={6}
                                    className="input-field"
                                    aria-label="New Password"
                                    disabled={loading}
                                />
                                <button type="button" onClick={togglePasswordVisibility} className="password-toggle-button" aria-label="Toggle password visibility">
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>

                            {/* Şifre Tekrarı Input */}
                            <div className="input-group">
                                <span className="input-icon-wrapper">
                                  <FontAwesomeIcon icon={faLock} className="input-icon" />
                                </span>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm New Password"
                                    required
                                    className="input-field"
                                    aria-label="Confirm New Password"
                                    disabled={loading}
                                />
                                <button type="button" onClick={toggleConfirmPasswordVisibility} className="password-toggle-button" aria-label="Toggle confirm password visibility">
                                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>

                            {/* Şifre Sıfırlama Butonu */}
                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? (
                                    <><FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} /> Resetting...</>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </>
                    )}

                    {/* Başarı veya token yok/hata varsa Login'e dön butonu */}
                    {(message || error) && ( // Sadece mesaj veya hata varsa göster
                        // onPasswordResetSuccess prop'u zaten yönlendirme yapacak,
                        // ama kullanıcı isterse diye ekstra buton eklenebilir.
                        // Veya sadece mesaj sonrası otomatik yönlendirme yeterli olabilir.
                        <button
                            type="button"
                            // onClick={onPasswordResetSuccess} // Prop'u direkt kullanabiliriz
                            // Veya App.js'e ayrı bir onGoBackToLogin prop'u ekleyebiliriz
                            onClick={() => window.location.href = '/login'} // Basit yönlendirme
                            className="submit-button secondary-action"
                            style={{marginTop: '15px'}}
                            disabled={loading} // Hata durumunda tekrar tıklanabilir mi?
                        >
                            Back to Login
                        </button>
                    )}

                </form>
            </div>
            {/* Stil tanımlamaları (önceki gibi) */}
            <style jsx>{`
                .success-message { color: #10b981; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px 15px; border-radius: 5px; text-align: center; font-size: .85rem; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;}
                .error-message { color: #f43f5e; background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); padding: 10px 15px; border-radius: 5px; text-align: center; font-size: .85rem; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .submit-button.secondary-action { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 2px 4px rgba(0,0,0,.1); }
                .submit-button.secondary-action:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(255,255,255,.3); }
                .password-toggle-button { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 5px; }
                .password-toggle-button:hover { color: #e2e8f0; }
            `}</style>
        </div>
    );
}

export default ResetPasswordScreen;