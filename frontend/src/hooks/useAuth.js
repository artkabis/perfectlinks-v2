import { create } from 'zustand';
import authService from '@/services/auth';
import toast from 'react-hot-toast';

/**
 * Authentication store using Zustand
 */
export const useAuthStore = create((set, get) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,

  // Login
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.login(email, password);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Connexion réussie !');
      return data;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true });
    try {
      const data = await authService.register(userData);
      set({ isLoading: false });
      toast.success('Inscription réussie ! Vérifiez votre email.');
      return data;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Erreur d'inscription";
      toast.error(message);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
      });
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Refresh user data
  refreshUser: async () => {
    try {
      const data = await authService.getCurrentUser();
      set({ user: data.user });
      return data;
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  },

  // Update user in state
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
