/**
 * Point d'entrée de l'application Wellness Journal.
 * Encapsule l'application dans le AuthProvider pour la gestion réactive de l'état d'authentification.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}
