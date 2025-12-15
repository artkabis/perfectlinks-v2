# 🚀 Guide de démarrage - Perfect Links Frontend

Ce guide vous explique comment démarrer l'application complète (backend + frontend).

## 📋 Prérequis

- Node.js 16.x ou supérieur
- npm 8.x ou supérieur
- PostgreSQL 12+ (pour le backend)
- Base de données configurée (voir backend README)

## 🛠️ Installation

### 1. Backend

```bash
# Installer les dépendances du backend
npm install

# Configurer la base de données (si pas déjà fait)
npm run db:setup

# Vérifier que .env existe (copier depuis .env.local.example si besoin)
cp .env.local.example .env
```

### 2. Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Vérifier que .env existe
# (Déjà configuré avec VITE_API_URL=http://localhost:9090/api)
```

## 🚀 Démarrage en développement

### Option 1 : Deux terminaux séparés

**Terminal 1 - Backend:**
```bash
# Depuis la racine du projet
npm run dev
```
Le backend démarre sur `http://localhost:9090`

**Terminal 2 - Frontend:**
```bash
# Depuis la racine du projet
cd frontend
npm run dev
```
Le frontend démarre sur `http://localhost:5173`

### Option 2 : Script combiné (recommandé)

**Installation de concurrently (une seule fois):**
```bash
npm install --save-dev concurrently
```

**Ajout du script dans package.json (racine):**
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"cd frontend && npm run dev\""
  }
}
```

**Lancement:**
```bash
npm run dev:all
```

## 🌐 Accès à l'application

Une fois les deux serveurs démarrés :

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:9090/api
- **API Health:** http://localhost:9090/api/health

## 👤 Compte de test

Un compte de démo est disponible :

```
Email: demo@test.com
Mot de passe: Demo123!
```

## 📱 Fonctionnalités disponibles

### Authentification
- ✅ Inscription d'un nouveau compte
- ✅ Connexion / Déconnexion
- ✅ Gestion de session avec JWT
- ✅ Refresh token automatique

### Analyse de sitemap
- ✅ Détection automatique via robots.txt
- ✅ Analyse complète du sitemap.xml
- ✅ Barre de progression en temps réel
- ✅ Détection des pages orphelines
- ✅ Analyse des liens internes
- ✅ Détection des liens externes
- ✅ Détection des liens de conversion (tel:, mailto:, etc.)

### Interface
- ✅ Dashboard avec statistiques
- ✅ Système d'onglets pour les résultats
- ✅ Tableaux interactifs
- ✅ Statuts HTTP colorés
- ✅ Design responsive (mobile, tablet, desktop)
- ✅ Notifications toast
- ✅ Dark mode ready (Tailwind CSS)

## 🔧 Configuration

### Variables d'environnement Frontend

Fichier: `frontend/.env`

```bash
# URL de l'API backend
VITE_API_URL=http://localhost:9090/api
```

### Variables d'environnement Backend

Fichier: `.env` (racine du projet)

Les principales variables :

```bash
# Port du serveur
PORT=9090

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perfectlinks_db
DB_USER=perfectlinks_user
DB_PASSWORD=perfectlinks2024

# JWT
JWT_SECRET=local_dev_jwt_secret_key_not_for_production
JWT_REFRESH_SECRET=local_dev_refresh_secret_key_not_for_production

# CORS (autoriser le frontend)
CORS_ORIGIN=*
```

## 🏗️ Build pour la production

### Frontend

```bash
cd frontend
npm run build
```

Le build sera créé dans `frontend/dist/`

### Servir le frontend depuis Express (optionnel)

Modifier `server.js` pour servir les fichiers statiques :

```javascript
// Après les middlewares, avant les routes API
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
  });
}
```

## 📊 Architecture

```
perfectlinks-v2/
├── backend/                 # Code backend (à renommer depuis racine)
│   ├── config/
│   ├── src/
│   ├── database/
│   └── server.js
│
├── frontend/                # Application React
│   ├── src/
│   │   ├── components/
│   │   │   ├── analysis/    # Visualisation des résultats
│   │   │   ├── auth/        # Authentification
│   │   │   ├── common/      # Header, Layout, etc.
│   │   │   ├── dashboard/   # Analyseur de sitemap
│   │   │   └── ui/          # Composants UI réutilisables
│   │   ├── pages/           # Pages (Login, Register, Dashboard)
│   │   ├── services/        # API calls (auth, sitemap)
│   │   ├── hooks/           # Custom hooks (useAuth, useAnalysis)
│   │   └── utils/           # Utilitaires et constantes
│   ├── public/
│   └── dist/                # Build de production
│
└── package.json             # Backend dependencies
```

## 🐛 Debugging

### Le frontend ne se connecte pas au backend

1. Vérifier que le backend est lancé sur le port 9090
2. Vérifier la configuration CORS dans `.env` (backend)
3. Vérifier `VITE_API_URL` dans `frontend/.env`
4. Ouvrir la console du navigateur pour voir les erreurs

### Erreur 401 (Unauthorized)

1. Vérifier que vous êtes bien connecté
2. Supprimer le localStorage et se reconnecter
3. Vérifier que JWT_SECRET est configuré dans le backend

### L'analyse ne fonctionne pas

1. Vérifier que l'URL du sitemap est valide
2. Vérifier que vous n'avez pas dépassé votre quota
3. Regarder les logs du backend pour voir les erreurs détaillées

## 📝 Tests

### Backend
```bash
npm test
```

### Frontend (linting)
```bash
cd frontend
npm run lint
```

## 🎨 Personnalisation

### Changer les couleurs

Modifier `frontend/tailwind.config.js` :

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#votre-couleur',
        // ...
      }
    }
  }
}
```

### Ajouter un logo

Remplacer `frontend/public/vite.svg` par votre logo.

## 📚 Documentation API

Voir les endpoints disponibles :
```bash
curl http://localhost:9090/api
```

## ⚡ Performance

### Développement
- Hot Module Replacement (HMR) activé
- Proxy Vite pour éviter les problèmes CORS

### Production
- Code splitting automatique (vendor, charts)
- Minification CSS et JS
- Tree shaking
- Compression gzip

## 🆘 Support

En cas de problème :

1. Vérifier les logs du backend (`logs/app.log`)
2. Vérifier la console du navigateur
3. Vérifier que tous les services sont démarrés
4. Consulter la documentation de l'API

## 📄 Licence

MIT

---

**Bon développement ! 🚀**
