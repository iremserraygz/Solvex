import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserEdit, faSpinner } from '@fortawesome/free-solid-svg-icons';

function ChangeFullNameModal({ user, onClose, onSubmit }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!firstName.trim() || !lastName.trim()) {
            setError("First name and last name cannot be empty.");
            return;
        }
        setLoading(true);
        try {
            await onSubmit(firstName.trim(), lastName.trim());
        } catch (err) {

        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Change Full Name</h3>
                    <button onClick={onClose} className="modal-close-button">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <p className="error-message" style={{ marginBottom: '15px' }}>{error}</p>}
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faUserEdit} className="input-icon" /></span>
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="input-field"
                                aria-label="First Name"
                            />
                        </div>
                        <div className="input-group">
                            <span className="input-icon-wrapper"><FontAwesomeIcon icon={faUserEdit} className="input-icon" /></span>
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="input-field"
                                aria-label="Last Name"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="widget-button secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="widget-button primary" disabled={loading}>
                            {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Updating...</> : 'Update Name'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangeFullNameModal;