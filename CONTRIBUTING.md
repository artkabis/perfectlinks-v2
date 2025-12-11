# 🤝 Guide de contribution

Merci de votre intérêt pour Perfect Links API ! Ce guide vous aidera à contribuer au projet.

---

## 📋 Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Setup de développement](#setup-de-développement)
4. [Standards de code](#standards-de-code)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Reporting de bugs](#reporting-de-bugs)

---

## 📜 Code de conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Faites preuve d'empathie envers les autres membres

---

## 🚀 Comment contribuer

### Types de contributions acceptées

- 🐛 **Corrections de bugs** : Résolution de problèmes existants
- ✨ **Nouvelles fonctionnalités** : Ajout de nouvelles capacités
- 📝 **Documentation** : Amélioration de la documentation
- 🎨 **Code quality** : Refactoring, optimisations
- 🧪 **Tests** : Ajout de tests unitaires et d'intégration
- 🌐 **Traductions** : Traduction de la documentation

### Avant de commencer

1. Vérifiez les [issues existantes](https://github.com/artkabis/perfectlinks-v2/issues)
2. Ouvrez une issue pour discuter des changements majeurs
3. Assignez-vous l'issue si vous souhaitez travailler dessus

---

## 🛠️ Setup de développement

### Prérequis

- Node.js 14+
- PostgreSQL 12+
- Git

### Installation

```bash
# 1. Fork et clone le repository
git clone https://github.com/votre-username/perfectlinks-v2.git
cd perfectlinks-v2

# 2. Créer une branche
git checkout -b feature/ma-nouvelle-fonctionnalite

# 3. Installer les dépendances
npm install

# 4. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 5. Configurer la base de données
npm run db:setup

# 6. Lancer en mode développement
npm run dev
```

### Structure du projet

```
perfectlinks-v2/
├── config/           # Configuration (DB, etc.)
├── database/         # Schémas et migrations
├── scripts/          # Scripts utilitaires
├── src/
│   ├── controllers/  # Logique des routes
│   ├── middleware/   # Middleware Express
│   ├── models/       # Modèles de données
│   ├── routes/       # Définition des routes
│   ├── services/     # Logique métier
│   └── utils/        # Utilitaires
├── tests/            # Tests
└── docs/             # Documentation
```

---

## 💻 Standards de code

### Style de code

Nous utilisons ESLint et Prettier pour maintenir la cohérence :

```bash
# Vérifier le code
npm run lint

# Corriger automatiquement
npm run lint:fix

# Formater le code
npm run format
```

### Conventions de nommage

- **Variables et fonctions** : camelCase (`getUserById`, `accessToken`)
- **Constantes** : UPPER_SNAKE_CASE (`JWT_SECRET`, `MAX_RETRIES`)
- **Classes** : PascalCase (`User`, `AuthService`)
- **Fichiers** : camelCase (`authController.js`, `emailService.js`)

### Commentaires

```javascript
/**
 * Description de la fonction
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function getUserById(userId, options) {
  // Implémentation
}
```

### Gestion d'erreurs

```javascript
try {
  // Code
} catch (error) {
  logger.error('Description de l\'erreur:', error);
  throw new ApiError(500, 'Message utilisateur friendly');
}
```

---

## 🧪 Tests

### Écrire des tests

Tous les nouveaux code doivent inclure des tests :

```javascript
describe('Feature description', () => {
  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Lancer les tests

```bash
# Tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Avec couverture
npm test -- --coverage
```

### Couverture minimale

- Nouvelles fonctionnalités : 80% minimum
- Corrections de bugs : ajouter un test reproduisant le bug

---

## 📤 Processus de Pull Request

### 1. Préparer votre PR

```bash
# S'assurer que votre branche est à jour
git checkout main
git pull origin main
git checkout feature/ma-branche
git rebase main

# Vérifier que tout fonctionne
npm run lint
npm test
npm start
```

### 2. Commits

Utilisez des messages de commit clairs :

```
type(scope): description courte

Description détaillée si nécessaire

Refs: #123
```

**Types :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, points-virgules
- `refactor`: Refactoring de code
- `test`: Ajout de tests
- `chore`: Maintenance

**Exemples :**
```
feat(auth): add password reset functionality
fix(quota): correct quota calculation for premium users
docs(api): update authentication examples
```

### 3. Ouvrir la Pull Request

1. Poussez votre branche : `git push origin feature/ma-branche`
2. Ouvrez une PR sur GitHub
3. Remplissez le template de PR
4. Liez les issues concernées

### 4. Template de PR

```markdown
## Description
[Description de vos changements]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai ajouté des tests
- [ ] Tous les tests passent
- [ ] J'ai mis à jour la documentation
- [ ] J'ai vérifié mes changements localement

## Tests
[Description de comment tester vos changements]

## Screenshots (si applicable)
[Captures d'écran]
```

### 5. Review

- Répondez aux commentaires de review
- Faites les changements demandés
- Re-poussez votre branche
- La PR sera mergée une fois approuvée

---

## 🐛 Reporting de bugs

### Avant de rapporter un bug

1. Vérifiez les [issues existantes](https://github.com/artkabis/perfectlinks-v2/issues)
2. Testez avec la dernière version
3. Vérifiez votre configuration

### Template de bug report

```markdown
## Description du bug
[Description claire et concise]

## Étapes pour reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

## Comportement attendu
[Ce qui devrait se passer]

## Comportement actuel
[Ce qui se passe réellement]

## Screenshots
[Si applicable]

## Environnement
- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. v18.0.0]
- PostgreSQL: [e.g. v14.0]
- Version: [e.g. v2.0.0]

## Logs
```
[Logs pertinents]
```

## Informations supplémentaires
[Tout autre contexte utile]
```

---

## 💡 Demande de fonctionnalité

### Template de feature request

```markdown
## Description de la fonctionnalité
[Description claire et concise]

## Problème résolu
[Quel problème cette fonctionnalité résout-elle ?]

## Solution proposée
[Comment devrait-elle fonctionner ?]

## Alternatives considérées
[Autres approches envisagées]

## Informations supplémentaires
[Contexte, mockups, exemples]
```

---

## 📚 Ressources

### Documentation
- [README.md](../README.md) - Guide principal
- [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) - Guide de migration
- [API_EXAMPLES.md](./docs/API_EXAMPLES.md) - Exemples d'API

### Outils
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Formatage
- [Jest](https://jestjs.io/) - Testing
- [Supertest](https://github.com/visionmedia/supertest) - API testing

---

## 🎯 Premiers pas

Vous ne savez pas par où commencer ? Regardez les issues étiquetées :

- [`good first issue`](https://github.com/artkabis/perfectlinks-v2/labels/good%20first%20issue) - Bon pour débuter
- [`help wanted`](https://github.com/artkabis/perfectlinks-v2/labels/help%20wanted) - Aide bienvenue
- [`documentation`](https://github.com/artkabis/perfectlinks-v2/labels/documentation) - Amélioration de la doc

---

## 📞 Questions ?

- 💬 Ouvrez une [Discussion](https://github.com/artkabis/perfectlinks-v2/discussions)
- 📧 Email : contact@artkabis.fr
- 🐛 Issues : [GitHub Issues](https://github.com/artkabis/perfectlinks-v2/issues)

---

## 🙏 Remerciements

Merci à tous les contributeurs qui aident à améliorer Perfect Links API !

---

**Happy coding! 🚀**
