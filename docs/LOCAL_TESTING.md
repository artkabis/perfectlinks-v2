# 🧪 Guide de test local - Perfect Links API

Guide complet pour tester l'application en local avec PostgreSQL.

---

## 📋 Prérequis

### 1. Installer PostgreSQL (si pas déjà installé)

**Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (avec Homebrew) :**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows :**
- Télécharger depuis : https://www.postgresql.org/download/windows/
- Installer avec les options par défaut

### 2. Vérifier l'installation

```bash
# Vérifier que PostgreSQL fonctionne
sudo systemctl status postgresql
# ou sur macOS
brew services list

# Vérifier la version
psql --version
```

---

## 🔧 Configuration de la base de données

### 1. Créer la base de données et l'utilisateur

```bash
# Se connecter à PostgreSQL en tant que superuser
sudo -u postgres psql

# Ou sur macOS/Windows
psql -U postgres
```

**Dans le shell PostgreSQL :**
```sql
-- Créer la base de données
CREATE DATABASE perfectlinks_db;

-- Créer l'utilisateur
CREATE USER perfectlinks_user WITH ENCRYPTED PASSWORD 'perfectlinks2024';

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE perfectlinks_db TO perfectlinks_user;

-- Se connecter à la nouvelle base
\c perfectlinks_db

-- Donner les permissions sur le schéma public (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO perfectlinks_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO perfectlinks_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO perfectlinks_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO perfectlinks_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO perfectlinks_user;

-- Quitter
\q
```

### 2. Tester la connexion

```bash
# Tester avec l'utilisateur créé
psql -U perfectlinks_user -d perfectlinks_db -h localhost

# Si ça fonctionne, vous devriez voir :
# perfectlinks_db=>

# Taper \q pour quitter
```

**Si erreur de connexion :**
```bash
# Éditer le fichier pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Trouver la ligne qui commence par "local all all"
# et remplacer "peer" par "md5"
# Exemple :
# local   all             all                                     md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

---

## 🚀 Configuration de l'application

### 1. Installer les dépendances

```bash
cd /home/user/perfectlinks-v2
npm install
```

### 2. Créer le fichier .env

```bash
cp .env.example .env
nano .env
```

**Configuration minimale pour test local :**
```env
# Environment
NODE_ENV=development
PORT=9090

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perfectlinks_db
DB_USER=perfectlinks_user
DB_PASSWORD=perfectlinks2024

# JWT Secrets (générer des clés aléatoires pour la prod)
JWT_SECRET=dev_jwt_secret_key_for_local_testing_only
JWT_REFRESH_SECRET=dev_refresh_secret_key_for_local_testing_only
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Plans
FREE_PLAN=100
PREMIUM_PLAN=500
PRO_PLAN=1000

# Email (optionnel pour les tests - mettre de fausses valeurs)
MAILSENDER_USERNAME=test@localhost
MAILSENDER_HOST=localhost
MAILSENDER_PORT=587
MAILSENDER_PASSWORD=test
MAILSENDER_SECURE=false
MAILSENDER_FROM=Perfect Links <noreply@localhost>

# Email Validation URL
EMAIL_VALIDATION_URL=http://localhost:9090/api/validate-account

# CORS (autoriser toutes les origines en dev)
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log

# Crawling
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=10000
USER_AGENT=PerfectLinks Bot/2.0 (Local Test)
```

### 3. Créer les tables

```bash
npm run db:setup
```

**Sortie attendue :**
```
🔧 Setting up Perfect Links database...

📄 Executing schema.sql...
✅ Database tables created successfully

📊 Created tables:
   ✓ usage_logs
   ✓ user_sessions
   ✓ user_usage
   ✓ users

⚙️  Created functions:
   ✓ cleanup_expired_sessions()
   ✓ initialize_user_usage()
   ✓ reset_expired_quotas()
   ✓ update_limit_on_plan_change()
   ✓ update_updated_at_column()
   ✓ update_usage_limit_on_plan_change()

✅ Database setup completed successfully!
```

### 4. Vérifier la base de données

```bash
npm run migrate:check
```

---

## 🧪 Tests de l'API

### 1. Démarrer le serveur

```bash
npm run dev
```

**Sortie attendue :**
```
🚀 Perfect Links API v2.0 started successfully
📍 Environment: development
🌐 Server running on port 9090
📊 API endpoints available at http://localhost:9090/api
💚 Health check: http://localhost:9090/api/health
```

### 2. Tester le health check

**Dans un nouveau terminal :**
```bash
curl http://localhost:9090/api/health
```

**Réponse attendue :**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123
}
```

### 3. Créer un utilisateur de test

```bash
curl -X POST http://localhost:9090/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testlocal",
    "email": "test@local.com",
    "password": "TestPass123!"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to validate your account.",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testlocal",
    "email": "test@local.com",
    "plan": "free",
    "status": "pending"
  }
}
```

### 4. Valider l'utilisateur manuellement

**En production, l'utilisateur recevrait un email. Pour les tests locaux :**

```bash
# Se connecter à PostgreSQL
psql -U perfectlinks_user -d perfectlinks_db -h localhost

# Valider l'utilisateur
UPDATE users SET email_validated = TRUE, status = 'active' WHERE email = 'test@local.com';

# Vérifier
SELECT username, email, status, email_validated FROM users;

# Quitter
\q
```

### 5. Se connecter

```bash
curl -X POST http://localhost:9090/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@local.com",
    "password": "TestPass123!"
  }'
```

**Copier l'accessToken de la réponse.**

### 6. Obtenir les infos utilisateur

```bash
# Remplacer YOUR_TOKEN par le token obtenu
curl -X GET http://localhost:9090/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Tester l'analyse de sitemap

```bash
# Avec un vrai sitemap (exemple)
curl -X GET "http://localhost:9090/api/sitemap-analysis?url=https://www.sitemaps.org/sitemap.xml" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Vérification des données

### Vérifier les utilisateurs créés

```bash
psql -U perfectlinks_user -d perfectlinks_db -h localhost
```

```sql
-- Voir tous les utilisateurs
SELECT username, email, plan, status, email_validated, created_at
FROM users
ORDER BY created_at DESC;

-- Voir les quotas
SELECT u.email, uu.requests_made, uu.requests_limit, uu.period_end
FROM users u
JOIN user_usage uu ON u.user_id = uu.user_id;

-- Voir les sessions actives
SELECT u.email, s.created_at, s.expires_at, s.is_active
FROM user_sessions s
JOIN users u ON s.user_id = u.user_id
WHERE s.is_active = TRUE;

-- Voir les logs d'utilisation
SELECT u.email, ul.endpoint, ul.status_code, ul.duration_ms, ul.created_at
FROM usage_logs ul
JOIN users u ON ul.user_id = u.user_id
ORDER BY ul.created_at DESC
LIMIT 10;
```

---

## 🛠️ Commandes utiles

### Réinitialiser la base de données

```bash
npm run db:reset
# ⚠️ Attention : Cela supprime TOUTES les données !
```

### Voir les logs en temps réel

```bash
# Logs de l'application
tail -f logs/combined.log

# Logs d'erreurs uniquement
tail -f logs/error.log
```

### Arrêter le serveur

```
Ctrl + C
```

### Nettoyer les sessions expirées

```bash
psql -U perfectlinks_user -d perfectlinks_db -h localhost
```

```sql
SELECT cleanup_expired_sessions();
```

### Réinitialiser les quotas expirés

```sql
SELECT reset_expired_quotas();
```

---

## 📊 Script de test automatique

Créer un fichier `test-local.sh` :

```bash
#!/bin/bash

echo "🧪 Test local Perfect Links API"
echo "================================"

# Variables
API="http://localhost:9090"
EMAIL="test$(date +%s)@local.com"
PASSWORD="TestPass123!"
USERNAME="testuser$(date +%s)"

echo ""
echo "1️⃣ Test Health Check..."
curl -s $API/api/health | jq .

echo ""
echo "2️⃣ Inscription utilisateur..."
REGISTER=$(curl -s -X POST $API/api/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo $REGISTER | jq .

USER_ID=$(echo $REGISTER | jq -r '.user.userId')

echo ""
echo "3️⃣ Validation manuelle du compte..."
psql -U perfectlinks_user -d perfectlinks_db -h localhost -c \
  "UPDATE users SET email_validated = TRUE, status = 'active' WHERE user_id = '$USER_ID';"

echo ""
echo "4️⃣ Connexion..."
LOGIN=$(curl -s -X POST $API/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo $LOGIN | jq .

TOKEN=$(echo $LOGIN | jq -r '.accessToken')

echo ""
echo "5️⃣ Récupération des infos utilisateur..."
curl -s -X GET $API/api/me \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "✅ Tests terminés !"
echo "Token : $TOKEN"
```

**Rendre exécutable et lancer :**
```bash
chmod +x test-local.sh
./test-local.sh
```

---

## 🐛 Dépannage

### Erreur : "ECONNREFUSED 127.0.0.1:5432"

**Cause :** PostgreSQL n'est pas démarré.

**Solution :**
```bash
sudo systemctl start postgresql
```

### Erreur : "password authentication failed"

**Cause :** Mot de passe incorrect ou configuration pg_hba.conf.

**Solution :**
```bash
# Réinitialiser le mot de passe
sudo -u postgres psql
ALTER USER perfectlinks_user WITH PASSWORD 'perfectlinks2024';
\q

# Vérifier pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Mettre "md5" au lieu de "peer"
sudo systemctl restart postgresql
```

### Erreur : "relation does not exist"

**Cause :** Les tables n'ont pas été créées.

**Solution :**
```bash
npm run db:setup
```

### Le serveur ne démarre pas

**Vérifier les logs :**
```bash
cat logs/error.log
```

**Vérifier le port :**
```bash
lsof -i :9090
# Si occupé, changer PORT dans .env
```

---

## 📸 Test avec un client REST (Postman/Insomnia)

### Configuration Postman

1. **Créer une collection** : "Perfect Links API"

2. **Variables d'environnement** :
   - `base_url` : `http://localhost:9090`
   - `access_token` : (sera rempli après login)

3. **Requêtes à créer** :

**Register :**
- Method: POST
- URL: `{{base_url}}/api/register`
- Body (JSON):
```json
{
  "username": "postmantest",
  "email": "postman@test.com",
  "password": "TestPass123!"
}
```

**Login :**
- Method: POST
- URL: `{{base_url}}/api/login`
- Body (JSON):
```json
{
  "email": "postman@test.com",
  "password": "TestPass123!"
}
```
- Tests (pour sauvegarder le token) :
```javascript
pm.environment.set("access_token", pm.response.json().accessToken);
```

**Get Me :**
- Method: GET
- URL: `{{base_url}}/api/me`
- Headers: `Authorization: Bearer {{access_token}}`

**Analyze Sitemap :**
- Method: GET
- URL: `{{base_url}}/api/sitemap-analysis?url=https://example.com/sitemap.xml`
- Headers: `Authorization: Bearer {{access_token}}`

---

## ✅ Checklist de test local

- [ ] PostgreSQL installé et démarré
- [ ] Base de données créée
- [ ] Tables créées (npm run db:setup)
- [ ] Fichier .env configuré
- [ ] Dépendances installées (npm install)
- [ ] Serveur démarré (npm run dev)
- [ ] Health check OK
- [ ] Utilisateur créé et validé
- [ ] Login réussi
- [ ] Token obtenu
- [ ] Endpoint /api/me fonctionne
- [ ] Analyse de sitemap testée

---

**Vous êtes prêt pour tester l'API en local ! 🚀**

Pour toute question, consultez le [README.md](../README.md) ou ouvrez une issue.
