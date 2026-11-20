/**
 * Configuration Axios avec intercepteurs pour l'authentification JWT.
 * - Injection automatique de l'en-tête Authorization: Bearer <token>
 * - Interception des erreurs 401 Unauthorized avec purge du SecureStore et redirection login
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '@env';

export const TOKEN_KEY = 'wellness_jwt_token';
export const USERNAME_KEY = 'wellness_username';

/**
 * Détermination dynamique de l'URL de base du backend API :
 * 1. En développement avec Expo Go (__DEV__) : détection automatique de l'IP
 *    de l'ordinateur via Constants.expoConfig?.hostUri (aucune modification de .env nécessaire).
 * 2. Si non disponible, utilise la variable API_URL du fichier .env.
 * 3. Fallback selon la plateforme (10.0.2.2 sur émulateur Android, localhost ailleurs).
 */
const getBackendBaseUrl = (): string => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip) {
        return `http://${ip}:5000/api`;
      }
    }
  }

  if (API_URL && !API_URL.includes('<') && !API_URL.includes('VOTRE_ADRESSE_IP')) {
    return API_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

// Création de l'instance Axios
const apiClient = axios.create({
  baseURL: getBackendBaseUrl(),
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
