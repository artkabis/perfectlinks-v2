# Tests sur serveurs à ressources limitées (o2switch)

## Problème

Sur les serveurs mutualisés avec ressources limitées (comme o2switch), Jest peut échouer avec l'erreur :

```
Error: spawn /opt/alt/alt-nodejs16/root/usr/bin/node EAGAIN
errno: -11
code: 'EAGAIN'
```

**Cause** : Jest essaie de créer des processus enfants (workers) pour paralléliser les tests, mais le serveur n'a pas assez de ressources (mémoire/processus) disponibles.

## Solution : Configuration Jest optimisée

Le `package.json` a été modifié pour utiliser Jest en **mode séquentiel** (pas de parallélisation) :

```json
"scripts": {
  "test": "jest --runInBand --maxWorkers=1 --forceExit",
  "test:coverage": "jest --runInBand --maxWorkers=1 --coverage --forceExit",
  "test:integration": "jest tests/api.integration.test.js --runInBand --maxWorkers=1 --forceExit"
}
```

### Flags importants :

- `--runInBand` : Exécute tous les tests dans un seul processus (pas de workers)
- `--maxWorkers=1` : Limite à 1 worker maximum
- `--forceExit` : Force la sortie après les tests

## Alternative recommandée : Script bash

Pour les **tests sur serveurs à ressources limitées**, utilisez plutôt le script bash :

```bash
./test-api.sh
```

### Avantages :
- ✅ Pas de processus enfants
- ✅ Utilisation minimale de mémoire
- ✅ Output coloré et lisible
- ✅ Fonctionne sur tous les serveurs

## Commandes disponibles

| Commande | Usage | Ressources |
|----------|-------|------------|
| `./test-api.sh` | **Tests bash** (RECOMMANDÉ pour o2switch) | Faibles |
| `npm test` | Tests Jest séquentiels | Moyennes |
| `npm run test:coverage` | Tests Jest + couverture de code | Élevées |
| `npm run test:integration` | Tests d'intégration uniquement | Moyennes |

## Tests en local vs production

### En local (serveur dédié / haute performance)

Si vous testez en **local** sur un serveur puissant, vous pouvez paralléliser :

```bash
# Configuration haute performance (non recommandé sur o2switch)
jest --maxWorkers=4 --coverage
```

### En production o2switch

**Toujours** utiliser la configuration optimisée :

```bash
# Recommandé sur o2switch
./test-api.sh

# Ou
npm test  # Utilise déjà --runInBand --maxWorkers=1
```

## Monitoring des ressources

### Vérifier l'utilisation mémoire

```bash
# Voir la mémoire disponible
free -m

# Voir les processus Node.js
ps aux | grep node

# Voir les limites de processus
ulimit -a
```

### Limites typiques o2switch

```
Mémoire RAM : ~4 GB partagé entre tous les sites
Processus max : ~100-150 par utilisateur
CPU : Partagé (limité)
```

## Si Jest échoue toujours

### Option 1 : Utiliser uniquement le script bash

Désactivez complètement Jest et utilisez seulement `./test-api.sh` :

```bash
# Supprimer Jest du package.json (optionnel)
npm uninstall jest --save-dev

# Utiliser uniquement le script bash
./test-api.sh
```

### Option 2 : Tester en local, déployer en production

Stratégie recommandée :
1. **Développement local** : Utiliser Jest avec parallélisation
2. **CI/CD** : Tests automatiques sur serveur dédié
3. **Production o2switch** : Utiliser `./test-api.sh` pour vérification ponctuelle

### Option 3 : Tests manuels avec curl

Pour des tests rapides sans script :

```bash
# Health check
curl http://localhost:9090/api/health

# Créer un compte
curl -X POST http://localhost:9090/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# Se connecter
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## Configuration Jest détaillée

Dans `package.json` :

```json
"jest": {
  "testEnvironment": "node",
  "maxWorkers": 1,              // 1 seul worker
  "maxConcurrency": 1,          // 1 test à la fois
  "bail": false,                // Continue même si erreurs
  "detectOpenHandles": false,   // Désactive la détection (économise mémoire)
  "forceExit": true,            // Force la sortie
  "testTimeout": 30000          // 30 secondes par test
}
```

## Dépannage

### Erreur "out of memory"

```bash
# Augmenter la limite mémoire Node.js
node --max-old-space-size=512 node_modules/.bin/jest --runInBand

# Ou modifier le script dans package.json
"test": "node --max-old-space-size=512 node_modules/.bin/jest --runInBand"
```

### Tests trop lents

```bash
# Réduire le timeout
jest --runInBand --maxWorkers=1 --testTimeout=10000

# Tester un seul fichier
jest tests/api.integration.test.js --runInBand
```

### Processus zombie

```bash
# Trouver les processus Node.js
ps aux | grep node

# Tuer les processus zombies
pkill -f "jest"
pkill -f "node.*test"
```

## Recommandations finales

Pour o2switch et serveurs similaires :

1. ✅ **Privilégier** `./test-api.sh` pour les tests réguliers
2. ✅ **Utiliser** `npm test` seulement si nécessaire
3. ❌ **Éviter** `npm run test:coverage` (très gourmand)
4. ✅ **Tester** en local avant de déployer
5. ✅ **Monitorer** l'utilisation ressources pendant les tests

## Ressources

- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Jest CLI Options](https://jestjs.io/docs/cli)
- [o2switch Documentation](https://faq.o2switch.fr/)
