# 🔒 Politique de Sécurité — MonApp (Journal de Bien-Être)

Ce document récapitule l'ensemble des principes architecturaux et des mesures de sécurité mis en œuvre dans le projet **MonApp** pour protéger les données sensibles et la vie privée des utilisateurs.

---

## 1. Gestion des Secrets & Configuration Git (Principe "Zero Secret in Code")

### Règles appliquées
* **Aucun secret dans le code source :** Aucune chaîne de connexion SQL, mot de passe de base de données ou clé secrète JWT n'est présente dans les fichiers de code C# ou TypeScript.
* **Fichiers modèles sécurisés :**
  * `backend/WellnessJournal.API/appsettings.json` : Contient uniquement les options non sensibles.
  * `backend/WellnessJournal.API/appsettings.Example.json` : Fournit un template documentaire avec des marqueurs fictifs (`<VOTRE_CHAINE_DE_CONNEXION_SQL>`, `<VOTRE_CLE_SECRETE_JWT_256_BITS>`).
  * `mobile/.env.example` : Fournit le format de la variable d'environnement sans données réelles.
* **Fichiers `.gitignore` stricts :**
  Tous les fichiers porteurs de configurations privées sont exclus du versionnement :
  * `.env`, `.env.local`, `.env.*.local`
  * `appsettings.Development.json`, `appsettings.Production.json`
  * Dossiers de compilation (`bin/`, `obj/`, `node_modules/`, `.expo/`)
  * Dossiers de configuration d'IDE (`.vs/`, `.vscode/`, `.idea/`)

### Développement local via `.NET User Secrets`
En développement, les secrets ne sont pas stockés dans le dossier du projet, mais dans le magasin sécurisé de l'utilisateur du système d'exploitation (`%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\` sous Windows) :
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..."
dotnet user-secrets set "JwtSettings:SecretKey" "..."
```

---

## 2. Authentification & Cycle de Vie des Tokens JWT

### Signature & Algorithme
* Le backend utilise l'algorithme standard **HMAC-SHA256** (`SecurityAlgorithms.HmacSha256`).
* La clé secrète doit être d'une longueur minimale de 256 bits (32 caractères cryptographiquement aléatoires).
* En cas de clé absente ou non configurée, l'API refuse de démarrer (`InvalidOperationException`).

### Paramètres de validation (`TokenValidationParameters`)
Le middleware ASP.NET Core `JwtBearer` valide rigoureusement :
* **Signature de la clé :** `ValidateIssuerSigningKey = true`
* **Émetteur (Issuer) :** `ValidateIssuer = true`
* **Destinataire (Audience) :** `ValidateAudience = true`
* **Durée de vie (Lifetime) :** `ValidateLifetime = true`
* **Tolérance temporelle nulle :** `ClockSkew = TimeSpan.Zero` (empêche l'utilisation d'un token après la seconde exacte de son expiration).

---

## 3. Stockage Sécurisé Côté Mobile (`expo-secure-store`)

### Danger d'`AsyncStorage`
L'utilisation de `@react-native-async-storage/async-storage` pour des tokens d'authentification expose l'utilisateur à des attaques par lecture directe du stockage applicatif non chiffré (en particulier sur les appareils rootés/jailbreakés ou via des sauvegardes de terminal).

### Solution adoptée : `expo-secure-store`
Le token JWT est stocké exclusivement via la bibliothèque native **`expo-secure-store`** :
* **Sur iOS :** Chiffrement matériel via le **Keychain** Apple.
* **Sur Android :** Chiffrement via le système **Android KeyStore** et `SharedPreferences` chiffrées (`EncryptedSharedPreferences`).

---

## 4. Hachage des Mots de Passe Utilisateurs

* Les mots de passe en clair ne sont jamais enregistrés en base de données ni loggués.
* Le hachage est confié à la bibliothèque reconnue **`BCrypt.Net-Next`** :
  ```csharp
  user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);
  ```
* **Salage automatique :** Chaque mot de passe bénéficie d'un sel cryptographique unique généré à chaque appel.
* **Facteur de coût (Work Factor) à 12 :** Ralentit drastiquement toute tentative d'attaque par force brute ou tables arc-en-ciel.

---

## 5. Contrôle d'Accès & Isolation des Données (`[Authorize]`)

* Toutes les opérations de lecture et d'écriture du contrôleur `MoodsController` sont protégées par l'attribut `[Authorize]`.
* **Extraction vérifiée du `UserId` :** L'identifiant de l'utilisateur n'est **jamais** passé dans le corps de la requête ou dans l'URL. Il est extrait directement depuis les **Claims** signés et vérifiés du jeton JWT :
  ```csharp
  var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
  ```
* **Requêtes LINQ isolées :** Toutes les requêtes Entity Framework Core filtrent explicitement par `m.UserId == userId`. Il est strictement impossible pour un utilisateur A de consulter, modifier ou supprimer les humeurs d'un utilisateur B.

---

## 6. Intercepteur Réseau & Révocation de Session

L'intercepteur Axios dans `src/api/axios.ts` assure :
1. **L'injection automatique du jeton Bearer** sur chaque requête sortante.
2. **La réaction immédiate au code HTTP 401 Unauthorized** :
   * Suppression immédiate du token dans `expo-secure-store`.
   * Réinitialisation de l'état réactif d'authentification (`AuthContext`).
   * Redirection automatique et instantanée de l'utilisateur vers l'écran `LoginScreen`.

---

## 7. Validation des Entrées (Input Validation)

### Côté Backend (Data Annotations)
* Validation stricte des modèles via `[Required]`, `[EmailAddress]`, `[MinLength(8)]`, `[Range(1, 5)]`, et `[MaxLength]`.
* Les données non conformes sont rejetées avec un statut HTTP `400 Bad Request` avant d'atteindre la couche logique ou la base de données.

### Côté Mobile
* Contrôle préventif des champs vides, vérification de confirmation du mot de passe et seuils minimaux de longueur avant l'envoi de toute requête réseau.

---

## 8. Bonnes Pratiques pour le Déploiement en Production

1. **Activation impérative de HTTPS :** Déployer l'API derrière un reverse proxy (Nginx, Caddy, Azure App Service) avec certificat TLS/SSL valide.
2. **CORS Restrictif :** En production, restreindre la politique CORS de `AllowAnyOrigin()` à l'origine ou au domaine officiel de votre application.
3. **Variables d'environnement d'orchestration :** Dans un environnement cloud (Azure, AWS, Docker), injecter les chaînes de connexion et clés JWT via les gestionnaires de secrets gérés (Azure Key Vault, AWS Secrets Manager, GitHub Actions Secrets).
4. **Rate Limiting :** Mettre en place un middleware de limitation de débit (ex: `AspNetCoreRateLimit`) sur les routes `/api/auth/login` et `/api/auth/register` pour prévenir les attaques par déni de service (DoS) et force brute.
5. **Rotation des clés :** Prévoir une procédure périodique de rotation de la clé secrète JWT.
