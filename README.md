# 🔗 Perfect Links API - PostgreSQL Edition

> API backend professionnelle pour l'analyse de maillage interne de sites web, avec gestion d'utilisateurs, authentification JWT et système de quotas.

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 Fonctionnalités principales

### 🔐 Authentification & Sécurité
- ✅ Inscription avec validation par email
- ✅ Connexion sécurisée (JWT + refresh tokens)
- ✅ Sessions en base de données
- ✅ Bcrypt avec 12 rounds de hashing
- ✅ Tokens avec expiration automatique

### 📊 Gestion de quotas intelligente
- ✅ Plans : Free (100), Premium (500), Pro (1000) requêtes/mois
- ✅ Réinitialisation automatique tous les 30 jours
- ✅ Vérification en temps réel
- ✅ Historique détaillé de l'utilisation

### 🔍 Analyse de sites web
- ✅ Parsing de sitemap.xml
- ✅ Crawl des liens internes avec statut HTTP
- ✅ Détection des liens orphelins (sans maillage interne)
- ✅ Identification des liens externes et de conversion
- ✅ Vérification des redirections (301, 302)
- ✅ Détection des erreurs 404
- ✅ Analyse du texte d'ancre

### 📈 Monitoring & Logs
- ✅ Logs détaillés de chaque requête
- ✅ Statistiques par utilisateur
- ✅ Durée d'exécution des analyses
- ✅ Tracking des sites analysés

---

## 🚀 Installation rapide

### Prérequis
- Node.js 14+
- PostgreSQL 12+
- npm ou yarn

### Étapes d'installation

```bash
# 1. Cloner le repository
git clone https://github.com/artkabis/perfectlinks-v2.git
cd perfectlinks-v2

# 2. Installer les dépendances
npm install

# 3. Configurer PostgreSQL
sudo -u postgres psql
```

```sql
CREATE DATABASE perfectlinks_db;
CREATE USER perfectlinks_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE perfectlinks_db TO perfectlinks_user;
\q
```

```bash
# 4. Configurer les variables d'environnement
cp .env.example .env
nano .env  # Éditer avec vos valeurs

# 5. Exécuter le schéma SQL
npm run db:setup

# 6. Démarrer le serveur
npm start
```

---

## 📦 Migration depuis l'ancien système JSON

Si vous migrez depuis un système JSON crypté existant :

```bash
# 1. Vérifier l'état actuel
npm run migrate:check

# 2. Sauvegarder votre fichier JSON
cp $USERS_PATH_ENCRYPT $USERS_PATH_ENCRYPT.backup

# 3. Lancer la migration
npm run migrate

# 4. Vérifier la migration
npm run migrate:check
```

Voir [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) pour les détails complets.

---

## 🌐 API Endpoints

### Authentification

#### `POST /api/register`
Inscription d'un nouvel utilisateur

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to validate your account.",
  "user": {
    "userId": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "plan": "free",
    "status": "pending"
  }
}
```

#### `POST /api/login`
Connexion utilisateur

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "1h",
  "tokenType": "Bearer",
  "user": {
    "userId": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "plan": "free"
  }
}
```

#### `GET /api/validate-account?token=xxx&userid=xxx`
Validation du compte par email

#### `POST /api/refresh-token`
Rafraîchir le token d'accès

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### `POST /api/logout`
Déconnexion (requiert authentification)

#### `GET /api/me`
Obtenir les informations de l'utilisateur connecté

### Analyse de sites

#### `GET /api/sitemap-analysis?url=sitemap_url`
**Authentification requise** (Bearer Token)

Analyse complète d'un sitemap avec crawl de toutes les pages.

**Headers requis :**
```
Authorization: Bearer {token}
```

**Response :**
```json
[{
  "datas": {
    "links": ["url1", "url2"],
    "internalLinks": [
      {
        "link": "url1",
        "statusCode": 200,
        "internalLinks": [
          {
            "url": "target_url",
            "anchor": "Texte du lien",
            "status": 200,
            "redirectUrl": null
          }
        ]
      }
    ],
    "missingLinks": ["orphan_url1"]
  },
  "meta": {
    "totalUrls": 100,
    "totalInternalLinks": 250,
    "orphanLinks": 5,
    "duration": "15234ms"
  }
}]
```

#### `GET /api/analysis-history`
Obtenir l'historique des analyses

#### `GET /api/analysis-stats`
Obtenir les statistiques d'analyse

---

## 🗄️ Architecture de la base de données

### Tables principales

- **users** : Utilisateurs et informations de compte
- **user_sessions** : Tokens JWT actifs
- **user_usage** : Quotas et utilisation
- **usage_logs** : Historique détaillé

Voir [database/schema.sql](./database/schema.sql) pour le schéma complet.

---

## 🔧 Scripts disponibles

```bash
npm start                # Démarrer le serveur
npm run dev              # Mode développement avec hot-reload
npm run migrate          # Migrer les users JSON → PostgreSQL
npm run migrate:check    # Vérifier l'état de la BDD
npm run db:setup         # Créer les tables
npm run db:reset         # Réinitialiser la BDD (⚠️ efface tout)
npm test                 # Lancer les tests
npm run lint             # Vérifier le code
npm run lint:fix         # Corriger automatiquement
npm run format           # Formater le code avec Prettier
```

---

## ⚙️ Configuration (.env)

```env
# Environment
NODE_ENV=development
PORT=9090

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perfectlinks_db
DB_USER=perfectlinks_user
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_REFRESH_SECRET=votre_secret_refresh_token
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Plans
FREE_PLAN=100
PREMIUM_PLAN=500
PRO_PLAN=1000

# Email
MAILSENDER_USERNAME=noreply@perfectlinks.fr
MAILSENDER_HOST=smtp.votre-serveur.com
MAILSENDER_PORT=587
MAILSENDER_PASSWORD=mot_de_passe_smtp
MAILSENDER_FROM=Perfect Links <noreply@perfectlinks.fr>
```

---

## 🚢 Déploiement en production

### Avec PM2

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
pm2 start server.js --name "perfectlinks-api"

# Sauvegarder la config
pm2 save

# Auto-start au boot
pm2 startup
```

### Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name perfectlinksapi.artkabis.fr;

    location / {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Performance

| Opération | Avant (JSON) | Après (PostgreSQL) | Gain |
|-----------|--------------|-------------------|------|
| Inscription | ~200ms | ~20ms | **10x** |
| Login | ~150ms | ~15ms | **10x** |
| Validation compte | ~180ms | ~10ms | **18x** |
| Décrément quota | ~160ms | ~2ms | **80x** |

---

## 🔒 Sécurité

- ✅ JWT avec signature sécurisée
- ✅ Refresh tokens HttpOnly
- ✅ Bcrypt avec 12 rounds
- ✅ Helmet.js pour headers sécurité
- ✅ CORS configuré par environnement
- ✅ Requêtes paramétrées (anti SQL injection)
- ✅ Validation des entrées utilisateur (Joi)
- ✅ Rate limiting global et par endpoint
- ✅ Logs de sécurité détaillés

---

## 📁 Structure du projet

```
perfectlinks-v2/
├── config/
│   └── database.js          # Configuration PostgreSQL
├── database/
│   └── schema.sql           # Schéma de la base de données
├── scripts/
│   ├── setup-database.js    # Installation BDD
│   ├── reset-database.js    # Reset BDD
│   ├── check-migration.js   # Vérification
│   └── migrate-json-to-postgres.js  # Migration
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── analysisController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── quota.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Usage.js
│   │   └── UsageLog.js
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   └── sitemapService.js
│   └── utils/
│       ├── logger.js
│       └── scheduler.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## 📚 Documentation

- [📖 Guide de migration](./docs/MIGRATION_GUIDE.md) - Migration depuis JSON
- [🔄 Guide de transition](./docs/TRANSITION_GUIDE.md) - Correspondance des fonctions
- [📘 Schéma de base](./database/schema.sql) - Structure PostgreSQL

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Changelog

### Version 2.0.0 (PostgreSQL Edition) - 2024
- ✅ Migration complète vers PostgreSQL
- ✅ Système de sessions en base
- ✅ Refresh tokens automatiques
- ✅ Logs détaillés de l'utilisation
- ✅ Performances x10-100 améliorées
- ✅ Réinitialisation automatique des quotas
- ✅ Architecture modulaire et maintenable
- ✅ Tests unitaires et d'intégration
- ✅ Documentation complète

---

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour les détails.

---

## 👤 Auteur

**Artkabis** - Web Developer & SEO Specialist

- 🌐 Site : [perfectlinks.artkabis.fr](https://perfectlinks.artkabis.fr)
- 📧 Email : contact@artkabis.fr

---

## 🙏 Remerciements

- Express.js pour le framework
- PostgreSQL pour la robustesse
- Cheerio pour le parsing HTML
- Nodemailer pour l'envoi d'emails
- La communauté open-source

---

## 📞 Support

- 📖 [Documentation complète](./docs/)
- 🐛 [Signaler un bug](https://github.com/artkabis/perfectlinks-v2/issues)
- 💬 [Discussions](https://github.com/artkabis/perfectlinks-v2/discussions)

---

**Made with ❤️ by Artkabis**
