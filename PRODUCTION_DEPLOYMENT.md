# 🚀 Déploiement Production - Perfect Links

Ce guide explique comment déployer le frontend sur votre serveur de production.

---

## 📦 Fichier fourni

**`perfectlinks-frontend-production.zip`** (90 KB)

Version de production configurée spécifiquement pour :
- **API Backend :** `https://perfectlinksv2.artkabis.fr/api`
- **Frontend :** `https://perfectlinksv2.artkabis.fr/`

---

## 📁 Structure du déploiement

```
perfectlinksv2.artkabis.fr/
├── index.html                    ← Page principale (à la racine)
├── frontend/                     ← Dossier des assets
│   ├── vite.svg                 ← Favicon
│   └── assets/
│       ├── index-DUSBO0s8.css   ← Styles (22 KB)
│       ├── index-OMTgyF94.js    ← Code application (97 KB)
│       ├── vendor-dRqO4oqp.js   ← Librairies React (162 KB)
│       └── charts-B_GByxux.js   ← Recharts (0.45 KB)
```

**Cette structure permet :**
- ✅ `index.html` accessible directement à `https://perfectlinksv2.artkabis.fr/`
- ✅ Assets dans un sous-dossier `/frontend/`
- ✅ Backend API sur `/api/*` (même domaine)
- ✅ Pas de problème CORS
- ✅ Gestion optimale par Express

---

## 🚀 Méthode de déploiement

### Étape 1 : Extraire l'archive sur le serveur

```bash
# Sur votre serveur de production
cd /path/to/perfectlinksv2

# Extraire l'archive
unzip perfectlinks-frontend-production.zip

# Vérifier la structure
ls -la
# Vous devriez voir :
# - index.html
# - frontend/
```

### Étape 2 : Configuration Express (server.js)

Ajouter ce code dans `server.js` **après les middlewares** mais **avant les routes API** :

```javascript
const path = require('path');

// ============================================================================
// STATIC FILES - Frontend
// ============================================================================

// Servir les fichiers statiques du frontend
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Servir index.html pour toutes les routes non-API
app.get('*', (req, res, next) => {
  // Ne pas intercepter les routes API
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Servir index.html pour toutes les autres routes (SPA routing)
  res.sendFile(path.join(__dirname, 'index.html'));
});
```

**⚠️ Ordre important :**
1. Middlewares (helmet, cors, body-parser, etc.)
2. **Code ci-dessus (static files + index.html)**
3. Routes API (`app.use('/api', routes)`)
4. Error handlers

### Étape 3 : Vérifier la configuration

**Fichier `.env` (backend) :**

```bash
NODE_ENV=production
PORT=9090  # ou le port que vous utilisez

# CORS - Autoriser votre domaine
CORS_ORIGIN=https://perfectlinksv2.artkabis.fr

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perfectlinks_db
DB_USER=perfectlinks_user
DB_PASSWORD=votre_mot_de_passe

# JWT Secrets (CHANGEZ-LES en production !)
JWT_SECRET=votre_secret_production_tres_long_et_securise
JWT_REFRESH_SECRET=votre_refresh_secret_production_tres_long_et_securise

# Email configuration
MAILSENDER_USERNAME=votre_email@domaine.com
MAILSENDER_HOST=smtp.votreserveur.com
MAILSENDER_PORT=587
MAILSENDER_PASSWORD=votre_mot_de_passe_email
MAILSENDER_FROM=Perfect Links <noreply@perfectlinksv2.artkabis.fr>

# Validation email URL
EMAIL_VALIDATION_URL=https://perfectlinksv2.artkabis.fr/api/validate-account
```

### Étape 4 : Redémarrer le serveur

```bash
# Avec PM2 (recommandé pour production)
pm2 restart perfectlinks

# Ou avec npm
npm start

# Vérifier les logs
pm2 logs perfectlinks
```

### Étape 5 : Vérifier le déploiement

**Test 1 - Frontend accessible :**
```bash
curl -I https://perfectlinksv2.artkabis.fr/
# Devrait retourner 200 OK avec Content-Type: text/html
```

**Test 2 - Assets accessibles :**
```bash
curl -I https://perfectlinksv2.artkabis.fr/frontend/assets/index-OMTgyF94.js
# Devrait retourner 200 OK avec Content-Type: application/javascript
```

**Test 3 - API fonctionne :**
```bash
curl https://perfectlinksv2.artkabis.fr/api/health
# Devrait retourner JSON avec status: "healthy"
```

**Test 4 - Routing SPA :**
```bash
curl -I https://perfectlinksv2.artkabis.fr/dashboard
# Devrait retourner 200 OK et servir index.html (pas 404)
```

---

## 🔐 Configuration Nginx (si reverse proxy)

Si vous utilisez Nginx comme reverse proxy devant Node.js :

```nginx
server {
    listen 443 ssl http2;
    server_name perfectlinksv2.artkabis.fr;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Logs
    access_log /var/log/nginx/perfectlinks-access.log;
    error_log /var/log/nginx/perfectlinks-error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy vers Node.js
    location / {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache pour les assets statiques
    location /frontend/ {
        proxy_pass http://localhost:9090;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name perfectlinksv2.artkabis.fr;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Vérification complète

### Checklist de déploiement

- [ ] Archive extraite avec succès
- [ ] `index.html` présent à la racine
- [ ] Dossier `frontend/` présent avec les assets
- [ ] `server.js` modifié pour servir les fichiers statiques
- [ ] `.env` configuré en mode production
- [ ] CORS_ORIGIN configuré avec le bon domaine
- [ ] JWT secrets changés (pas ceux de dev !)
- [ ] Base de données PostgreSQL accessible
- [ ] Serveur redémarré
- [ ] Page d'accueil accessible (https://perfectlinksv2.artkabis.fr/)
- [ ] API health check fonctionne (/api/health)
- [ ] Login fonctionne
- [ ] Analyse de sitemap fonctionne

### Test manuel complet

1. **Accéder au site :** `https://perfectlinksv2.artkabis.fr/`
2. **Page de login s'affiche** correctement
3. **Se connecter** avec le compte démo : `demo@test.com` / `Demo123!`
4. **Dashboard s'affiche** avec le quota utilisateur
5. **Tester une analyse** de sitemap
6. **Vérifier les résultats** dans les différents onglets
7. **Se déconnecter** et vérifier la redirection vers login

---

## 🔧 Configuration avancée (optionnel)

### PM2 Ecosystem File

Créer `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'perfectlinks',
    script: './server.js',
    instances: 2,  // Mode cluster avec 2 instances
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9090
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

Démarrer avec :
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Démarrage automatique au boot
```

### Monitoring avec PM2

```bash
# Dashboard en temps réel
pm2 monit

# Logs en temps réel
pm2 logs perfectlinks

# Infos détaillées
pm2 show perfectlinks

# Redémarrage sans downtime
pm2 reload perfectlinks
```

---

## 🐛 Dépannage

### Problème : Page blanche

**Cause possible :** Chemins des assets incorrects

**Solution :**
1. Vérifier que `index.html` pointe bien vers `/frontend/assets/`
2. Vérifier les logs du navigateur (F12)
3. Vérifier les logs du serveur

### Problème : Erreur CORS

**Cause :** CORS_ORIGIN mal configuré

**Solution :** Dans `.env` :
```bash
CORS_ORIGIN=https://perfectlinksv2.artkabis.fr
```

Redémarrer le serveur.

### Problème : 404 sur les routes (ex: /dashboard)

**Cause :** Le serveur ne redirige pas vers `index.html`

**Solution :** Vérifier que le code suivant est bien dans `server.js` :
```javascript
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});
```

**Important :** Ce code doit être **après** les routes statiques mais **avant** les routes API.

### Problème : API ne répond pas

**Cause :** Backend non démarré ou crash

**Solution :**
```bash
# Vérifier le processus
pm2 status

# Vérifier les logs
pm2 logs perfectlinks --err

# Redémarrer
pm2 restart perfectlinks
```

### Problème : Base de données non accessible

**Cause :** PostgreSQL non démarré ou mauvaises credentials

**Solution :**
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
psql -h localhost -U perfectlinks_user -d perfectlinks_db

# Vérifier les grants
npm run db:diagnose
```

---

## 🔒 Sécurité en production

### Checklist sécurité

- [ ] **HTTPS activé** (certificat SSL/TLS valide)
- [ ] **JWT secrets changés** (pas les valeurs de dev !)
- [ ] **CORS configuré** sur le domaine exact
- [ ] **Helmet activé** (déjà fait dans server.js)
- [ ] **Rate limiting activé** (déjà fait dans server.js)
- [ ] **Mots de passe DB sécurisés**
- [ ] **Logs activés** et surveillés
- [ ] **Backups DB** réguliers configurés
- [ ] **Firewall** configuré (port 9090 fermé sauf localhost si Nginx)
- [ ] **Variables d'environnement** sécurisées (pas dans git)

### Recommandations

1. **Ne JAMAIS commiter le fichier `.env` en production**
2. **Changer TOUS les secrets** par rapport au développement
3. **Activer les backups automatiques** de la base de données
4. **Monitorer les logs** pour détecter les erreurs et tentatives d'intrusion
5. **Mettre à jour régulièrement** les dépendances (npm audit)

---

## 📈 Performance

### Optimisations déjà appliquées

- ✅ Code splitting (vendor séparé de l'app)
- ✅ Minification JS et CSS
- ✅ Tree shaking (code inutilisé supprimé)
- ✅ Gzip-ready (compression automatique)
- ✅ Assets cachés avec expires headers

### Optimisations supplémentaires possibles

1. **CDN** pour servir les assets statiques
2. **Redis** pour le cache de sessions
3. **Connection pooling** PostgreSQL (déjà fait)
4. **Compression gzip** sur Nginx (voir config ci-dessus)
5. **HTTP/2** activé (voir config Nginx)

---

## 📊 Monitoring recommandé

### Outils suggérés

1. **PM2 Plus** - Monitoring temps réel
2. **Sentry** - Error tracking
3. **Google Analytics** - Analytics utilisateurs
4. **UptimeRobot** - Monitoring uptime
5. **PostgreSQL Monitoring** - pgAdmin ou similar

---

## 🔄 Mise à jour du frontend

Pour mettre à jour le frontend après modifications :

```bash
# 1. Sur votre machine locale
cd frontend
npm run build

# 2. Créer nouvelle archive
cd ..
zip -r perfectlinks-frontend-production.zip index.html frontend/ -x "*.map"

# 3. Uploader sur le serveur
scp perfectlinks-frontend-production.zip user@server:/path/to/perfectlinksv2/

# 4. Sur le serveur
cd /path/to/perfectlinksv2
unzip -o perfectlinks-frontend-production.zip

# 5. Redémarrer (si nécessaire)
pm2 reload perfectlinks
```

---

## 📞 Support

En cas de problème :

1. Vérifier les logs serveur : `pm2 logs perfectlinks`
2. Vérifier les logs navigateur : Console (F12)
3. Tester l'API séparément : `curl https://perfectlinksv2.artkabis.fr/api/health`
4. Vérifier la configuration CORS et HTTPS

---

## 📝 Résumé

**Fichiers déployés :**
- `index.html` (1 KB) - À la racine
- `frontend/vite.svg` (0.35 KB) - Favicon
- `frontend/assets/index.css` (22 KB) - Styles
- `frontend/assets/index.js` (97 KB) - Application
- `frontend/assets/vendor.js` (162 KB) - Librairies
- `frontend/assets/charts.js` (0.45 KB) - Recharts

**Total :** ~282 KB (non compressé), ~90 KB (compressé)

**Configuration :**
- API URL : `https://perfectlinksv2.artkabis.fr/api`
- Frontend : `https://perfectlinksv2.artkabis.fr/`
- Backend : Node.js/Express sur port 9090 (ou configuré)

**Compte de test :**
```
Email: demo@test.com
Mot de passe: Demo123!
```

---

**Bon déploiement ! 🚀**
