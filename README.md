# 🌿 MonApp — Journal de Bien-Être & Suivi d'Humeur Quotidien

Bienvenue dans le monorepo de **MonApp (Journal de Bien-Être)**, une solution mobile et backend moderne permettant aux utilisateurs de tenir un journal émotionnel au quotidien et de visualiser l'évolution de leur bien-être sur une vue glissante de 7 jours.

---

## 🏗️ 1. Architecture Globale

Le projet est conçu selon une architecture découplée **Monorepo** :

```
┌───────────────────────────────────────────────┐
│              Application Mobile               │
│         React Native (Expo + TypeScript)      │
│  - Navigation (Stack + Bottom Tabs)           │
│  - Auth JWT stocké dans expo-secure-store     │
│  - Graphique SVG hebdomadaire (react-native-svg)│
└───────────────────────┬───────────────────────┘
                        │
                        │ Requêtes HTTPS / HTTP REST
                        │ En-tête : Authorization: Bearer <JWT>
                        ▼
┌───────────────────────────────────────────────┐
│                 Backend API                   │
│          ASP.NET Core Web API (.NET 8)        │
│  - Contrôleurs Auth (BCrypt) & Moods [Authorize]│
│  - Token JWT signé HMAC-SHA256                │
│  - Filtre LINQ UserId extrait des Claims      │
└───────────────────────┬───────────────────────┘
                        │
                        │ Entity Framework Core
                        │ Requêtes SQL Server paramétrées
                        ▼
┌───────────────────────────────────────────────┐
│             Base de Données                   │
│               SQL Server                      │
│  - Tables: Users, MoodEntries                 │
│  - Index unique (UserId, EntryDateUtc)        │
└───────────────────────────────────────────────┘
```

---

## 📁 2. Structure Complète du Monorepo

```text
D:\perso\MonApp\
│
├── .gitignore                             # Règles Git racine (secrets, build, IDE)
├── README.md                              # Ce fichier (Guide d'installation et architecture)
├── SECURITY.md                            # Politique et bonnes pratiques de sécurité
│
├── backend/                               # API REST C# ASP.NET Core
│   ├── .gitignore                         # Ignore bin/, obj/, appsettings.*.json
│   ├── README.md                          # Guide détaillé Backend & Migrations EF Core
│   └── WellnessJournal.API/
│       ├── WellnessJournal.API.csproj     # Fichier projet .NET 8 & packages NuGet
│       ├── Program.cs                     # Point d'entrée, injection des dépendances, JWT, CORS
│       ├── appsettings.json               # Config publique (sans aucun secret)
│       ├── appsettings.Example.json       # Modèle de configuration avec placeholders
│       ├── Controllers/
│       │   ├── AuthController.cs          # Inscription & Connexion avec tokens JWT
│       │   └── MoodsController.cs         # CRUD humeur & agrégation hebdomadaire 7 jours
│       ├── Data/
│       │   └── AppDbContext.cs            # Contexte EF Core, relations et index uniques
│       ├── Models/
│       │   ├── User.cs                    # Entité utilisateur (BCrypt hash)
│       │   ├── MoodEntry.cs               # Entité humeur quotidienne (Score 1-5, Tags, Date)
│       │   └── DTOs/
│       │       ├── AuthDtos.cs            # RegisterRequest, LoginRequest, AuthResponse
│       │       └── MoodDtos.cs            # MoodEntryRequest, WeeklySummaryResponse, etc.
│       └── Services/
│           ├── IJwtService.cs             # Interface du service de token
│           └── JwtService.cs              # Implémentation JWT Bearer HMAC-SHA256
│
└── mobile/                                # Application Mobile React Native / Expo
    ├── .gitignore                         # Ignore node_modules/, .expo/, .env
    ├── .env.example                       # Exemple de variable API_URL
    ├── package.json                       # Dépendances NPM (Expo SDK 58, Navigation, SVG, Axios)
    ├── tsconfig.json                      # Configuration TypeScript
    ├── babel.config.js                    # Configuration Babel avec plugin module:react-native-dotenv
    ├── app.json                           # Configuration Expo Application
    ├── env.d.ts                           # Déclaration TypeScript pour @env
    ├── App.tsx                            # Composant racine avec AuthProvider et StatusBar
    ├── README.md                          # Guide détaillé Mobile & Expo Go
    └── src/
        ├── api/
        │   └── axios.ts                   # Instance Axios, intercepteurs JWT & redirection 401
        ├── context/
        │   └── AuthContext.tsx            # Contexte d'authentification et SecureStore
        ├── navigation/
        │   └── AppNavigator.tsx           # Stack Navigator (Auth) & Bottom Tab Navigator
        ├── types/
        │   └── index.ts                   # Interfaces TypeScript partagées
        ├── screens/
        │   ├── LoginScreen.tsx            # Écran de connexion
        │   ├── RegisterScreen.tsx         # Écran d'inscription
        │   ├── HomeScreen.tsx             # Saisie quotidienne d'humeur & tags
        │   └── StatsScreen.tsx            # Statistiques hebdomadaires & historique
        └── components/
            └── WeeklyChart.tsx            # Composant graphique SVG interactif (7 jours)
```

---

## ⚙️ 3. Prérequis Système

Avant de commencer, assurez-vous d'avoir installé sur votre machine :
1. **.NET 8 SDK** (version 8.0 ou supérieure) : `dotnet --version`
2. **Node.js** (version 18.x ou 20.x LTS) & **npm** : `node -v` et `npm -v`
3. **SQL Server** (LocalDB, Express ou Developer Edition) ou conteneur Docker SQL Server
4. **Application Expo Go** installée sur votre smartphone Android (Google Play) ou iOS (App Store)

---

## 🚀 4. Guide Pas-à-Pas de Lancement

### Étape A : Configuration et Démarrage du Backend

1. **Ouvrez un terminal** dans le dossier de l'API :
   ```bash
   cd D:\perso\MonApp\backend\WellnessJournal.API
   ```

2. **Initialisez les secrets locaux (.NET User Secrets)** (évite d'écrire des mots de passe dans les fichiers du projet) :
   ```bash
   dotnet user-secrets init

   # Configurer la chaîne de connexion SQL Server :
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=WellnessJournalDb;Trusted_Connection=True;TrustServerCertificate=True"

   # Configurer la clé secrète JWT (minimum 256 bits / 32 caractères aléatoires) :
   dotnet user-secrets set "JwtSettings:SecretKey" "Cle_Secrete_Ultra_Securisee_Pour_Le_Journal_De_Bien_Etre_2026_Min256Bits!"
   ```

3. **Exécutez les migrations Entity Framework Core** pour créer la base de données :
   ```bash
   dotnet tool install --global dotnet-ef   # si pas déjà installé
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

4. **Lancez l'API en écoute sur toutes les interfaces réseau (0.0.0.0)** pour permettre à votre smartphone d'y accéder :
   ```bash
   dotnet run --urls "http://0.0.0.0:5000"
   ```
   > 💡 *Vérification :* Ouvrez votre navigateur sur `http://localhost:5000/swagger` pour explorer la documentation interactive Swagger UI.

---

### Étape B : Configuration du Réseau & Détection Automatique d'IP

> ⚡ **Nouveauté : Détection Automatique avec Expo Go !**
> L'application mobile intègre désormais la détection automatique de l'IP de votre machine hôte en mode développement (`expo-constants`). Vous n'avez plus besoin de modifier l'adresse IP à chaque changement de réseau Wi-Fi !

Si vous utilisez un émulateur ou si vous souhaitez forcer une URL personnalisée (tunnel, IP fixe) :
1. Créez votre fichier `.env` à partir de `.env.example` :
   ```bash
   cd D:\perso\MonApp\mobile
   copy .env.example .env
   ```
2. Renseignez l'URL souhaitée dans `mobile/.env` :
   ```env
   API_URL=http://<VOTRE_IP_LOCALE>:5000/api
   ```

---

### Étape C : Lancement de l'Application Mobile (Expo)

1. Dans le dossier `D:\perso\MonApp\mobile` :
   ```bash
   npm install
   ```
2. Démarrez le serveur de développement Expo :
   ```bash
   npx expo start
   ```
3. Un QR Code s'affiche dans votre terminal :
   - Sur **Android** : Ouvrez l'application **Expo Go** et scannez le QR Code.
   - Sur **iOS** : Ouvrez l'appareil photo natif et touchez la notification pour ouvrir dans **Expo Go**.

---

## 🔒 5. Résumé des Mesures de Sécurité Appliquées

* **Aucun secret dans Git :** Fichiers `.gitignore` stricts à la racine et dans les sous-dossiers.
* **Hachage BCrypt :** Salage automatique et hachage adaptatif (facteur de travail 12) des mots de passe.
* **Tokens JWT & Permissions :** Validation stricte de signature, durée de vie, émetteur et destinataire.
* **Contrôle d'accès strict :** Toutes les routes de données utilisent `[Authorize]`. Le `UserId` est systématiquement extrait des claims cryptographiques du token, rendant impossible l'usurpation des données d'un autre utilisateur.
* **Stockage Sécurisé Mobile :** Utilisation exclusive de `expo-secure-store` pour stocker le token dans le Keychain (iOS) ou le KeyStore chiffré (Android).
* **Intercepteur Réseau :** Déconnexion immédiate et purge du trousseau local en cas de code HTTP `401 Unauthorized`.

Pour des informations détaillées, consultez [SECURITY.md](file:///D:/perso/MonApp/SECURITY.md).
