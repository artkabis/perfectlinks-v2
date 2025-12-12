# Node.js 16 Compatibility

## Configuration pour Node.js 16.20.2

Ce projet a été optimisé pour fonctionner avec **Node.js 16.20.2** sur les serveurs o2switch avec ressources limitées.

## Problèmes résolus

### Erreurs initiales avec npm install

```
npm WARN EBADENGINE Unsupported engine {
  package: 'cheerio@1.1.2',
  required: { node: '>=20.18.1' },
  current: { node: 'v16.20.2', npm: '8.19.4' }
}
```

**Cause** : Les versions récentes de certaines dépendances nécessitent Node.js 18 ou 20.

## Versions verrouillées

### Dépendances principales

Toutes les versions sont **verrouillées** (sans `^` ou `~`) pour garantir la compatibilité :

```json
{
  "dependencies": {
    "axios": "0.27.2",              // Compatible Node 16
    "bcryptjs": "2.4.3",            // Compatible Node 16
    "cheerio": "1.0.0-rc.12",       // Compatible Node 16 (pas 1.1.x!)
    "cors": "2.8.5",                // Compatible Node 16
    "express": "4.18.2",            // Compatible Node 16
    "express-rate-limit": "6.11.2", // Compatible Node 16 (pas 7.x!)
    "helmet": "7.1.0",              // Compatible Node 16
    "joi": "17.11.0",               // Compatible Node 16
    "jsonwebtoken": "9.0.2",        // Compatible Node 16
    "pg": "8.11.3",                 // Compatible Node 16
    "winston": "3.11.0",            // Compatible Node 16
    "xml2js": "0.6.2"               // Compatible Node 16
  }
}
```

### Overrides pour dépendances transitives

```json
{
  "overrides": {
    "undici": "4.15.0",             // Optimisation mémoire
    "cheerio": "1.0.0-rc.12",       // Force la version compatible
    "color": "4.2.3",               // Compatible Node 16 (pas 5.x!)
    "color-string": "1.9.1",        // Compatible Node 16 (pas 2.x!)
    "whatwg-encoding": "2.0.0",     // Compatible Node 16 (pas 3.x!)
    "whatwg-mimetype": "3.0.0"      // Compatible Node 16 (pas 4.x!)
  }
}
```

## Downgrades importants

### 1. Cheerio

- ❌ **1.1.x** : Nécessite Node.js >= 20.18.1
- ✅ **1.0.0-rc.12** : Compatible Node.js 16+

### 2. Express Rate Limit

- ❌ **7.x** : Nécessite Node.js >= 18
- ✅ **6.11.2** : Compatible Node.js 16+

### 3. Color (dépendance transitive)

- ❌ **5.x** : Nécessite Node.js >= 18
- ✅ **4.2.3** : Compatible Node.js 16+

### 4. Whatwg-* (dépendances de Cheerio)

- ❌ **whatwg-encoding 3.x** : Nécessite Node.js >= 18
- ✅ **whatwg-encoding 2.0.0** : Compatible Node.js 16+

- ❌ **whatwg-mimetype 4.x** : Nécessite Node.js >= 18
- ✅ **whatwg-mimetype 3.0.0** : Compatible Node.js 16+

## Installation propre

### Supprimer l'ancien node_modules

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller avec les versions verrouillées
npm install
```

### Vérifier qu'il n'y a plus d'avertissements

```bash
npm install 2>&1 | grep "EBADENGINE"
```

Si aucune sortie, c'est bon ! ✅

## Vérification de compatibilité

### Node.js version

```bash
node --version
# Devrait afficher : v16.20.2
```

### npm version

```bash
npm --version
# Devrait afficher : 8.19.4 ou supérieur
```

### Tester l'application

```bash
# Démarrer le serveur
npm start

# Dans un autre terminal, tester
curl http://localhost:9090/api/health
```

## Alternatives si problèmes persistent

### Option 1 : Utiliser nvm pour gérer Node.js 16

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Installer Node.js 16.20.2
nvm install 16.20.2

# Utiliser cette version
nvm use 16.20.2

# Vérifier
node --version
```

### Option 2 : Forcer l'installation (non recommandé)

Si vous obtenez toujours des warnings :

```bash
npm install --force
```

**Note** : `--force` peut installer des versions incompatibles, à utiliser avec précaution.

### Option 3 : Ignorer les avertissements

Les avertissements `EBADENGINE` ne sont que des **warnings**, pas des erreurs. Si l'application fonctionne, vous pouvez les ignorer.

## Optimisations mémoire pour Node.js 16

### Limite mémoire

Le serveur démarre avec une limite mémoire réduite :

```json
{
  "scripts": {
    "start": "node --max-old-space-size=3500 server.js"
  }
}
```

**3500 MB** est optimisé pour o2switch (serveur mutualisé avec ~4 GB partagés).

### Packages légers

- **axios 0.27.2** au lieu de 1.x (plus léger)
- **undici 4.15.0** fixé (évite les versions gourmandes)
- **cheerio 1.0.0-rc.12** au lieu de 1.1.x (plus léger)

## Tests sur Node.js 16

### Tests Jest

```bash
# Tests sans couverture (plus rapide)
npm test

# Tests d'intégration
npm run test:integration
```

### Tests bash (recommandé pour o2switch)

```bash
./test-api.sh
```

## Migration vers Node.js 18+ (futur)

Si vous migrez vers un serveur avec Node.js 18+ :

1. Supprimer les overrides du `package.json`
2. Mettre à jour les versions :
   ```json
   {
     "dependencies": {
       "cheerio": "^1.1.2",
       "express-rate-limit": "^7.1.5"
     },
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```
3. Réinstaller :
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Support

### Node.js 16 EOL

Node.js 16 est en **End of Life** depuis septembre 2023. Pour la production à long terme, envisagez de migrer vers Node.js 18 LTS ou 20 LTS.

### Compatibilité o2switch

o2switch supporte plusieurs versions de Node.js via leurs environnements virtuels. Vous pouvez potentiellement passer à Node.js 18 en contactant le support.

## Ressources

- [Node.js 16 Release Schedule](https://github.com/nodejs/release#release-schedule)
- [npm overrides documentation](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides)
- [Cheerio compatibility](https://github.com/cheeriojs/cheerio#installation)
- [o2switch Node.js documentation](https://faq.o2switch.fr/)
