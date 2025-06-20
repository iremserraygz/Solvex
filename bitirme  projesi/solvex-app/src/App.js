// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import './App.css'; // Global stiller

// --- Component Importları ---
import MainScreen from './components/MainScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import InstructorDashboard from './components/InstructorDashboard'; // Eğitmen için
import StudentDashboard from './components/StudentDashboard';   // Öğrenci için
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
// --- --- ---

// Servis importu
import authService from './services/authService';

// --- tsParticles Konfigürasyonu ---
const particlesOptions = {
    fullScreen: { enable: true, zIndex: 0 },
    fpsLimit: 60,
    interactivity: { events: { onClick: { enable: false }, onHover: { enable: false }, resize: true } },
    particles: {
        color: { value: ["#FFFFFF", "#E0E8F0", "#B0C4DE"] },
        links: { color: "rgba(255, 255, 255, 0.05)", distance: 160, enable: true, opacity: 0.1, width: 1, },
        move: { direction: "none", enable: true, outModes: { default: "out" }, random: true, speed: 0.5, straight: false, },
        number: { density: { enable: true, area: 800 }, value: 80, },
        opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: 1, sync: false, minimumValue: 0.1 } },
        shape: { type: "circle" },
        size: { value: { min: 0.5, max: 1.5 }, },
    },
    detectRetina: true,
};
// --- --- ---

function App() {
    // --- State Tanımlamaları ---
    const [currentUser, setCurrentUser] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('loading'); // Start as loading
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [init, setInit] = useState(false);
    const [resetToken, setResetToken] = useState(null);
    // --- --- ---

    // Particles motorunu yükle
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
            setInit(true);
        }).catch(error => {
            console.error("Failed to initialize particles engine:", error);
            setInit(true); // Proceed even if particles fail
        });
    }, []);

    // --- İlk Ekran Belirleme (MODIFIED) ---
    useEffect(() => {
        if (!init) return; // Wait for particles engine

        console.log("[App.js Init Effect] Checking URL and localStorage...");
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const tokenFromUrl = params.get('token');

        // 1. Check for Password Reset Link FIRST
        if (action === 'reset' && tokenFromUrl) {
            console.log("[App.js Init Effect] Password reset link detected.");
            setCurrentUser(null); // Ensure no user is logged in
            setResetToken(tokenFromUrl);
            setCurrentScreen('resetPassword'); // Go directly to reset screen
            window.history.replaceState(null, '', window.location.pathname); // Clean URL
            return; // Stop further processing
        }

        // 2. Check for Logged-in User in localStorage (but don't navigate yet)
        const user = authService.getCurrentUserInfo();
        if (user && user.loggedIn && user.id != null) {
            console.log("[App.js Init Effect] Logged in user found, setting state:", user);
            setCurrentUser(user); // Set the user state
        } else {
            console.log("[App.js Init Effect] No logged in user found or user ID missing.");
            setCurrentUser(null); // Clear user state if invalid/missing
        }

        // 3. Set Initial Screen to 'main' (unless it was password reset)
        // This ensures MainScreen is the default entry point if not resetting password.
        // Navigation to dashboards will happen *after* successful login via handleLoginSuccess.
        console.log("[App.js Init Effect] Setting initial screen to 'main'.");
        setCurrentScreen('main');

    }, [init]); // Run only when 'init' becomes true

    // Navigasyon Fonksiyonu
    const navigateTo = useCallback((screen) => {
        if (screen === currentScreen || isFadingOut) return;
        console.log(`[App.js] Navigating from ${currentScreen} to ${screen}`);
        setIsFadingOut(true);
        if (screen !== 'resetPassword') { setResetToken(null); } // Clear reset token if navigating elsewhere
        setTimeout(() => {
            setCurrentScreen(screen);
            setIsFadingOut(false);
        }, 300);
    }, [currentScreen, isFadingOut]);

    // Navigasyon Yardımcıları
    const navigateToLogin = useCallback(() => navigateTo('login'), [navigateTo]);
    const navigateToSignUp = useCallback(() => navigateTo('signup'), [navigateTo]);
    const navigateToMain = useCallback(() => navigateTo('main'), [navigateTo]);
    // Keep dashboard navigations for use after login/logout, but they won't be called by MainScreen dev buttons anymore
    const navigateToInstructorDashboard = useCallback(() => navigateTo('dashboard'), [navigateTo]);
    const navigateToStudentDashboard = useCallback(() => navigateTo('studentDashboard'), [navigateTo]);
    const navigateToForgotPassword = useCallback(() => navigateTo('forgotPassword'), [navigateTo]);

    // Login Başarılı Olduğunda
    const handleLoginSuccess = useCallback((userInfo) => {
        if (userInfo && userInfo.id != null) {
            console.log('[App.js] Login successful, updating state and navigating:', userInfo);
            setCurrentUser(userInfo);
            // Navigate to the correct dashboard AFTER login
            navigateTo(userInfo.instructorFlag ? 'dashboard' : 'studentDashboard');
        } else {
            console.error("[App.js] Login successful but user info is missing ID:", userInfo);
            alert("Login successful, but couldn't retrieve user details properly. Please try again.");
            navigateToMain(); // Go back to main screen on error
        }
    }, [navigateTo, navigateToMain]); // Dependencies updated

    // Logout İşlemi
    const handleLogout = useCallback(() => {
        console.log("[App.js] Logging out user...");
        authService.logout().finally(() => {
            setCurrentUser(null);
            setResetToken(null);
            navigateToMain(); // Navigate back to main screen after logout
        });
    }, [navigateToMain]);

    // --- EKRAN RENDER FONKSİYONU ---
    const renderScreen = () => {
        // console.log(`[App.js Render] Screen: ${currentScreen}, User: ${currentUser ? currentUser.id : 'null'}`);

        // Security checks (remain the same)
        if (!currentUser && (currentScreen === 'dashboard' || currentScreen === 'studentDashboard')) {
            console.warn(`[App.js Render] Unauthorized access attempt to ${currentScreen}. Redirecting to main.`);
            setTimeout(() => navigateToMain(), 0);
            return <div className="loading-placeholder"><span>Redirecting...</span></div>;
        }
        if (currentUser && currentScreen === 'dashboard' && !currentUser.instructorFlag) {
            console.warn(`[App.js Render] Student user tried to access instructor dashboard. Redirecting.`);
            setTimeout(() => navigateToStudentDashboard(), 0);
            return <div className="loading-placeholder"><span>Redirecting...</span></div>;
        }
        if (currentUser && currentScreen === 'studentDashboard' && currentUser.instructorFlag) {
            console.warn(`[App.js Render] Instructor user tried to access student dashboard. Redirecting.`);
            setTimeout(() => navigateToInstructorDashboard(), 0);
            return <div className="loading-placeholder"><span>Redirecting...</span></div>;
        }

        // Loading state check (before init finishes)
        if (currentScreen === 'loading') {
            return <div className="loading-placeholder"><span>Loading Application...</span></div>;
        }

        switch (currentScreen) {
            case 'login':
                return <LoginScreen onBack={navigateToMain} onSwitchToSignUp={navigateToSignUp} onLoginSuccess={handleLoginSuccess} onForgotPasswordClick={navigateToForgotPassword}/>;
            case 'signup':
                return <SignUpScreen onBack={navigateToMain} onSwitchToLogin={navigateToLogin}/>;
            case 'forgotPassword':
                return <ForgotPasswordScreen onBack={navigateToLogin} onSwitchToLogin={navigateToLogin}/>;
            case 'resetPassword':
                // Render only if token exists, otherwise redirect (handled by useEffect setting screen to 'main' if no token)
                return resetToken ? <ResetPasswordScreen token={resetToken} onPasswordResetSuccess={navigateToLogin}/> : null;
            case 'dashboard': // Instructor
                return currentUser && currentUser.instructorFlag ? <InstructorDashboard user={currentUser} onLogout={handleLogout} /> : null;
            case 'studentDashboard': // Student
                return currentUser && !currentUser.instructorFlag ? <StudentDashboard user={currentUser} onLogout={handleLogout} /> : null;
            case 'main':
            default:
                // Render MainScreen without the dev dashboard props
                return <MainScreen
                    onLoginClick={navigateToLogin}
                    onSignUpClick={navigateToSignUp}
                    // Removed onGoToDashboardClick and onGoToStudentDashboardClick
                />;
        }
    };
    // --- --- ---

    if (!init) {
        return <div className="App loading-placeholder"><span>Initializing...</span></div>;
    }

    return (
        <div className={`App ${isFadingOut ? 'screen-fade-out' : ''}`}>
            <Particles id="tsparticles" options={particlesOptions} />
            {renderScreen()} {/* Render the active screen */}
        </div>
    );
}

export default App;