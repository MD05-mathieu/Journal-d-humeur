/**
 * AuthContext — Contexte global d'authentification.
 * Stockage du token JWT exclusivement dans expo-secure-store (jamais dans AsyncStorage).
 * Fournit les actions d'authentification et l'état réactif à l'ensemble des composants.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient, { TOKEN_KEY, USERNAME_KEY, setOnUnauthorized } from '../api/axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);

  /**
   * Action de déconnexion sécurisée : purge du trousseau expo-secure-store
   */
  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USERNAME_KEY);
    } catch (error) {
      console.error('Erreur lors de la déconnexion dans SecureStore:', error);
    } finally {
      setIsAuthenticated(false);
      setUsername(null);
    }
  }, []);

  /**
   * Au montage, vérification de l'existence d'un token persistant
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUsername = await SecureStore.getItemAsync(USERNAME_KEY);

        if (storedToken) {
          setIsAuthenticated(true);
          setUsername(storedUsername || 'Utilisateur');
        } else {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } catch (error) {
        console.error('Erreur initialisation AuthContext:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Liaison du callback 401 pour déconnexion automatique
    setOnUnauthorized(logout);
    initializeAuth();
  }, [logout]);

  /**
   * Connexion utilisateur
   */
  const login = async (data: LoginRequest): Promise<void> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    const { token, username: returnedUsername } = response.data;

    // Enregistrement sécurisé
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USERNAME_KEY, returnedUsername);

    setUsername(returnedUsername);
    setIsAuthenticated(true);
  };

  /**
   * Inscription d'un nouvel utilisateur
   */
  const register = async (data: RegisterRequest): Promise<void> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    const { token, username: returnedUsername } = response.data;

    // Enregistrement sécurisé
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USERNAME_KEY, returnedUsername);

    setUsername(returnedUsername);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        username,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
