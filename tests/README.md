# Perfect Links API - Tests

Ce dossier contient les tests pour l'API Perfect Links v2.0.

## 🧪 Types de tests

### 1. Tests d'intégration Jest (`api.integration.test.js`)

Tests automatisés complets de tous les endpoints de l'API.

**Exécution** :
```bash
npm test
```

**Couverture de code** :
```bash
npm run test:coverage
```

**Mode watch** (redémarre automatiquement) :
```bash
npm run test:watch
```

### 2. Script de test Bash (`../test-api.sh`)

Script bash interactif pour tester manuellement l'API.

**Exécution** :
```bash
./test-api.sh
```

**Avec une URL personnalisée** :
```bash
API_URL=https://perfactlinksv2.artkabis.fr/api ./test-api.sh
```

## 📋 Ce qui est testé

### ✅ Authentification
- [x] Inscription d'un nouvel utilisateur
- [x] Validation des données (email, mot de passe, etc.)
- [x] Connexion
- [x] Rafraîchissement du token
- [x] Déconnexion
- [x] Rejet des credentials invalides

### ✅ Profil utilisateur
- [x] Récupération du profil
- [x] Statistiques d'utilisation
- [x] Protection par authentification

### ✅ Analyse de sitemap
- [x] Analyse d'un sitemap XML
- [x] Validation de l'URL
- [x] Vérification de l'authentification

### ✅ Gestion des sessions
- [x] Liste des sessions actives
- [x] Invalidation des sessions (logout)

### ✅ Gestion des quotas
- [x] Suivi de l'utilisation
- [x] Limites par plan (Free: 100, Premium: 500, Pro: 1000)
- [x] Incrémentation des compteurs

## 🔧 Prérequis

### Pour les tests Jest
```bash
npm install
```

Les dépendances de test sont :
- `jest` : Framework de test
- `supertest` : Tests HTTP
- `axios` : Client HTTP

### Pour le script bash
```bash
# Installer jq (optionnel, pour un meilleur formatage JSON)
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

## 🚀 Utilisation

### Démarrer le serveur de test

```bash
# Terminal 1 : Démarrer l'API
npm start

# Terminal 2 : Lancer les tests
npm test
```

### Variables d'environnement

Les tests utilisent ces variables par défaut :
```bash
API_URL=http://localhost:9090/api
```

Pour tester en production :
```bash
API_URL=https://perfactlinksv2.artkabis.fr/api npm test
```

## 📊 Résultats attendus

### Tests réussis
```
PASS  tests/api.integration.test.js
  ✓ Health Check (50ms)
  ✓ User Registration (200ms)
  ✓ User Login (150ms)
  ✓ Get User Profile (100ms)
  ✓ Analyze Sitemap (5000ms)
  ✓ Logout (100ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

### Script bash
```
🧪 TEST: 1. Health Check
✅ Health check passed

🧪 TEST: 2. User Registration
✅ User registered successfully

🧪 TEST: 3. User Login
✅ Login successful

[...]

✅ Test Suite Complete!
```

## 🐛 Débogage

### Le serveur ne répond pas
```bash
# Vérifier que le serveur est démarré
curl http://localhost:9090/api/health

# Vérifier les logs
tail -f logs/combined.log
```

### Tests échouent
```bash
# Exécuter un seul test
npm test -- --testNamePattern="Health Check"

# Mode verbose
npm test -- --verbose

# Afficher les erreurs complètes
npm test -- --no-coverage
```

### Problèmes de permissions PostgreSQL
```bash
# Vérifier les permissions
npm run db:diagnose

# Accorder les permissions si nécessaire
npm run db:grant
```

## 📝 Ajouter de nouveaux tests

### Test Jest
```javascript
describe('Nouvelle fonctionnalité', () => {
  test('devrait faire quelque chose', async () => {
    const response = await axios.get(`${API_URL}/nouveau-endpoint`);
    expect(response.status).toBe(200);
  });
});
```

### Test bash
```bash
print_test "11. Nouveau Test"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/nouveau-endpoint")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Test réussi"
else
    print_error "Test échoué"
fi
```

## 🔒 Sécurité

**IMPORTANT** : Les tests créent de vrais utilisateurs dans la base de données !

- Les tests utilisent des emails uniques avec timestamp
- Format : `test-{timestamp}@perfectlinks.fr`
- Les comptes de test peuvent être nettoyés manuellement si nécessaire

### Nettoyer les utilisateurs de test
```sql
DELETE FROM users WHERE email LIKE 'test-%@perfectlinks.fr';
```

## 📚 Documentation

Pour plus d'informations :
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [README principal](../README.md)
