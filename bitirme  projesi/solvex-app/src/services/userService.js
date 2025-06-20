import axios from 'axios';

const LOGIN_SERVICE_BASE_URL = process.env.REACT_APP_LOGIN_SERVICE_BASE_URL || 'http://localhost:8082';
const USER_API_BASE_URL = `${LOGIN_SERVICE_BASE_URL}/api/v1/users`;
const REGISTRATION_API_URL = `${LOGIN_SERVICE_BASE_URL}/api/v1/registration`;

// Şifre Değiştirme
const changePassword = async (userId, currentPassword, newPassword) => {
    console.log(`[UserService] Attempting to change password for userId: ${userId}`);
    if (!userId) { // Frontend'de de userId kontrolü ekleme
        const errorMessage = "User ID is missing. Cannot change password.";
        console.error(`[UserService] ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
    }
    try {
        const response = await axios.put(`${USER_API_BASE_URL}/me/change-password`,
            { userId, currentPassword, newPassword }, // userId'ı payload'a ekle
            { withCredentials: true } // Session cookie'leri yine de gönderilebilir, backend permitAll olsa bile
        );
        console.log("[UserService] Change Password Response:", response.data);
        return response.data?.message || "Password changed successfully.";
    } catch (error) {
        console.error("[UserService] Change Password Error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to change password.";
        throw new Error(errorMessage);
    }
};

// E-posta Değişikliği İsteği
const requestEmailChange = async (userId, newEmail, currentPassword) => {
    console.log(`[UserService] Requesting email change for userId: ${userId} to newEmail: ${newEmail}`);
    if (!userId) {
        const errorMessage = "User ID is missing. Cannot request email change.";
        console.error(`[UserService] ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
    }
    try {
        const response = await axios.post(`${USER_API_BASE_URL}/me/request-email-change`,
            { userId, newEmail, currentPassword }, // userId'ı payload'a ekle
            { withCredentials: true }
        );
        console.log("[UserService] Request Email Change Response:", response.data);
        return response.data?.message || `Verification link sent to ${newEmail}.`;
    } catch (error) {
        console.error("[UserService] Request Email Change Error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to request email change.";
        throw new Error(errorMessage);
    }
};

// E-posta Değişikliğini Doğrulama
const verifyEmailChange = async (token) => {
    console.log(`[UserService] Verifying email change with token: ${token}`);
    if (!token) {
        const errorMessage = "Verification token is missing.";
        console.error(`[UserService] ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
    }
    try {
        const response = await axios.get(`${REGISTRATION_API_URL}/confirm-email-change?token=${token}`);
        console.log("[UserService] Verify Email Change Response:", response.data);
        return response.data?.message || "Email verified and updated successfully.";
    } catch (error) {
        console.error("[UserService] Verify Email Change Error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to verify email. Link may be invalid or expired.";
        throw new Error(errorMessage);
    }
};

// Ad/Soyad Değiştirme
const changeFullName = async (userId, firstName, lastName) => {
    console.log(`[UserService] Changing full name for userId: ${userId} to ${firstName} ${lastName}`);
    if (!userId) {
        const errorMessage = "User ID is missing. Cannot change full name.";
        console.error(`[UserService] ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
    }
    try {
        const response = await axios.put(`${USER_API_BASE_URL}/me/change-fullname`,
            { userId, firstName, lastName }, // userId'ı payload'a ekle
            { withCredentials: true }
        );
        console.log("[UserService] Change Full Name - Backend Response:", response.data);

        if (response.data && response.data.user && response.data.user.id) {
            return response.data.user; // Return the nested user object
        } else if (response.data && response.data.message && !response.data.user) {
            console.warn("[UserService] Full name change responded with message but missing 'user' object:", response.data);
            throw new Error(response.data.message + " (But updated user details were not returned for UI update)");
        } else {
            console.error("[UserService] Full name change response missing expected 'user' data or unexpected format:", response.data);
            throw new Error("Full name may have been updated, but user data was not returned in the expected format.");
        }
    } catch (error) {
        console.error("[UserService] Change Full Name Error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to change full name.";
        throw new Error(errorMessage);
    }
};

const userService = {
    changePassword,
    requestEmailChange,
    verifyEmailChange,
    changeFullName,
};

export default userService;