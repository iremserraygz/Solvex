import React, { useState, useEffect, useCallback } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import './App.css';

// --- Component Importları ---
import MainScreen from './components/MainScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import InstructorDashboard from './components/InstructorDashboard';
import StudentDashboard from './components/StudentDashboard';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import ChangeEmailModal from './components/modals/ChangeEmailModal';
import ChangeFullNameModal from './components/modals/ChangeFullNameModal';
// --- --- ---

// Servis importu
import authService from './services/authService';
import userService from './services/userService';
export const USER_INFO_KEY = 'userInfo';


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

function App() {
    // --- State Tanımlamaları ---
    const [currentUser, setCurrentUser] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('loading');
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [init, setInit] = useState(false);

    const [resetToken, setResetToken] = useState(null);
    const [emailVerificationToken, setEmailVerificationToken] = useState(null); // For existing user email change
    const [registrationConfirmationToken, setRegistrationConfirmationToken] = useState(null); // For new user registration confirmation

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
    const [showChangeFullNameModal, setShowChangeFullNameModal] = useState(false);
    const [appMessage, setAppMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
            setInit(true); // setInit buraya taşındıe
            console.log("[App.js] Particles engine initialized.");
        }).catch(error => {
            console.error("Failed to initialize particles engine:", error);
            setInit(true); // Hata olsa bile devam et
        });
    }, []);

    // Navigasyon Fonksiyonu (Eski haliyle benzer, token temizlemeleri eklendi)
    const navigateTo = useCallback((screen, noFade = false) => {
        if ((screen === currentScreen && !noFade) || (isFadingOut && !noFade)) return;
        console.log(`[App.js] Navigating from ${currentScreen} to ${screen}`);
        setAppMessage({ text: '', type: '' }); // Her navigasyonda mesajı temizle

        if (noFade) {
            setCurrentScreen(screen);
        } else {
            setIsFadingOut(true);
            setTimeout(() => {
                setCurrentScreen(screen);
                setIsFadingOut(false);
            }, 300);
        }
        // Token'ları sadece ilgili ekranlardan çıkarken temizle
        if (screen !== 'resetPassword') setResetToken(null);
        if (screen !== 'verifyingEmail') setEmailVerificationToken(null);
        if (screen !== 'confirmingRegistration') setRegistrationConfirmationToken(null);

    }, [currentScreen, isFadingOut]);


    // Navigasyon Yardımcıları
    const navigateToLogin = useCallback(() => navigateTo('login'), [navigateTo]);
    const navigateToSignUp = useCallback(() => navigateTo('signup'), [navigateTo]);
    const navigateToMain = useCallback(() => navigateTo('main'), [navigateTo]);
    const navigateToForgotPassword = useCallback(() => navigateTo('forgotPassword'), [navigateTo]);



    // --- İlk Ekran Belirleme VE URL Aksiyonlarını İşleme ---
    useEffect(() => {
        if (!init) return; // Particles motorunun yüklenmesini bekle

        console.log("[App.js Init Effect] Checking URL and localStorage...");
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const tokenFromUrl = params.get('token');
        let determinedScreen = 'loading';

        // 1. URL Aksiyonlarını Kontrol Et (Öncelikli)
        if (action === 'reset' && tokenFromUrl) {
            console.log("[App.js Init Effect] Password reset link detected.");
            setCurrentUser(null);
            setResetToken(tokenFromUrl);
            determinedScreen = 'resetPassword';
            window.history.replaceState(null, '', window.location.pathname);
        } else if (action === 'verifyEmail' && tokenFromUrl) { // Mevcut kullanıcı e-posta değişikliği
            console.log("[App.js Init Effect] Email change verification link detected.");
            // Bu aşamada currentUser'ı null yapmıyoruz, çünkü bu mevcut bir kullanıcının işlemi olabilir.
            // Ancak, doğrulama sonrası logout ve login gerekebilir.
            setEmailVerificationToken(tokenFromUrl);
            determinedScreen = 'verifyingEmail';
            window.history.replaceState(null, '', window.location.pathname);
        } else if (action === 'confirmRegistration' && tokenFromUrl) { // Yeni kullanıcı kaydı onayı
            console.log("[App.js Init Effect] Account registration confirmation link detected.");
            setCurrentUser(null); // Yeni kayıt, henüz login olmamış olmalı
            setRegistrationConfirmationToken(tokenFromUrl);
            determinedScreen = 'confirmingRegistration';
            window.history.replaceState(null, '', window.location.pathname);
        } else {
            // 2. URL Aksiyonu Yoksa localStorage'ı Kontrol Et
            const user = authService.getCurrentUserInfo();
            if (user && user.loggedIn && user.id != null) {
                console.log("[App.js Init Effect] Logged in user found from localStorage:", user);
                setCurrentUser(user);
                determinedScreen = user.instructorFlag ? 'dashboard' : 'studentDashboard';
            } else {
                console.log("[App.js Init Effect] No logged in user found in localStorage.");
                setCurrentUser(null);
                determinedScreen = 'main';
            }
        }

        // currentScreen'i sadece 'loading' durumundaysa veya bir URL aksiyonuyla değiştiyse güncelle
        if (currentScreen === 'loading' || determinedScreen !== 'loading') {
            setCurrentScreen(determinedScreen);
        }

    }, [init]); // Sadece 'init'e bağlı olmalı


    // --- E-posta Değişikliği Doğrulama API Çağrısı ---
    useEffect(() => {
        if (emailVerificationToken && currentScreen === 'verifyingEmail' && init) {
            console.log("[App.js] API Call: Verifying EXISTING USER email change. Token:", emailVerificationToken);
            setAppMessage({ text: 'Verifying your new email address...', type: 'info' });
            userService.verifyEmailChange(emailVerificationToken)
                .then(responseMessage => {
                    setAppMessage({ text: responseMessage || "Email successfully changed! Please log in again with your new email address.", type: 'success' });
                    setTimeout(() => { // Mesajın görünmesi için bekle
                        authService.logout().finally(() => { // Logout yap
                            setCurrentUser(null);
                            setEmailVerificationToken(null);
                            navigateToLogin(); // Login sayfasına yönlendir
                        });
                    }, 3000);
                })
                .catch(error => {
                    setAppMessage({ text: error.message || "Email verification failed. Link may be invalid or expired.", type: 'error' });
                    setTimeout(() => { // Hata mesajı için bekle
                        setEmailVerificationToken(null);
                        navigateToMain(); // Ana sayfaya veya login'e yönlendir
                    }, 3000);
                });
        }
    }, [emailVerificationToken, currentScreen, init, navigateToLogin, navigateToMain]);

    // --- Yeni Kullanıcı Kaydı Doğrulama API Çağrısı ---
    useEffect(() => {
        if (registrationConfirmationToken && currentScreen === 'confirmingRegistration' && init) {
            console.log("[App.js] API Call: Confirming NEW USER account registration. Token:", registrationConfirmationToken);
            setAppMessage({ text: 'Confirming your account registration...', type: 'info' });
            authService.confirmAccountRegistration(registrationConfirmationToken)
                .then(responseMessage => {
                    setAppMessage({ text: responseMessage || "Account confirmed successfully! You can now log in.", type: 'success' });
                    setTimeout(() => { // Mesajın görünmesi için bekle
                        setRegistrationConfirmationToken(null);
                        navigateToLogin(); // Kayıt onaylandıktan sonra login'e yönlendir
                    }, 3000);
                })
                .catch(error => {
                    setAppMessage({ text: error.message || "Account confirmation failed. The link may be invalid or expired.", type: 'error' });
                    setTimeout(() => { // Hata mesajı için bekle
                        setRegistrationConfirmationToken(null);
                        navigateToSignUp(); // Hata durumunda signup'a veya main'e yönlendir
                    }, 3000);
                });
        }
    }, [registrationConfirmationToken, currentScreen, init, navigateToLogin, navigateToSignUp]);


    // Login Başarılı Olduğunda
    const handleLoginSuccess = useCallback((userInfo) => {
        if (userInfo && userInfo.id != null) {
            console.log('[App.js] Login successful, updating state and navigating:', userInfo);
            setCurrentUser(userInfo);
            navigateTo(userInfo.instructorFlag ? 'dashboard' : 'studentDashboard');
        } else {
            console.error("[App.js] Login successful but user info is missing ID:", userInfo);
            setAppMessage({ text: "Login successful, but couldn't retrieve user details.", type: 'warning' });
            navigateToMain();
        }
    }, [navigateTo, navigateToMain]);

    // Logout İşlemi
    const handleLogout = useCallback(() => {
        console.log("[App.js] Logging out user...");
        authService.logout().finally(() => {
            setCurrentUser(null);
            setResetToken(null);
            setEmailVerificationToken(null);
            setRegistrationConfirmationToken(null); // Logout'ta bunu da temizle
            setShowChangePasswordModal(false);
            setShowChangeEmailModal(false);
            setShowChangeFullNameModal(false);
            navigateToMain();
        });
    }, [navigateToMain]);


    // Modal açma/kapama ve submit handler'ları
    const openChangePasswordModal = useCallback(() => { console.log("[App.js] openChangePasswordModal called"); setAppMessage({text:'', type:''}); setShowChangePasswordModal(true); }, []);
    const openChangeEmailModal = useCallback(() => { console.log("[App.js] openChangeEmailModal called"); setAppMessage({text:'', type:''}); setShowChangeEmailModal(true); }, []);
    const openChangeFullNameModal = useCallback(() => { console.log("[App.js] openChangeFullNameModal called"); setAppMessage({text:'', type:''}); setShowChangeFullNameModal(true); }, []);
    const closeAllModals = () => { setShowChangePasswordModal(false); setShowChangeEmailModal(false); setShowChangeFullNameModal(false); };

    const handleChangePasswordSubmit = async (currentPassword, newPassword) => {
        if (!currentUser || !currentUser.id) { setAppMessage({ text: "User not identified.", type: 'error'}); return Promise.reject(new Error("User not identified.")); }
        setAppMessage({ text: '', type: '' });
        try {
            const message = await userService.changePassword(currentUser.id, currentPassword, newPassword);
            setAppMessage({ text: message || "Password changed! Please log in again.", type: 'success' });
            closeAllModals();
            setTimeout(handleLogout, 2000);
            return Promise.resolve(message);
        } catch (error) { setAppMessage({ text: error.message || "Failed to change password.", type: 'error' }); return Promise.reject(error); }
    };
    const handleChangeEmailSubmit = async (newEmail, password) => {
        if (!currentUser || !currentUser.id) { setAppMessage({ text: "User not identified.", type: 'error'}); return Promise.reject(new Error("User not identified.")); }
        setAppMessage({ text: '', type: '' });
        try {
            const message = await userService.requestEmailChange(currentUser.id, newEmail, password);
            setAppMessage({ text: message || `Verification link sent to ${newEmail}.`, type: 'success' });
            closeAllModals();
            return Promise.resolve(message);
        } catch (error) { setAppMessage({ text: error.message || "Failed to request email change.", type: 'error' }); return Promise.reject(error); }
    };
    const handleChangeFullNameSubmit = async (newFirstName, newLastName) => {
        if (!currentUser || !currentUser.id) { setAppMessage({ text: "User not identified.", type: 'error'}); return Promise.reject(new Error("User not identified.")); }
        setAppMessage({ text: '', type: '' });
        try {
            const updatedUser = await userService.changeFullName(currentUser.id, newFirstName, newLastName);
            const newUserState = { ...currentUser, ...updatedUser };
            setCurrentUser(newUserState);
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(newUserState));
            setAppMessage({ text: "Full name updated successfully!", type: 'success' });
            closeAllModals();
            return Promise.resolve(updatedUser);
        } catch (error) { setAppMessage({ text: error.message || "Failed to change full name.", type: 'error' }); return Promise.reject(error); }
    };


    // --- EKRAN RENDER FONKSİYONU ---
    const renderScreen = () => {
        if (currentScreen === 'loading' || !init) {
            return <div className="loading-placeholder"><span>Loading Application...</span></div>;
        }
        if (currentScreen === 'verifyingEmail') {
            return <div className="loading-placeholder"><span>Verifying your new email address... Please wait.</span></div>;
        }
        if (currentScreen === 'confirmingRegistration') {
            return <div className="loading-placeholder"><span>Confirming your account registration... Please wait.</span></div>;
        }

        const commonDashboardProps = {
            user: currentUser,
            onLogout: handleLogout,
            onChangePassword: openChangePasswordModal,
            onChangeEmail: openChangeEmailModal,
            onChangeFullName: openChangeFullNameModal,
        };

        // Güvenlik ve Yönlendirme Kontrolleri (render içinde)
        if (init) { // Sadece ilk yükleme tamamlandıktan sonra yönlendirme yap
            if (currentUser) { // Kullanıcı giriş yapmışsa
                const isInstructor = !!currentUser.instructorFlag;
                const targetDashboard = isInstructor ? 'dashboard' : 'studentDashboard';
                // Eğer kullanıcı login olmuşsa ve main/login/signup gibi bir ekrandaysa, doğru dashboard'a yönlendir
                if (['main', 'login', 'signup', 'forgotPassword'].includes(currentScreen)) {
                    console.log(`[Render] User logged in, on ${currentScreen}, navigating to ${targetDashboard}`);
                    setTimeout(() => navigateTo(targetDashboard, true), 0);
                    return <div className="loading-placeholder"><span>Redirecting...</span></div>;
                }
                // Eğer kullanıcı yanlış dashboard'daysa, doğru dashboard'a yönlendir
                if (currentScreen === 'dashboard' && !isInstructor) {
                    console.warn("[Render] Non-instructor on instructor dash. Redirecting.");
                    setTimeout(() => navigateTo('studentDashboard', true), 0);
                    return <div className="loading-placeholder"><span>Redirecting...</span></div>;
                }
                if (currentScreen === 'studentDashboard' && isInstructor) {
                    console.warn("[Render] Instructor on student dash. Redirecting.");
                    setTimeout(() => navigateTo('dashboard', true), 0);
                    return <div className="loading-placeholder"><span>Redirecting...</span></div>;
                }
            } else { // Kullanıcı giriş yapmamışsa
                const nonAuthScreens = ['login', 'signup', 'forgotPassword', 'resetPassword', 'verifyingEmail', 'confirmingRegistration', 'main', 'loading'];
                if (!nonAuthScreens.includes(currentScreen)) {
                    // Eğer kullanıcı login olmamış ve korunması gereken bir ekrandaysa, ana ekrana yönlendir
                    console.warn(`[Render] No user, but on ${currentScreen}. Redirecting to main.`);
                    setTimeout(() => navigateTo('main', true), 0);
                    return <div className="loading-placeholder"><span>Redirecting...</span></div>;
                }
            }
        }


        switch (currentScreen) {
            case 'login':
                return <LoginScreen onBack={navigateToMain} onSwitchToSignUp={navigateToSignUp} onLoginSuccess={handleLoginSuccess} onForgotPasswordClick={navigateToForgotPassword}/>;
            case 'signup':
                return <SignUpScreen onBack={navigateToMain} onSwitchToLogin={navigateToLogin}/>;
            case 'forgotPassword':
                return <ForgotPasswordScreen onBack={navigateToLogin} onSwitchToLogin={navigateToLogin}/>;
            case 'resetPassword':
                return resetToken ? <ResetPasswordScreen token={resetToken} onPasswordResetSuccess={navigateToLogin}/> : <MainScreen onLoginClick={navigateToLogin} onSignUpClick={navigateToSignUp} />; // Token yoksa ana ekran
            case 'dashboard':
                return currentUser && currentUser.instructorFlag ? <InstructorDashboard {...commonDashboardProps} /> : <MainScreen onLoginClick={navigateToLogin} onSignUpClick={navigateToSignUp} />; // Yetkisizse ana ekran
            case 'studentDashboard':
                return currentUser && !currentUser.instructorFlag ? <StudentDashboard {...commonDashboardProps} /> : <MainScreen onLoginClick={navigateToLogin} onSignUpClick={navigateToSignUp} />; // Yetkisizse ana ekran
            case 'main':
            default:
                return <MainScreen onLoginClick={navigateToLogin} onSignUpClick={navigateToSignUp} />;
        }
    };

    if (!init && currentScreen === 'loading') { // Bu, init false iken sadece loading gösterir
        return <div className="App loading-placeholder"><span>Initializing...</span></div>;
    }

    return (
        <div className={`App ${isFadingOut ? 'screen-fade-out' : ''}`}>
            {init && <Particles id="tsparticles" options={particlesOptions} />}
            {appMessage.text && (
                <div className={`app-message-banner ${appMessage.type}`}>
                    {appMessage.text}
                    <button onClick={() => setAppMessage({ text: '', type: '' })}>×</button>
                </div>
            )}
            {renderScreen()}

            {/* Modals */}
            {showChangePasswordModal && currentUser && (
                <ChangePasswordModal
                    user={currentUser}
                    onClose={closeAllModals}
                    onSubmit={handleChangePasswordSubmit}
                />
            )}
            {showChangeEmailModal && currentUser && (
                <ChangeEmailModal
                    user={currentUser}
                    onClose={closeAllModals}
                    onSubmit={handleChangeEmailSubmit}
                />
            )}
            {showChangeFullNameModal && currentUser && (
                <ChangeFullNameModal
                    user={currentUser}
                    onClose={closeAllModals}
                    onSubmit={handleChangeFullNameSubmit}
                />
            )}
        </div>
    );
}

export default App;