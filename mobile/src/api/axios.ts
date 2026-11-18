/**
 * Configuration Axios avec intercepteurs pour l'authentification JWT.
 * - Injection automatique de l'en-tête Authorization: Bearer <token>
 * - Interception des erreurs 401 Unauthorized avec purge du SecureStore et redirection login
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@env';

export const TOKEN_KEY = 'wellness_jwt_token';
export const USERNAME_KEY = 'wellness_username';

// Création de l'instance Axios
const apiClient = axios.create({
  baseURL: API_URL || 'http://10.0.2.2:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Intercepteur de requête sortante : injecte le token JWT depuis expo-secure-store
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[Axios Request Interceptor] Erreur récupération token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Gestion du callback de déconnexion globale (déclenché lors d'un 401)
 */
let unauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  unauthorizedCallback = callback;
};

/**
 * Intercepteur de réponse entrante : détection 401 Unauthorized
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[Axios Response Interceptor] 401 Unauthorized reçu. Purge du token.');
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USERNAME_KEY);
      } catch (e) {
        console.error('Erreur purge SecureStore:', e);
      }

      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
