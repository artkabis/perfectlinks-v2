import api from './api';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Authentication service
 */
const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    const response = await api.post('/register', userData);
    return response.data;
  },

  /**
   * Login user
   */
  async login(email, password) {
    const response = await api.post('/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user info
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await api.get('/me');

    // Update stored user info
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));

    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/change-password', {
      password: currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Get stored user
   */
  getStoredUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Get access token
   */
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
};

export default authService;
