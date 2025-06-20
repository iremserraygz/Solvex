import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEnvelope, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

function ChangeEmailModal({ user, onClose, onSubmit }) {
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
            setError("Please enter a valid new email address.");
            return;
        }
        if (!currentPassword) {
            setError("Please enter your current password to confirm.");
            return;
        }
        setLoading(true);
        try {
            await onSubmit(newEmail, currentPassword);

        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Change Email Address</h3>
                    <button onClick={onClose} className="modal-close-button">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <p className="error-message" style={{ marginBottom: '15px' }}>{error}</p>}
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginBottom: '15px' }}>
                            A verification link will be sent to your new email address.
                            You'll need to click this link to confirm the change.
                            Your current email (<strong style={{color: 'var(--text-light)'}}>{user?.email}</strong>) will remain active until the new one is verified.
                        </p>
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faEnvelope} className="input-icon" /></span>
                            <input
                                type="email"
                                placeholder="New Email Address"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                className="input-field"
                            />
                        </div>
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faLock} className="input-icon" /></span>
                            <input
                                type="password"
                                placeholder="Current Password (to confirm)"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="widget-button secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="widget-button primary" disabled={loading}>
                            {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Sending Link...</> : 'Send Verification Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangeEmailModal;