# 🧪 Guide de Test Local - Perfect Links

Ce guide explique comment tester le frontend en local avec votre backend local.

---

## ⚠️ Problème CORS rencontré

Lorsque vous testez le frontend local (`http://127.0.0.1:5500`) avec le backend de production (`https://perfectlinksv2.artkabis.fr`), vous rencontrez cette erreur :

```
Access to XMLHttpRequest at 'https://perfectlinksv2.artkabis.fr/api/login'
from origin 'http://127.0.0.1:5500' has been blocked by CORS policy
```

**Cause :** Le serveur de production n'autorise que les requêtes venant de `https://perfectlinksv2.artkabis.fr` (même domaine).

---

## ✅ Solution : Tester avec le backend local

J'ai créé **`perfectlinks-frontend-local-test.zip`** configuré pour votre backend local.

### 📦 Fichier fourni

**`perfectlinks-frontend-local-test.zip`** (90 KB)
- API configurée sur : `http://localhost:9090/api`
- Structure identique à la version production (index.html à la racine)

---

## 🚀 Démarrage rapide

### Étape 1 : Démarrer le backend local

```bash
# Terminal 1 - Backend
cd /path/to/perfectlinks-v2
npm run dev

# Le backend démarre sur http://localhost:9090
```

Vérifier que l'API répond :
```bash
curl http://localhost:9090/api/health
# → {"success":true,"status":"healthy", ...}
```

### Étape 2 : Extraire et tester le frontend

**Option A - Avec Python (recommandé):**

```bash
# Extraire l'archive
unzip perfectlinks-frontend-local-test.zip -d local-test
cd local-test

# Démarrer un serveur HTTP
python -m http.server 8080

# Ouvrir dans le navigateur
# → http://localhost:8080
```

**Option B - Avec Node.js (serve):**

```bash
# Installer serve (une fois)
npm install -g serve

# Extraire et servir
unzip perfectlinks-frontend-local-test.zip -d local-test
serve -s local-test -l 8080

# → http://localhost:8080
```

**Option C - Avec VS Code Live Server:**

```bash
# Extraire l'archive
unzip perfectlinks-frontend-local-test.zip -d local-test

# Dans VS Code :
# 1. Ouvrir le dossier local-test
# 2. Clic droit sur index.html
# 3. "Open with Live Server"

# → http://127.0.0.1:5500
```

---

## ✅ Test complet

### 1. Vérifier que tout fonctionne

**Backend accessible :**
```bash
curl http://localhost:9090/api/health
```

**Frontend accessible :**
Ouvrir `http://localhost:8080` dans le navigateur

### 2. Tester l'authentification

- Page de login s'affiche ✅
- Se connecter avec : `demo@test.com` / `Demo123!`
- Dashboard s'affiche avec le quota ✅
- **Pas d'erreur CORS dans la console** ✅

### 3. Tester l'analyse

- Entrer une URL de sitemap (ex: `https://www.huetpeinture.com/sitemap.xml`)
- Cliquer sur "Lancer l'analyse"
- Barre de progression s'affiche ✅
- Résultats s'affichent dans les onglets ✅

---

## 🔄 Comparaison des versions

| Version | API URL | Usage |
|---------|---------|-------|
| **local-test** | `http://localhost:9090/api` | Tests locaux avec backend local |
| **production** | `https://perfectlinksv2.artkabis.fr/api` | Déploiement sur le serveur |

---

## 🐛 Résolution de problèmes

### ❌ Erreur CORS persistante

**Vérifier :**
1. Le backend local est bien démarré sur le port 9090
2. La console du navigateur (F12) pour voir l'URL appelée
3. Que vous utilisez bien `perfectlinks-frontend-local-test.zip` et pas la version production

**Solution si le problème persiste :**

Vérifier dans la console du navigateur que l'API appelée est bien `http://localhost:9090/api/login` (et pas `https://perfectlinksv2.artkabis.fr`)

### ❌ Backend ne répond pas

**Vérifier :**
```bash
# Backend en cours d'exécution ?
lsof -i :9090

# Logs du backend
npm run dev
# Regarder les logs pour les erreurs
```

**Redémarrer :**
```bash
# Ctrl+C pour arrêter
# Relancer
npm run dev
```

### ❌ Base de données non accessible

**Vérifier PostgreSQL :**
```bash
# PostgreSQL en cours d'exécution ?
sudo systemctl status postgresql

# Tester la connexion
psql -h localhost -U perfectlinks_user -d perfectlinks_db
```

**Réinitialiser si besoin :**
```bash
npm run db:reset
npm run db:setup
```

### ❌ Page blanche

**Causes possibles :**
1. Fichiers mal extraits
2. Serveur HTTP mal configuré
3. Erreurs JavaScript (vérifier la console F12)

**Solution :**
```bash
# Ré-extraire proprement
rm -rf local-test
unzip perfectlinks-frontend-local-test.zip -d local-test
cd local-test

# Vérifier la structure
ls -la
# Vous devez voir : index.html + frontend/

# Relancer le serveur
python -m http.server 8080
```

---

## 🔐 Configuration backend local

Votre `.env` (backend) doit contenir :

```bash
# Development
NODE_ENV=development
PORT=9090

# CORS - Permissif pour les tests
CORS_ORIGIN=*

# Base de données locale
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perfectlinks_db
DB_USER=perfectlinks_user
DB_PASSWORD=perfectlinks2024

# JWT (valeurs de dev)
JWT_SECRET=local_dev_jwt_secret_key_not_for_production
JWT_REFRESH_SECRET=local_dev_refresh_secret_key_not_for_production

# Email (factice pour dev)
MAILSENDER_USERNAME=test@localhost
MAILSENDER_HOST=localhost
MAILSENDER_PORT=587
MAILSENDER_PASSWORD=test
```

---

## 🎯 Workflow de test recommandé

### Développement et tests

1. **Démarrer le backend** : `npm run dev`
2. **Utiliser** `perfectlinks-frontend-local-test.zip`
3. **Tester** sur `http://localhost:8080`

### Avant déploiement en production

1. **Tester en local** (étapes ci-dessus)
2. **Vérifier** que tout fonctionne
3. **Utiliser** `perfectlinks-frontend-production.zip` pour le déploiement
4. **Déployer** sur `https://perfectlinksv2.artkabis.fr`

---

## 🆚 Version production vs local

### Pour tester le backend de PRODUCTION depuis votre machine

Si vous voulez vraiment tester le frontend local avec le backend de production, vous devez **modifier temporairement le CORS du serveur de production** :

**Sur le serveur, dans `.env` :**
```bash
# ⚠️ TEMPORAIRE - Pour les tests uniquement !
CORS_ORIGIN=https://perfectlinksv2.artkabis.fr,http://127.0.0.1:5500,http://localhost:8080
```

**Redémarrer le serveur :**
```bash
pm2 restart perfectlinks
```

**⚠️ IMPORTANT :** Remettre `CORS_ORIGIN=https://perfectlinksv2.artkabis.fr` après les tests !

---

## 📊 Vérification des URLs dans le navigateur

Ouvrir la console du navigateur (F12) et regarder l'onglet "Network" :

**Avec local-test :**
```
GET http://localhost:9090/api/health → 200 OK
POST http://localhost:9090/api/login → 200 OK
```

**Avec production :**
```
GET https://perfectlinksv2.artkabis.fr/api/health → 200 OK
POST https://perfectlinksv2.artkabis.fr/api/login → 200 OK
```

Si vous voyez l'URL de production alors que vous utilisez `local-test.zip`, c'est que vous avez le mauvais fichier.

---

## 📦 Contenu de l'archive local-test

```
perfectlinks-frontend-local-test.zip
├── index.html              (configuration locale)
└── frontend/
    ├── vite.svg
    └── assets/
        ├── index.css       (22 KB)
        ├── index.js        (97 KB) ← API: localhost:9090
        ├── vendor.js       (162 KB)
        └── charts.js       (0.45 KB)
```

**Différence clé :** Le fichier `index.js` contient `http://localhost:9090/api` au lieu de `https://perfectlinksv2.artkabis.fr/api`

---

## ✅ Checklist de test

- [ ] Backend local démarré (port 9090)
- [ ] API health check fonctionne
- [ ] Base de données PostgreSQL accessible
- [ ] Archive `local-test.zip` extraite
- [ ] Serveur HTTP démarré (Python/serve)
- [ ] Page de login s'affiche
- [ ] Pas d'erreur CORS dans la console
- [ ] Login avec demo@test.com fonctionne
- [ ] Dashboard s'affiche
- [ ] Analyse de sitemap fonctionne
- [ ] Tous les onglets de résultats s'affichent

---

## 🎉 Résumé

**Pour tester en local :**
1. Backend : `npm run dev` → `http://localhost:9090`
2. Frontend : `perfectlinks-frontend-local-test.zip` → `http://localhost:8080`
3. Connexion : `demo@test.com` / `Demo123!`

**Pour déployer en production :**
1. Frontend : `perfectlinks-frontend-production.zip`
2. Suivre `PRODUCTION_DEPLOYMENT.md`

**Bon test ! 🚀**
