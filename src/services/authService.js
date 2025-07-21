// authService.js - Service untuk authentication dengan database
// File: src/services/authService.js

// Base URL untuk API PHP backend
const API_BASE_URL = 'http://localhost/bartech-api'; // Sesuaikan dengan setup XAMPP/WAMP Anda

class AuthService {
  
  // ===============================
  // REGISTER USER BARU
  // ===============================
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api.php?action=register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          password: userData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message || 'Registrasi berhasil!',
          user: data.user
        };
      } else {
        return {
          success: false,
          message: data.message || 'Registrasi gagal'
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
      };
    }
  }

  // ===============================
  // LOGIN USER
  // ===============================
  async login(email, password, rememberMe = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api.php?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          rememberMe: rememberMe
        })
      });

      const data = await response.json();

      if (data.success) {
        // Simpan user data ke localStorage
        const userData = {
          user_id: data.user.user_id,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          email: data.user.email,
          phoneNumber: data.user.phone_number,
          fullName: `${data.user.first_name} ${data.user.last_name}`,
          loginTime: new Date().toISOString()
        };

        // Simpan ke localStorage
        localStorage.setItem('bartechUser', JSON.stringify(userData));
        
        // Jika remember me, simpan token
        if (rememberMe && data.rememberToken) {
          localStorage.setItem('bartechRememberToken', data.rememberToken);
        }

        return {
          success: true,
          message: data.message || 'Login berhasil!',
          user: userData,
          redirectTo: '/dashboard'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Email atau password salah'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
      };
    }
  }

  // ===============================
  // LOGOUT USER
  // ===============================
  logout() {
    try {
      // Hapus semua data user dari localStorage
      localStorage.removeItem('bartechUser');
      localStorage.removeItem('bartechRememberToken');
      
      return {
        success: true,
        message: 'Logout berhasil',
        redirectTo: '/login'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Gagal logout'
      };
    }
  }

  // ===============================
  // CEK APAKAH USER SUDAH LOGIN
  // ===============================
  isAuthenticated() {
    try {
      const userData = localStorage.getItem('bartechUser');
      return userData !== null;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // ===============================
  // AMBIL DATA USER YANG SEDANG LOGIN
  // ===============================
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('bartechUser');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // ===============================
  // AUTO LOGIN DENGAN REMEMBER TOKEN
  // ===============================
  async autoLogin() {
    try {
      const rememberToken = localStorage.getItem('bartechRememberToken');
      if (!rememberToken) {
        return { success: false, message: 'No remember token found' };
      }

      const response = await fetch(`${API_BASE_URL}/api.php?action=auto_login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rememberToken: rememberToken
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update user data di localStorage
        const userData = {
          user_id: data.user.user_id,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          email: data.user.email,
          phoneNumber: data.user.phone_number,
          fullName: `${data.user.first_name} ${data.user.last_name}`,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('bartechUser', JSON.stringify(userData));

        return {
          success: true,
          user: userData
        };
      } else {
        // Token tidak valid, hapus dari localStorage
        localStorage.removeItem('bartechRememberToken');
        return {
          success: false,
          message: data.message
        };
      }
    } catch (error) {
      console.error('Auto login error:', error);
      return {
        success: false,
        message: 'Auto login failed'
      };
    }
  }

  // ===============================
  // UPDATE PROFILE USER
  // ===============================
  async updateProfile(userData) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const response = await fetch(`${API_BASE_URL}/api.php?action=update_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage dengan data baru
        const updatedUser = {
          ...currentUser,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          fullName: `${userData.firstName} ${userData.lastName}`
        };

        localStorage.setItem('bartechUser', JSON.stringify(updatedUser));

        return {
          success: true,
          message: data.message || 'Profile berhasil diupdate',
          user: updatedUser
        };
      } else {
        return {
          success: false,
          message: data.message || 'Gagal update profile'
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Koneksi ke server gagal'
      };
    }
  }

  // ===============================
  // VALIDASI EMAIL FORMAT
  // ===============================
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===============================
  // VALIDASI PASSWORD STRENGTH
  // ===============================
  validatePassword(password) {
    const validation = {
      isValid: true,
      errors: []
    };

    if (password.length < 6) {
      validation.isValid = false;
      validation.errors.push('Password minimal 6 karakter');
    }

    if (!/[A-Za-z]/.test(password)) {
      validation.isValid = false;
      validation.errors.push('Password harus mengandung huruf');
    }

    if (!/[0-9]/.test(password)) {
      validation.isValid = false;
      validation.errors.push('Password harus mengandung angka');
    }

    return validation;
  }

  // ===============================
  // HELPER: FORMAT ERROR MESSAGE
  // ===============================
  formatErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Terjadi kesalahan yang tidak diketahui';
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;

// Export individual methods untuk flexibility
export const {
  register,
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  autoLogin,
  updateProfile,
  validateEmail,
  validatePassword
} = authService;