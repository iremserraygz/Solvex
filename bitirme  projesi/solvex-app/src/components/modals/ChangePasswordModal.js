import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKey, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function ChangePasswordModal({ user, onClose, onSubmit }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("New passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await onSubmit(currentPassword, newPassword);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Change Password</h3>
                    <button onClick={onClose} className="modal-close-button">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <p className="error-message" style={{marginBottom: '15px'}}>{error}</p>}
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faKey} className="input-icon" /></span>
                            <input
                                type={showCurrent ? "text" : "password"}
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="password-toggle-button" aria-label="Toggle current password visibility">
                                <FontAwesomeIcon icon={showCurrent ? faEyeSlash : faEye} />
                            </button>
                        </div>
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faKey} className="input-icon" /></span>
                            <input
                                type={showNew ? "text" : "password"}
                                placeholder="New Password (min. 6 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="input-field"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="password-toggle-button" aria-label="Toggle new password visibility">
                                <FontAwesomeIcon icon={showNew ? faEyeSlash : faEye} />
                            </button>
                        </div>
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faKey} className="input-icon" /></span>
                            <input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm New Password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="password-toggle-button" aria-label="Toggle confirm new password visibility">
                                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="widget-button secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="widget-button primary" disabled={loading}>
                            {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Updating...</> : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
            {}
            <style jsx>{`
                .password-toggle-button {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-medium);
                    cursor: pointer;
                    padding: 5px;
                }
                .password-toggle-button:hover {
                    color: var(--text-light);
                }
            `}</style>
        </div>
    );
}

export default ChangePasswordModal;