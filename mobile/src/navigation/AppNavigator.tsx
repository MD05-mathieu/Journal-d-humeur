/**
 * AppNavigator — Architecture de Navigation globale
 * - Conditionnée par l'état `isAuthenticated` issu de AuthContext
 * - Stack Navigator : Login & Register (Flux déconnecté)
 * - Bottom Tab Navigator : Accueil & Statistiques (Flux authentifié)
 */
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Navigation par onglets inférieurs pour l'espace connecté
 */
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6C63FF',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
        headerTintColor: '#FFFFFF',
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#9DA0B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEF0F8',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Journal d\'Humeur',
          tabBarLabel: 'Humeur',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBadge, focused && styles.tabIconBadgeActive]}>
              <Text style={styles.tabIconEmoji}>🌱</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Statistiques Hebdomadaires',
          tabBarLabel: 'Statistiques',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBadge, focused && styles.tabIconBadgeActive]}>
              <Text style={styles.tabIconEmoji}>📈</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Navigateur racine avec commutation dynamique auth / app
 */
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Initialisation de la session...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#71718A',
    fontWeight: '600',
  },
  tabIconBadge: {
    padding: 3,
    borderRadius: 8,
  },
  tabIconBadgeActive: {
    backgroundColor: '#EEECFF',
  },
  tabIconEmoji: {
    fontSize: 20,
  },
});

export default AppNavigator;
