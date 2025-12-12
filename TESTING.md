# 🧪 Perfect Links API - Guide de Tests

Guide complet pour tester l'API Perfect Links v2.0.

## 🚀 Démarrage rapide

### 1. Démarrer le serveur

```bash
npm start
```

### 2. Lancer les tests automatiques

```bash
# Option 1 : Script bash interactif (RECOMMANDÉ)
./test-api.sh

# Option 2 : Tests Jest
npm test

# Option 3 : Seulement les tests d'intégration
npm run test:integration
```

## 📋 Scripts de test disponibles

| Commande | Description |
|----------|-------------|
| `./test-api.sh` | Tests interactifs bash avec output coloré |
| `npm test` | Tous les tests Jest avec couverture de code |
| `npm run test:integration` | Tests d'intégration uniquement |
| `npm run test:watch` | Mode watch (redémarre automatiquement) |

## 🧪 Test Script Bash (`test-api.sh`)

### Fonctionnalités

Ce script teste **tous** les endpoints de l'API :
- ✅ Health check
- ✅ Inscription utilisateur
- ✅ Connexion
- ✅ Profil utilisateur
- ✅ Statistiques
- ✅ Analyse de sitemap
- ✅ Rafraîchissement de token
- ✅ Sessions actives
- ✅ Déconnexion
- ✅ Vérification post-déconnexion

### Utilisation

```bash
# Test en local
./test-api.sh

# Test en production
API_URL=https://perfactlinksv2.artkabis.fr/api ./test-api.sh
```

### Output attendu

```
======================================================================
  🚀 Perfect Links API - Suite de Tests
======================================================================

ℹ️  API URL: http://localhost:9090/api
ℹ️  Test Email: test-1702380000@perfectlinks.fr
ℹ️  Test Username: testuser-1702380000

🧪 TEST: 1. Health Check
✅ Health check passed
{
  "status": "ok",
  "timestamp": "2025-12-12T09:00:00.000Z",
  "database": "connected"
}

🧪 TEST: 2. User Registration
✅ User registered successfully
ℹ️  User ID: 550e8400-e29b-41d4-a716-446655440000

[...]

======================================================================
  ✅ Test Suite Complete!
======================================================================
```

## 📊 Tests Jest (`api.integration.test.js`)

### Structure des tests

```
Perfect Links API - Integration Tests
  ├── Health Check
  │   └── GET /health should return 200 and health status
  ├── Authentication
  │   ├── POST /auth/register should create a new user
  │   ├── POST /auth/register should reject duplicate email
  │   ├── POST /auth/register should reject weak passwords
  │   ├── POST /auth/login should login successfully
  │   ├── POST /auth/login should reject wrong password
  │   └── POST /auth/refresh should refresh access token
  ├── User Profile
  │   ├── GET /users/profile should return user profile
  │   ├── GET /users/profile should reject without token
  │   └── GET /users/statistics should return usage statistics
  ├── Sitemap Analysis
  │   ├── POST /analyze/sitemap should analyze a sitemap
  │   ├── POST /analyze/sitemap should reject without authentication
  │   └── POST /analyze/sitemap should reject invalid URL
  ├── Session Management
  │   ├── GET /auth/sessions should return active sessions
  │   ├── POST /auth/logout should logout successfully
  │   └── GET /users/profile should fail after logout
  └── Quota Management
      ├── Should track API usage
      └── Should enforce quota limits for free plan
```

### Exécution

```bash
# Tous les tests avec couverture
npm test

# Mode watch (développement)
npm run test:watch

# Tests d'intégration uniquement
npm run test:integration

# Test spécifique
npm test -- --testNamePattern="Health Check"

# Verbose
npm test -- --verbose
```

### Résultat attendu

```
PASS  tests/api.integration.test.js
  Perfect Links API - Integration Tests
    Health Check
      ✓ GET /health should return 200 and health status (50ms)
    Authentication
      ✓ POST /auth/register should create a new user (200ms)
      ✓ POST /auth/register should reject duplicate email (150ms)
      ✓ POST /auth/login should login successfully (150ms)
    [...]

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        8.456s
```

## 🔧 Tests manuels avec curl

### Créer un compte

```bash
curl -X POST http://localhost:9090/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Se connecter

```bash
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**💡 Astuce** : Sauvegarder le token dans une variable

```bash
TOKEN=$(curl -s -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}' \
  | jq -r '.accessToken')

echo "Token: $TOKEN"
```

### Tester un endpoint protégé

```bash
curl http://localhost:9090/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Analyser un sitemap

```bash
curl -X POST http://localhost:9090/api/analyze/sitemap \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteUrl": "https://example.com/sitemap.xml"
  }'
```

## 📈 Couverture de code

La couverture de code est générée automatiquement avec `npm test`.

```bash
npm test

# Ouvrir le rapport HTML
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## 🐛 Dépannage

### Le serveur ne répond pas

```bash
# Vérifier que le serveur tourne
curl http://localhost:9090/api/health

# Si erreur, vérifier les logs
tail -f logs/combined.log
```

### Tests échouent

```bash
# Vérifier la connexion DB
npm run db:diagnose

# Voir les erreurs détaillées
npm test -- --verbose

# Exécuter un seul test
npm test -- --testNamePattern="Health Check"
```

### Erreurs de permissions PostgreSQL

```bash
# Diagnostiquer
npm run db:diagnose

# Réparer
npm run db:grant
```

### Port déjà utilisé

```bash
# Changer le port dans .env
echo "PORT=3000" >> .env

# Redémarrer
npm start
```

## 🔒 Sécurité des tests

**IMPORTANT** : Les tests créent de vrais utilisateurs dans la base de données.

### Format des emails de test

- Script bash : `test-{timestamp}@perfectlinks.fr`
- Jest : `test-{timestamp}@perfectlinks.fr`

### Nettoyer les utilisateurs de test

```sql
-- Se connecter à PostgreSQL
psql -U votre_utilisateur -d nigr8844_perfectlinks_v2

-- Supprimer les utilisateurs de test
DELETE FROM users WHERE email LIKE 'test-%@perfectlinks.fr';

-- Vérifier
SELECT count(*) FROM users WHERE email LIKE 'test-%@perfectlinks.fr';
```

Ou via Node.js :

```bash
node -e "
const { Client } = require('pg');
require('dotenv').config();
const client = new Client({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
client.connect().then(() => {
  return client.query(\"DELETE FROM users WHERE email LIKE 'test-%@perfectlinks.fr'\");
}).then(result => {
  console.log('Deleted:', result.rowCount, 'test users');
  client.end();
});
"
```

## 📊 Endpoints testés

| Endpoint | Méthode | Auth | Status | Tests |
|----------|---------|------|--------|-------|
| `/health` | GET | Non | ✅ | Bash, Jest |
| `/auth/register` | POST | Non | ✅ | Bash, Jest |
| `/auth/login` | POST | Non | ✅ | Bash, Jest |
| `/auth/logout` | POST | Oui | ✅ | Bash, Jest |
| `/auth/refresh` | POST | Non | ✅ | Bash, Jest |
| `/auth/sessions` | GET | Oui | ✅ | Bash, Jest |
| `/users/profile` | GET | Oui | ✅ | Bash, Jest |
| `/users/statistics` | GET | Oui | ✅ | Bash, Jest |
| `/analyze/sitemap` | POST | Oui | ✅ | Bash, Jest |

## 🎯 Objectifs de couverture

| Composant | Couverture cible | Status |
|-----------|------------------|--------|
| Routes | 90% | ✅ |
| Controllers | 85% | ✅ |
| Models | 90% | ✅ |
| Services | 80% | ✅ |
| Middleware | 85% | ✅ |

## 📚 Ressources

- [Documentation API](docs/API_DOCUMENTATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [README Tests](tests/README.md)
- [Quick Start](QUICKSTART.md)

## ✅ Checklist avant déploiement

- [ ] Tous les tests passent (`npm test`)
- [ ] Script bash fonctionne (`./test-api.sh`)
- [ ] Health check répond
- [ ] Permissions PostgreSQL configurées (`npm run db:diagnose`)
- [ ] Variables d'environnement configurées
- [ ] Logs accessibles et lisibles
- [ ] Email de validation testé (si configuré)
- [ ] Quotas fonctionnent correctement
- [ ] Tokens JWT valides et rafraîchissables
