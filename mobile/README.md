# 📱 Wellness Journal Mobile — React Native (Expo)

Application mobile native développée avec **React Native (Expo)**, **TypeScript**, **React Navigation**, **Axios**, **expo-secure-store**, et **react-native-svg**.

---

## 🚀 1. Guide de Démarrage Rapide avec Expo Go

### Prérequis
1. **Node.js** 18+ ou 20+ installé sur votre machine (`node -v`).
2. L'application **Expo Go** installée sur votre smartphone :
   - [Expo Go pour Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Expo Go pour iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

---

### Installation des Dépendances
Dans le répertoire `mobile/` :
```bash
cd D:\perso\MonApp\mobile
npm install
```

---

## 🌐 2. Configuration Réseau & Détection Automatique d'IP

L'application intègre désormais la **détection automatique de l'adresse IP** de votre ordinateur via `expo-constants` en mode développement (`__DEV__`). 
Lorsque vous lancez l'application avec **Expo Go**, l'application extrait automatiquement l'adresse IP de votre machine sans que vous ayez besoin de modifier manuellement le fichier `.env` à chaque changement de réseau Wi-Fi !

Si vous souhaitez forcer une URL spécifique (ex: tunnel Ngrok ou serveur distant) :
1. **Copiez le fichier d'exemple :**
   ```bash
   copy .env.example .env
   ```
2. **Éditez le fichier `.env` :**
   ```env
   API_URL=http://192.168.1.52:5000/api
   ```

   > 📱 **Cas particulier Émulateur Android Studio :**
   > L'émulateur officiel Android a un alias dédié pour joindre la machine hôte : `http://10.0.2.2:5000/api`.
   >
   > 🍎 **Cas particulier Simulateur iOS (Mac) :**
   > Le simulateur iOS partage le réseau hôte : `http://localhost:5000/api`.

---

### Lancement de l'Application

```bash
npx expo start
```

* **Sur Android :** Ouvrez Expo Go, touchez "Scan QR Code", puis scannez le QR code affiché dans le terminal.
* **Sur iOS :** Ouvrez l'application "Appareil photo", visez le QR code et touchez la bannière "Ouvrir dans Expo Go".

---

## 🧩 3. Description des Composants & Architecture

### `src/api/axios.ts`
* Instance préconfigurée d'Axios pointant sur `API_URL`.
* **Intercepteur de Requête :** Lit de façon asynchrone le token JWT dans `expo-secure-store` et injecte automatiquement l'en-tête `Authorization: Bearer <token>`.
* **Intercepteur de Réponse :** Intercepte les erreurs HTTP `401 Unauthorized`. Si le token est expiré ou révoqué, il purge le stockage sécurisé et déclenche le callback de déconnexion pour rediriger immédiatement vers l'écran de connexion.

### `src/context/AuthContext.tsx`
* Gestionnaire d'état React global pour l'authentification.
* Expose `isAuthenticated`, `username`, `login()`, `register()`, et `logout()`.
* **Stockage exclusif dans `expo-secure-store`** : Aucun jeton d'accès n'est jamais placé dans `AsyncStorage` non chiffré.

### `src/navigation/AppNavigator.tsx`
* Orchestrateur de navigation conditionnelle :
  * Si déconnecté : Affiche la pile **Stack** avec `LoginScreen` et `RegisterScreen`.
  * Si connecté : Affiche le **Bottom Tab Navigator** avec les onglets *Humeur* (`HomeScreen`) et *Statistiques* (`StatsScreen`).

### `src/screens/HomeScreen.tsx`
* Formulaire d'enregistrement quotidien :
  * Sélecteur visuel interactif du score de 1 à 5 avec emojis colorés.
  * Multi-sélection de tags d'émotions (`Heureux`, `Calme`, `Anxieux`, etc.).
  * Zone de texte libre pour notes personnelles (1000 caractères max).
  * Détection automatique si une entrée existe déjà pour le jour même (mode mise à jour transparente).

### `src/components/WeeklyChart.tsx`
* Composant graphique 100% vectoriel propulsé par `react-native-svg`.
* Trace une courbe de tendance avec dégradé subtil sous la courbe.
* Affiche les 7 jours de la période glissante (Lun, Mar, etc.) et le badge du score moyen pondéré.
* Tolérance aux jours sans saisie : affiche les points vides avec un tracé en pointillés élégant.

### `src/screens/StatsScreen.tsx`
* Vue analytique globale :
  * Intégration du composant graphique hebdomadaire.
  * Cartes de synthèse (Total entrées sur 7 jours, humeur dominante, score moyen).
  * Classement des émotions les plus récurrentes avec barres proportionnelles animées.
  * Historique chronologique inverse des entrées récentes de la semaine.
  * Support du geste *Pull-to-Refresh*.

---

## ⚠️ 4. Résolution des Problèmes Courants

| Problème | Cause Probable | Solution |
| :--- | :--- | :--- |
| **`Network request failed`** | Le smartphone ne parvient pas à joindre le backend. | 1. Vérifiez que votre PC et votre smartphone sont sur le **même réseau Wi-Fi**.<br>2. Vérifiez que votre backend écoute bien sur `0.0.0.0` (`dotnet run --urls "http://0.0.0.0:5000"`).<br>3. Vérifiez le pare-feu Windows : autorisez le port entrant 5000 en TCP. |
| **Erreur de chargement de `@env`** | Le cache Babel n'a pas pris en compte la création ou modification de `.env`. | Relancez le serveur Expo en vidant le cache : `npx expo start -c`. |
| **`SecureStore unavailable on web`** | Vous tentez d'exécuter l'application dans le navigateur (`npm run web`). | `expo-secure-store` requiert un environnement natif (iOS ou Android). Utilisez Expo Go sur mobile ou émulateur. |
