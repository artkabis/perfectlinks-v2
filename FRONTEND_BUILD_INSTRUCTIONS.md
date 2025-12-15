# 📦 Frontend Build - Instructions d'utilisation

Ce fichier explique comment utiliser le build statique du frontend Perfect Links.

## 📁 Fichier fourni

**`perfectlinks-frontend-build.zip`** (179 KB)

Ce fichier contient le build de production du frontend React optimisé et prêt à l'emploi.

---

## 🚀 Option 1 : Test rapide avec serveur HTTP simple

### Méthode A - Avec Python

```bash
# 1. Extraire l'archive
unzip perfectlinks-frontend-build.zip

# 2. Aller dans le dossier dist
cd frontend/dist

# 3. Lancer un serveur HTTP
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Accéder à : **http://localhost:8080**

### Méthode B - Avec Node.js (serve)

```bash
# 1. Installer serve globalement (une fois)
npm install -g serve

# 2. Extraire l'archive
unzip perfectlinks-frontend-build.zip

# 3. Servir le dossier dist
serve -s frontend/dist -l 8080
```

Accéder à : **http://localhost:8080**

### Méthode C - Avec PHP

```bash
# 1. Extraire l'archive
unzip perfectlinks-frontend-build.zip

# 2. Aller dans le dossier dist
cd frontend/dist

# 3. Lancer le serveur PHP
php -S localhost:8080
```

Accéder à : **http://localhost:8080**

---

## 🔧 Option 2 : Intégration avec le backend Express

### Étape 1 : Extraire l'archive

```bash
unzip perfectlinks-frontend-build.zip
```

Cela créera le dossier `frontend/dist/` avec tous les fichiers.

### Étape 2 : Configurer Express

Modifier le fichier **`server.js`** (après les middlewares, avant les routes API) :

```javascript
const path = require('path');

// ... middlewares existants ...

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Routes API (ne pas toucher)
app.use('/api', routes);

// Route catch-all pour le SPA (APRÈS les routes API)
app.get('*', (req, res, next) => {
  // Ne pas intercepter les appels API
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Servir index.html pour toutes les autres routes
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});
```

### Étape 3 : Configurer les variables d'environnement

Le frontend build est configuré pour utiliser l'API sur `http://localhost:9090/api`.

Si votre backend tourne sur un autre port ou domaine, vous devrez **rebuilder le frontend** avec la bonne URL :

```bash
# Dans le dossier frontend
cd frontend

# Modifier .env
echo "VITE_API_URL=http://votre-domaine:port/api" > .env

# Rebuilder
npm run build
```

### Étape 4 : Démarrer le serveur

```bash
# Depuis la racine du projet
npm start
# ou
npm run dev
```

Accéder à : **http://localhost:9090** (frontend + backend sur le même port)

---

## 📋 Contenu de l'archive

```
frontend/dist/
├── index.html              # Point d'entrée HTML
├── vite.svg               # Favicon
└── assets/
    ├── index-DUSBO0s8.css     # Styles compilés (22 KB)
    ├── index-DvcgpqpF.js      # Code application (97 KB)
    ├── vendor-dRqO4oqp.js     # Librairies (React, etc.) (162 KB)
    └── charts-B_GByxux.js     # Recharts (0.45 KB)
```

**Taille totale (non compressée)** : ~282 KB
**Taille totale (gzip)** : ~89 KB

---

## ⚠️ Prérequis

### Backend doit être lancé

Le frontend a besoin que l'API backend soit accessible sur **`http://localhost:9090/api`** (ou l'URL configurée).

```bash
# Démarrer le backend
npm run dev
```

Vérifier que l'API répond :
```bash
curl http://localhost:9090/api/health
```

### Compte de test

Un compte démo est déjà créé en base de données :

```
Email: demo@test.com
Mot de passe: Demo123!
```

---

## 🔍 Vérification du build

### Fichiers présents

```bash
unzip -l perfectlinks-frontend-build.zip
```

Vous devriez voir 8 fichiers :
- `frontend/dist/index.html`
- `frontend/dist/vite.svg`
- `frontend/dist/assets/index-DUSBO0s8.css`
- `frontend/dist/assets/index-DvcgpqpF.js`
- `frontend/dist/assets/vendor-dRqO4oqp.js`
- `frontend/dist/assets/charts-B_GByxux.js`

### Test de l'API depuis le frontend

Une fois le frontend lancé, ouvrir la console du navigateur (F12) et vérifier :

1. Pas d'erreurs CORS
2. Les appels API passent bien
3. L'authentification fonctionne

---

## 🐛 Dépannage

### Erreur : "Failed to fetch"

**Cause** : Le backend n'est pas lancé ou pas accessible.

**Solution** :
```bash
# Vérifier que le backend tourne
curl http://localhost:9090/api/health

# Si non, démarrer le backend
npm run dev
```

### Erreur CORS

**Cause** : La configuration CORS du backend bloque les requêtes.

**Solution** : Vérifier dans `.env` (backend) :
```bash
CORS_ORIGIN=*
```

### Page blanche

**Cause** : Les fichiers ne sont pas servis correctement.

**Solution** :
- Vérifier que `index.html` est à la racine de `dist/`
- Vérifier que les chemins vers les assets sont corrects
- Vérifier les logs du serveur

### Erreur 404 sur les routes

**Cause** : Le serveur ne redirige pas toutes les routes vers `index.html`.

**Solution** : Utiliser `serve -s` ou configurer correctement Express (voir Option 2).

---

## 🔐 Configuration de production

Pour déployer en production :

### 1. Backend

Modifier `.env` :
```bash
NODE_ENV=production
CORS_ORIGIN=https://votre-domaine.com
```

### 2. Frontend

Si vous devez changer l'URL de l'API, rebuilder :

```bash
cd frontend
echo "VITE_API_URL=https://api.votre-domaine.com/api" > .env
npm run build
```

Puis re-zipper :
```bash
cd ..
zip -r perfectlinks-frontend-build.zip frontend/dist/
```

---

## 📊 Performance

Le build est optimisé pour la production avec :

- ✅ **Minification** CSS et JavaScript
- ✅ **Tree shaking** (code inutilisé supprimé)
- ✅ **Code splitting** (vendor séparé de l'app)
- ✅ **Gzip ready** (~89 KB compressé)
- ✅ **Source maps** exclues du zip

**Temps de chargement estimé (3G)** : < 3 secondes
**Temps de chargement estimé (4G/WiFi)** : < 1 seconde

---

## 📚 Documentation complète

Pour plus d'informations sur le développement :
- **FRONTEND_SETUP.md** - Guide complet de développement
- **frontend/README.md** - Documentation technique

---

## ✅ Checklist de test

Après extraction et lancement, vérifier :

- [ ] Page de login s'affiche
- [ ] Connexion avec demo@test.com fonctionne
- [ ] Dashboard s'affiche avec le quota
- [ ] Bouton "robots.txt" fonctionne
- [ ] Analyse d'un sitemap fonctionne
- [ ] Onglets de résultats s'affichent
- [ ] Pages orphelines détectées
- [ ] Liens externes listés
- [ ] Déconnexion fonctionne

---

**Bon test ! 🚀**

Si vous rencontrez des problèmes, vérifiez d'abord que le backend est bien lancé et accessible.
