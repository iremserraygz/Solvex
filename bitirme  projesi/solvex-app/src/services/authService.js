// src/services/authService.js
import axios from 'axios';

// --- Backend Authentication API URL'nizi buraya girin ---
// Örnek: Eğer auth servisiniz 8082 portunda çalışıyorsa
const BASE_URL = 'http://localhost:8082'; // Kendi URL'nizle değiştirin
// --- --- ---

// --- API Endpoints ---
const REGISTRATION_ENDPOINT = '/api/v1/registration';
const LOGIN_ENDPOINT = '/api/v1/login';
const LOGOUT_ENDPOINT = '/logout'; // Spring Security'nin varsayılanı olabilir, kontrol et
const FORGOT_PASSWORD_ENDPOINT = '/api/v1/password/forgot';
const RESET_PASSWORD_ENDPOINT = '/api/v1/password/reset';
// --- --- ---

// --- LocalStorage Key ---
const USER_INFO_KEY = 'userInfo'; // Bilgiyi saklamak için anahtar
// --- --- ---

/**
 * Yeni kullanıcı kaydı yapar.
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Backend'den dönen yanıtın data kısmı
 */
const register = (firstName, lastName, email, password) => {
  console.log(`[AuthService] Sending registration request to: ${BASE_URL}${REGISTRATION_ENDPOINT}`);
  return axios.post(BASE_URL + REGISTRATION_ENDPOINT, { firstName, lastName, email, password })
    .then(response => {
      console.log("[AuthService] Registration successful response:", response.data);
      return response.data; // Sadece datayı döndür
    })
    .catch(error => {
      console.error("[AuthService] Registration error:", error.response?.data || error.message);
      const message = error.response?.data?.message || error.response?.data || "Registration failed.";
      throw new Error(message); // Hata fırlat
    });
};

/**
 * Kullanıcı girişi yapar. Session/cookie tabanlı çalışır.
 * Backend'in yanıtında 'id', 'email', 'instructorFlag' gibi alanların olduğunu varsayar.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Başarılı olursa backend'den dönen ve localStorage'a kaydedilen kullanıcı bilgisi objesi.
 */
const login = (email, password) => {
  console.log(`[AuthService] Sending login request to: ${BASE_URL}${LOGIN_ENDPOINT}`);
  return axios.post(BASE_URL + LOGIN_ENDPOINT,
      { email: email, password: password },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true // Session cookie için GEREKLİ
      })
      .then((response) => {
        console.log("[AuthService] Login successful, backend response data:", response.data);
        // *** Backend yanıtında id ve email KONTROLÜ ***
        if (response.data && response.data.id != null && response.data.email) {
          // App.js'nin beklediği yapıyı oluştur
          const userInfo = {
            id: response.data.id, // <<<--- BU ALANIN BACKEND'DEN GELMESİ GEREKİYOR
            email: response.data.email,
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            instructorFlag: response.data.instructorFlag || false, // Backend bu bilgiyi boolean olarak dönmeli
            loggedIn: true // Frontend state yönetimi için
            // Not: response.data.accessToken gibi bir alan varsa ve kullanıyorsanız, onu da buraya ekleyin.
            // accessToken: response.data.accessToken,
          };
          // localStorage'a kaydedilen bilgi (accessToken dahil edilebilir)
          const userInfoToStore = { ...userInfo }; // Gerekirse accessToken'ı da ekle
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfoToStore));
          console.log("[AuthService] UserInfo saved to localStorage:", userInfoToStore);

          // App.js'ye temel bilgileri döndür
          return {
              id: userInfo.id,
              email: userInfo.email,
              instructorFlag: userInfo.instructorFlag,
              loggedIn: true
          };
        } else {
          // id veya email eksikse hata fırlat
          console.error("[AuthService] Login successful but response missing required fields (id, email):", response.data);
          throw new Error("Login succeeded, but failed to retrieve complete user information."); // <<<--- ALDIĞIN HATA BURADAN GELİYOR
        }
      })
      .catch(error => {
        // Hata yönetimi
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
        throw new Error(errorMessage); // Hatayı fırlat ki component yakalasın
      });
};

/**
 * Kullanıcı çıkışı yapar. Local storage'ı temizler ve backend'deki session'ı sonlandırmaya çalışır.
 * @returns {Promise<void>}
 */
const logout = () => {
  console.log("[AuthService] Logging out user...");
  localStorage.removeItem(USER_INFO_KEY); // Local bilgiyi sil
  return axios.post(BASE_URL + LOGOUT_ENDPOINT, {}, {
    withCredentials: true // Session cookie'sini göndermek için GEREKLİ
  }).then(response => {
    console.log("[AuthService] Logout successful on backend:", response.status);
  }).catch(err => {
    console.error("[AuthService] Logout on backend might have failed:", err.response?.status || err.message);
  }).finally(() => {
    return Promise.resolve();
  });
};

/**
 * Şifre sıfırlama isteği gönderir.
 * @param {string} email
 * @returns {Promise<string>} Backend'den dönen onay mesajı
 */
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

/**
 * Verilen token ve yeni şifre ile şifreyi sıfırlar.
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<string>} Backend'den dönen başarı mesajı
 */
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

/**
 * LocalStorage'dan mevcut kullanıcı bilgisini alır.
 * @returns {object | null} Kullanıcı bilgisi objesi ({ id, email, ..., loggedIn: true }) veya null.
 */
const getCurrentUserInfo = () => {
  const userInfoString = localStorage.getItem(USER_INFO_KEY);
  if (userInfoString) {
    try {
      const user = JSON.parse(userInfoString);
      // Kaydedilmiş bilgide id ve email var mı diye kontrol et
      if (user && user.id != null && user.email) {
        user.loggedIn = true; // Oturum açık olarak işaretle
        return user;
      } else {
        console.warn("[AuthService] Invalid user info in localStorage. Clearing.");
        localStorage.removeItem(USER_INFO_KEY);
        return null;
      }
    } catch (e) {
      console.error("[AuthService] Error parsing userInfo from localStorage:", e);
      localStorage.removeItem(USER_INFO_KEY);
      return null;
    }
  }
  return null; // localStorage'da bilgi yoksa null döndür
};


// --- Helper Fonksiyonlar (Session tabanlı olduğu için gereksiz) ---
/** @deprecated Session/cookie kullanıldığı için token döndürmez */
const getCurrentUserToken = () => {
  // console.warn("[AuthService] getCurrentUserToken called, but using session/cookie auth. Returning null.");
  return null;
};

/** @deprecated Session/cookie kullanıldığı için Authorization header oluşturmaz */
const authHeader = () => {
   // console.warn("[AuthService] authHeader called, but using session/cookie auth. Returning empty object.");
  return {};
};
// --- --- ---

// --- Servis Objesinin Export Edilmesi ---
const authService = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUserInfo,
  // getCurrentUserToken, // Yorum satırı yapıldı
  // authHeader,       // Yorum satırı yapıldı
};

export default authService;