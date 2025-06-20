import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faChevronDown, faKey, faEnvelope, faUserEdit, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

function ProfileDropdown({ user, onLogout, onChangePassword, onChangeEmail, onChangeFullName, disabled = false }) {
    console.log('[ProfileDropdown] Received user prop:', JSON.stringify(user, null, 2));
    console.log('[ProfileDropdown] Received disabled prop:', disabled); // Gelen disabled prop'unu logla

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fullName = (user && user.firstName && user.lastName)
        ? `${user.firstName} ${user.lastName}`
        : (user && user.firstName)
            ? user.firstName
            : (user && user.email)
                ? user.email
                : "User Profile";

    const toggleDropdown = () => {
        if (!disabled) { // Sadece disabled değilse aç/kapa
            setIsOpen(!isOpen);
        }
    };

    // Eğer dropdown disable olursa ve açıksa, kapat
    useEffect(() => {
        if (disabled && isOpen) {
            setIsOpen(false);
        }
    }, [disabled, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleMenuAction = (action) => {
        setIsOpen(false);
        switch (action) {
            case 'changePassword':
                if (onChangePassword) onChangePassword();
                break;
            case 'changeEmail':
                if (onChangeEmail) onChangeEmail();
                break;
            case 'changeFullName':
                if (onChangeFullName) onChangeFullName();
                break;
            case 'logout':
                if (onLogout) onLogout();
                break;
            default:
                break;
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="profile-dropdown-container" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`profile-button ${disabled ? 'disabled' : ''}`} // Dinamik class ekle
                disabled={disabled || !user} // Butonu HTML üzerinden de disable et
                aria-disabled={disabled || !user}
            >
                <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
                <span className="profile-name">{fullName}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`dropdown-arrow ${isOpen && !disabled ? 'open' : ''}`} />
            </button>
            {isOpen && !disabled && ( // Sadece disabled değilse menüyü göster
                <div className="dropdown-menu animated-fade-in-up-fast">
                    <button onClick={() => handleMenuAction('changePassword')} className="dropdown-item">
                        <FontAwesomeIcon icon={faKey} /> Change Password
                    </button>
                    <button onClick={() => handleMenuAction('changeEmail')} className="dropdown-item">
                        <FontAwesomeIcon icon={faEnvelope} /> Change Email
                    </button>
                    <button onClick={() => handleMenuAction('changeFullName')} className="dropdown-item">
                        <FontAwesomeIcon icon={faUserEdit} /> Change Full Name
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={() => handleMenuAction('logout')} className="dropdown-item logout">
                        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                    </button>
                </div>
            )}
            <style jsx>{`
                .profile-button.disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .profile-button.disabled:hover {
                    background-color: rgba(255, 255, 255, 0.08); 
                }
            `}</style>
        </div>
    );
}

export default ProfileDropdown;