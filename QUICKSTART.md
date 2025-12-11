# 🚀 Quick Start Guide - Perfect Links API

Guide de démarrage rapide en 5 minutes pour Perfect Links API.

---

## ⚡ Installation rapide (5 minutes)

### 1. Prérequis

```bash
# Vérifier Node.js (version 14+)
node --version

# Vérifier PostgreSQL (version 12+)
psql --version
```

### 2. Cloner et installer

```bash
# Cloner le projet
git clone https://github.com/artkabis/perfectlinks-v2.git
cd perfectlinks-v2

# Installer les dépendances
npm install
```

### 3. Configurer PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql
```

```sql
-- Créer la base de données et l'utilisateur
CREATE DATABASE perfectlinks_db;
CREATE USER perfectlinks_user WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE perfectlinks_db TO perfectlinks_user;
\q
```

### 4. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec vos valeurs
nano .env
```

**Minimum requis dans .env :**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perfectlinks_db
DB_USER=perfectlinks_user
DB_PASSWORD=yourpassword

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

### 5. Créer les tables

```bash
npm run db:setup
```

### 6. Démarrer le serveur

```bash
npm start
```

**✅ Votre API est prête sur http://localhost:9090** 🎉

---

## 🧪 Test rapide

### 1. Vérifier la santé de l'API

```bash
curl http://localhost:9090/api/health
```

**Réponse attendue :**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

### 2. Créer un utilisateur

```bash
curl -X POST http://localhost:9090/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 3. Valider le compte manuellement (pour le test)

```bash
# Se connecter à PostgreSQL
psql -U perfectlinks_user -d perfectlinks_db

# Valider l'utilisateur
UPDATE users SET email_validated = TRUE, status = 'active' WHERE email = 'test@example.com';
\q
```

### 4. Se connecter

```bash
curl -X POST http://localhost:9090/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Copier l'accessToken de la réponse pour l'étape suivante.**

### 5. Tester l'analyse de sitemap

```bash
curl -X GET "http://localhost:9090/api/sitemap-analysis?url=https://example.com/sitemap.xml" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

---

## 📁 Structure des fichiers clés

```
perfectlinks-v2/
├── .env                    # Configuration (à créer)
├── server.js               # Point d'entrée
├── package.json            # Dépendances
├── database/
│   └── schema.sql          # Schéma PostgreSQL
├── src/
│   ├── controllers/        # Logique des routes
│   ├── models/             # Accès aux données
│   ├── services/           # Services métier
│   └── routes/             # Définition des endpoints
└── scripts/
    ├── setup-database.js   # Installation BDD
    └── check-migration.js  # Vérification
```

---

## 🔧 Commandes essentielles

```bash
# Développement avec auto-reload
npm run dev

# Vérifier l'état de la base de données
npm run migrate:check

# Réinitialiser la base (⚠️ efface tout)
npm run db:reset

# Voir les logs
tail -f logs/combined.log

# Arrêter le serveur
Ctrl + C
```

---

## 📊 Endpoints principaux

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/api/health` | GET | Santé de l'API | Non |
| `/api/register` | POST | Inscription | Non |
| `/api/login` | POST | Connexion | Non |
| `/api/validate-account` | GET | Validation email | Non |
| `/api/me` | GET | Info utilisateur | Oui |
| `/api/sitemap-analysis` | GET | Analyser sitemap | Oui |
| `/api/analysis-history` | GET | Historique | Oui |
| `/api/logout` | POST | Déconnexion | Oui |

---

## 🐛 Problèmes courants

### Erreur : "Cannot connect to database"

**Solution :**
```bash
# Vérifier que PostgreSQL est démarré
sudo service postgresql status

# Vérifier les identifiants dans .env
cat .env | grep DB_
```

### Erreur : "Tables not found"

**Solution :**
```bash
npm run db:setup
```

### Erreur : "Port 9090 already in use"

**Solution :**
```bash
# Changer le port dans .env
echo "PORT=9091" >> .env
```

### Erreur lors du push git (403)

**Solution :**
```bash
# Vérifier que votre branche commence par 'claude/' et termine par le session ID
git branch
```

---

## 📚 Prochaines étapes

1. **📖 Lire la documentation complète** : [README.md](./README.md)
2. **🔍 Voir les exemples d'API** : [API_EXAMPLES.md](./docs/API_EXAMPLES.md)
3. **🚀 Déployer en production** : Section "Déploiement" du README
4. **🧪 Écrire des tests** : [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🆘 Besoin d'aide ?

- 📖 **Documentation** : [README.md](./README.md)
- 🐛 **Reporter un bug** : [GitHub Issues](https://github.com/artkabis/perfectlinks-v2/issues)
- 💬 **Discussion** : [GitHub Discussions](https://github.com/artkabis/perfectlinks-v2/discussions)
- 📧 **Email** : contact@artkabis.fr

---

## 🎯 Configuration email (optionnel)

Pour activer l'envoi d'emails de validation :

```env
# Ajouter dans .env
MAILSENDER_HOST=smtp.gmail.com
MAILSENDER_PORT=587
MAILSENDER_USERNAME=votre-email@gmail.com
MAILSENDER_PASSWORD=votre-mot-de-passe-app
MAILSENDER_FROM=Perfect Links <noreply@perfectlinks.fr>
EMAIL_VALIDATION_URL=http://localhost:9090/api/validate-account
```

> **Note :** Pour Gmail, utilisez un "mot de passe d'application" : https://support.google.com/accounts/answer/185833

---

## ✅ Checklist de démarrage

- [ ] Node.js 14+ installé
- [ ] PostgreSQL 12+ installé et démarré
- [ ] Dépendances npm installées
- [ ] Base de données créée
- [ ] Fichier .env configuré
- [ ] Tables créées (npm run db:setup)
- [ ] Serveur démarré (npm start)
- [ ] API testée (curl health endpoint)
- [ ] Utilisateur de test créé
- [ ] Premier sitemap analysé

---

**Félicitations ! Vous êtes prêt à utiliser Perfect Links API ! 🎉**

Pour aller plus loin, consultez la [documentation complète](./README.md).
