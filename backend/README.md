# 🛠️ WellnessJournal.API — Backend ASP.NET Core (.NET 8)

API RESTful sécurisée développée en C# avec **ASP.NET Core 8**, **Entity Framework Core**, **SQL Server**, et authentification par **JSON Web Token (JWT Bearer)**.

---

## 📋 1. Spécification des Endpoints de l'API

L'ensemble des routes relatives aux données utilisateur nécessitent un en-tête HTTP :
`Authorization: Bearer <votre_token_jwt>`

### 🔐 Authentification (`/api/auth`)

#### `POST /api/auth/register`
Inscrit un nouvel utilisateur et génère un token JWT dès la création.
* **Accès :** Public
* **Corps de la requête (`application/json`) :**
  ```json
  {
    "username": "jean_dupont",
    "email": "jean.dupont@example.com",
    "password": "MotDePasseComplexe123!"
  }
  ```
* **Réponse réussie (`201 Created`) :**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "jean_dupont",
    "expiration": "2026-11-18T10:15:00Z"
  }
  ```
* **Erreurs possibles :**
  * `400 Bad Request` : Champs manquants ou mot de passe inférieur à 8 caractères.
  * `409 Conflict` : Email ou nom d'utilisateur déjà existant.

---

#### `POST /api/auth/login`
Authentifie un utilisateur existant via vérification du hash BCrypt.
* **Accès :** Public
* **Corps de la requête (`application/json`) :**
  ```json
  {
    "email": "jean.dupont@example.com",
    "password": "MotDePasseComplexe123!"
  }
  ```
* **Réponse réussie (`200 OK`) :**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "jean_dupont",
    "expiration": "2026-11-18T10:15:00Z"
  }
  ```
* **Erreurs possibles :**
  * `401 Unauthorized` : Email ou mot de passe incorrect.

---

### 🌿 Gestion de l'Humeur (`/api/moods`)

Toutes ces routes sont décorées avec `[Authorize]`.

#### `POST /api/moods`
Enregistre ou met à jour l'humeur du jour de l'utilisateur connecté (**Upsert** : si une entrée existe déjà pour la même date civile UTC, elle est modifiée).
* **Accès :** Authentifié (`Bearer Token`)
* **Corps de la requête (`application/json`) :**
  ```json
  {
    "score": 4,
    "emotionTags": ["Calme", "Reconnaissant", "Productif"],
    "note": "Très bonne séance de sport ce matin et journée de travail sereine.",
    "entryDateUtc": "2026-11-17T09:00:00Z"
  }
  ```
  *(Note : si `entryDateUtc` est omis, la date UTC courante est automatiquement utilisée)*.
* **Réponse réussie (`200 OK`) :**
  ```json
  {
    "id": 12,
    "score": 4,
    "emotionTags": ["Calme", "Reconnaissant", "Productif"],
    "note": "Très bonne séance de sport ce matin et journée de travail sereine.",
    "entryDateUtc": "2026-11-17T00:00:00Z",
    "createdAt": "2026-11-17T09:30:00Z",
    "updatedAt": "2026-11-17T09:30:00Z"
  }
  ```
* **Erreurs possibles :**
  * `400 Bad Request` : Score hors de l'intervalle [1, 5] ou note trop longue (> 1000 caractères).
  * `401 Unauthorized` : Token manquant, falsifié ou expiré.

---

#### `GET /api/moods/weekly`
Calcule et retourne les statistiques des **7 derniers jours glissants** (J-6 jusqu'à aujourd'hui inclus).
* **Accès :** Authentifié (`Bearer Token`)
* **Réponse réussie (`200 OK`) :**
  ```json
  {
    "entries": [
      {
        "id": 10,
        "score": 3,
        "emotionTags": ["Fatigué", "Calme"],
        "note": "Rentrée de week-end un peu chargée.",
        "entryDateUtc": "2026-11-15T00:00:00Z",
        "createdAt": "2026-11-15T18:00:00Z",
        "updatedAt": "2026-11-15T18:00:00Z"
      },
      {
        "id": 12,
        "score": 4,
        "emotionTags": ["Calme", "Reconnaissant", "Productif"],
        "note": "Très bonne séance de sport ce matin.",
        "entryDateUtc": "2026-11-17T00:00:00Z",
        "createdAt": "2026-11-17T09:30:00Z",
        "updatedAt": "2026-11-17T09:30:00Z"
      }
    ],
    "averageScore": 3.5,
    "topEmotions": [
      { "emotion": "Calme", "count": 2 },
      { "emotion": "Productif", "count": 1 },
      { "emotion": "Fatigué", "count": 1 }
    ],
    "totalEntries": 2,
    "periodStart": "2026-11-11T00:00:00Z",
    "periodEnd": "2026-11-17T00:00:00Z"
  }
  ```

---

## 🔒 2. Configuration Sécurisée via `.NET User Secrets`

Conformément aux règles de sécurité, **aucun secret n'est commité dans Git**. Les chaînes de connexion et les clés secrètes JWT doivent être gérées en local avec l'outil officiel `dotnet user-secrets`.

Placez-vous dans le dossier du projet API :
```bash
cd D:\perso\MonApp\backend\WellnessJournal.API
```

### Initialiser les secrets :
```bash
dotnet user-secrets init
```

### Définir la chaîne de connexion SQL Server :
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=WellnessJournalDb;Trusted_Connection=True;TrustServerCertificate=True"
```
*(Remplacez par vos identifiants si vous utilisez une instance SQL Server avec mot de passe, ex: `Server=127.0.0.1;Database=WellnessJournalDb;User Id=sa;Password=MonSuperPassword123!;TrustServerCertificate=True`)*.

### Définir la clé secrète JWT (256 bits minimum / 32 caractères) :
```bash
dotnet user-secrets set "JwtSettings:SecretKey" "UneCleDeChiffrementTresSecreteEtLonguePourHMACSHA256_Min256Bits!"
```

### Vérifier les secrets configurés localement :
```bash
dotnet user-secrets list
```

---

## 🗄️ 3. Migrations & Création de la Base de Données

Entity Framework Core gère le schéma relationnel avec index unique sur `(UserId, EntryDateUtc)` pour garantir l'intégrité de l'upsert quotidien.

1. Installez l'outil CLI dotnet-ef si ce n'est pas déjà fait :
   ```bash
   dotnet tool install --global dotnet-ef
   ```

2. Créez la migration initiale :
   ```bash
   dotnet ef migrations add InitialCreate
   ```

3. Appliquez la migration sur votre base SQL Server :
   ```bash
   dotnet ef database update
   ```

---

## 🚀 4. Lancement de l'API

Pour permettre aux appareils mobiles (smartphones connectés en Wi-Fi ou émulateurs) de joindre votre machine, lancez l'application en écoutant sur toutes les adresses IP (`0.0.0.0`) :

```bash
dotnet run --urls "http://0.0.0.0:5000"
```

### Accès à Swagger UI
Une fois lancé en mode développement, l'interface Swagger est disponible sur :
`http://localhost:5000/swagger`

Cliquez sur le bouton vert **Authorize** en haut à droite pour tester vos requêtes avec le token JWT obtenu via `/api/auth/login`.
