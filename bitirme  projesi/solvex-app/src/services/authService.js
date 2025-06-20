import axios from 'axios';

const BASE_URL = process.env.REACT_APP_LOGIN_SERVICE_BASE_URL || 'http://localhost:8082';
const REGISTRATION_ENDPOINT = '/api/v1/registration';
const LOGIN_ENDPOINT = '/api/v1/login';
const LOGOUT_ENDPOINT = '/logout';
const FORGOT_PASSWORD_ENDPOINT = '/api/v1/password/forgot';
const RESET_PASSWORD_ENDPOINT = '/api/v1/password/reset';
const USER_INFO_KEY = 'userInfo'; 

const register = (firstName, lastName, email, password) => {
  console.log(`[AuthService] Sending registration request to: ${BASE_URL}${REGISTRATION_ENDPOINT}`);
  return axios.post(BASE_URL + REGISTRATION_ENDPOINT, { firstName, lastName, email, password })
      .then(response => {
        console.log("[AuthService] Registration successful response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("[AuthService] Registration error:", error.response?.data || error.message);
        const message = error.response?.data?.message || error.response?.data || "Registration failed.";
        throw new Error(message);
      });
};

const confirmAccountRegistration = (token) => {
  console.log(`[AuthService] Confirming account registration with token: ${token}`);
  if (!token) {
    return Promise.reject(new Error("Confirmation token is missing."));
  }
  return axios.get(`${BASE_URL}${REGISTRATION_ENDPOINT}/confirm?token=${token}`)
      .then(response => {
        console.log("[AuthService] Account confirmation successful:", response.data);

        return response.data;
      })
      .catch(error => {
        console.error("[AuthService] Account confirmation error:", error.response?.data || error.message);
        const resMessage = error.response?.data || "Account confirmation failed. The link might be invalid or expired.";
        let finalMessage = "Account confirmation failed.";
        if (typeof resMessage === 'string') {
          finalMessage = resMessage;
        } else if (resMessage && resMessage.message) {
          finalMessage = resMessage.message;
        } else if (resMessage && resMessage.error) {
          finalMessage = resMessage.error;
        }
        throw new Error(finalMessage);
      });
};


const login = (email, password) => {
  console.log(`[AuthService] Sending login request to: ${BASE_URL}${LOGIN_ENDPOINT}`);
  return axios.post(BASE_URL + LOGIN_ENDPOINT,
      { email: email, password: password+"123" },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
      .then((response) => {
        console.log("[AuthService] Login successful, backend response data:", response.data);
        if (response.data && response.data.id != null && response.data.email) {
          const userInfo = {
            id: response.data.id,
            email: response.data.email,
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            instructorFlag: response.data.instructorFlag || false,
            loggedIn: true
          };
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
          console.log("[AuthService] UserInfo saved to localStorage:", userInfo);
          return userInfo;
        } else {
          console.error("[AuthService] Login successful but response missing required fields (id, email, firstName, lastName):", response.data);
          throw new Error("Login succeeded, but failed to retrieve complete user information.");
        }
      })
      .catch(error => {
        let errorMessage = "Login failed. Please check your credentials or network connection.";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data) {
          try { errorMessage = JSON.stringify(error.response.data); } catch (e) {}
        } else if (error.response?.status === 401) {
          errorMessage = "Invalid Credentials or Authentication Failed";
        } else if (error.message) {
          errorMessage = error.message;
        }
        console.error("[AuthService] Login failed:", error.response || error);
        throw new Error(errorMessage);
      });
};

const logout = () => {
  console.log("[AuthService] Logging out user...");
  localStorage.removeItem(USER_INFO_KEY);
  return axios.post(BASE_URL + LOGOUT_ENDPOINT, {}, {
    withCredentials: true
  }).then(response => {
    console.log("[AuthService] Logout successful on backend:", response.status);
  }).catch(err => {
    console.error("[AuthService] Logout on backend might have failed:", err.response?.status || err.message);
  }).finally(() => {
    return Promise.resolve();
  });
};

const forgotPassword = (email) => {
  console.log(`[AuthService] Sending forgot password request for email: ${email}`);
  return axios.post(BASE_URL + FORGOT_PASSWORD_ENDPOINT, { email })
      .then(response => {
        console.log("[AuthService] Forgot password request response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("[AuthService] Forgot password request failed:", error.response?.data || error.message);
        const message = error.response?.data?.message || error.response?.data || "Could not process the request.";
        throw new Error(message);
      });
};

const resetPassword = (token, newPassword) => {
  console.log(`[AuthService] Sending reset password request`);
  if (!token) { return Promise.reject(new Error("Reset token is missing.")); }
  return axios.post(BASE_URL + RESET_PASSWORD_ENDPOINT, { token, newPassword })
      .then(response => {
        console.log("[AuthService] Reset password request successful:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("[AuthService] Reset password request failed:", error.response?.data || error.message);
        const message = error.response?.data?.message || error.response?.data || "Failed to reset password.";
        throw new Error(message);
      });
};

const getCurrentUserInfo = () => {
  const userInfoString = localStorage.getItem(USER_INFO_KEY);
  if (userInfoString) {
    try {
      const user = JSON.parse(userInfoString);
      if (user && user.id != null && user.email) {
        user.loggedIn = true;
        return user;
      } else {
        console.warn("[AuthService] Invalid user info in localStorage (missing id or email). Clearing.");
        localStorage.removeItem(USER_INFO_KEY);
        return null;
      }
    } catch (e) {
      console.error("[AuthService] Error parsing userInfo from localStorage:", e);
      localStorage.removeItem(USER_INFO_KEY);
      return null;
    }
  }
  return null;
};

const authService = {
  register,
  confirmAccountRegistration, // YENİ EKLENDİ
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUserInfo,
};

export default authService;