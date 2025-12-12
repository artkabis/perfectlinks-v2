# Résoudre les problèmes de permissions PostgreSQL

## Problème rencontré

Vous voyez des erreurs comme :
```
droit refusé pour la relation user_usage
droit refusé pour la relation user_sessions
```

**Code d'erreur** : 42501 (insufficient_privilege)

## Cause

L'utilisateur PostgreSQL configuré dans votre `.env` (variable `DB_USER`) n'a pas les permissions nécessaires pour effectuer les opérations UPDATE et DELETE sur les tables.

## Solutions

### 🚀 Solution 1 : Utiliser le script automatique (RECOMMANDÉ)

```bash
npm run db:grant
```

Ce script va :
1. Lire votre configuration `.env`
2. Accorder automatiquement toutes les permissions nécessaires
3. Vérifier que les permissions ont été appliquées

### 📝 Solution 2 : Exécuter le SQL manuellement via phpPgAdmin

1. **Ouvrir phpPgAdmin sur o2switch** :
   - Connectez-vous à votre panneau o2switch
   - Accédez à phpPgAdmin
   - Sélectionnez votre base de données (`nigr8844_perfectlinks_v2`)

2. **Remplacer `VOTRE_UTILISATEUR_DB` dans le fichier** :

   Ouvrez `database/grants.sql` et remplacez **toutes les occurrences** de `VOTRE_UTILISATEUR_DB` par votre nom d'utilisateur réel.

   Pour trouver votre nom d'utilisateur, regardez dans votre fichier `.env` :
   ```
   DB_USER=nigr8844_artkabis_perfectlinksV2
   ```

   Exemple de remplacement :
   ```sql
   -- Avant
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO VOTRE_UTILISATEUR_DB;

   -- Après
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO nigr8844_artkabis_perfectlinksV2;
   ```

3. **Exécuter le SQL** :
   - Dans phpPgAdmin, allez dans l'onglet "SQL"
   - Collez le contenu modifié de `grants.sql`
   - Cliquez sur "Exécuter"

### 🔧 Solution 3 : En ligne de commande SSH

Si vous avez accès SSH sur o2switch :

```bash
# Se connecter à PostgreSQL
psql -U votre_utilisateur -d nigr8844_perfectlinks_v2

# Remplacer VOTRE_UTILISATEUR_DB et exécuter
\i database/grants.sql
```

## Permissions accordées

Le script `grants.sql` accorde les permissions suivantes :

### Sur les tables :
- `SELECT` : Lire les données
- `INSERT` : Insérer de nouvelles lignes
- `UPDATE` : Modifier les données existantes
- `DELETE` : Supprimer des lignes

**Tables concernées** :
- `users`
- `user_sessions`
- `user_usage`
- `usage_logs`

### Sur les séquences :
- `USAGE` : Utiliser la séquence
- `SELECT` : Lire la valeur courante

**Séquences concernées** :
- `users_id_seq`
- `user_sessions_id_seq`
- `user_usage_id_seq`
- `usage_logs_id_seq`

### Sur les fonctions :
- `EXECUTE` : Exécuter les fonctions

**Fonctions concernées** :
- `update_updated_at_column()`
- `initialize_user_usage()`
- `update_usage_limit_on_plan_change()`
- `cleanup_expired_sessions()` ← **Nécessaire pour les tâches planifiées**
- `reset_expired_quotas()` ← **Nécessaire pour les tâches planifiées**

## Vérification

Après avoir accordé les permissions, vérifiez qu'elles sont bien appliquées :

```sql
-- Vérifier les permissions sur une table
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'user_sessions' AND grantee = 'votre_utilisateur';
```

Vous devriez voir :
```
       grantee        | privilege_type
----------------------+---------------
 votre_utilisateur    | SELECT
 votre_utilisateur    | INSERT
 votre_utilisateur    | UPDATE
 votre_utilisateur    | DELETE
```

## Redémarrer l'application

Après avoir accordé les permissions :

```bash
# Arrêter l'application
pkill -f "node server.js"

# Redémarrer
npm start
```

Les erreurs de permissions devraient avoir disparu ! ✅

## Pour les hébergeurs o2switch

Sur o2switch, l'utilisateur de base de données a généralement le format :
```
{prefix}_{nom_compte}_{nom_base}
```

Exemple : `nigr8844_artkabis_perfectlinksV2`

Cet utilisateur doit avoir **tous les privilèges** sur la base de données qu'il possède. Si ce n'est pas le cas, contactez le support o2switch.

## En cas de problème persistant

Si les erreurs de permissions persistent après avoir exécuté le script :

1. **Vérifiez que vous utilisez le bon utilisateur** dans `.env`
2. **Vérifiez que l'utilisateur est propriétaire des tables** :
   ```sql
   SELECT tablename, tableowner
   FROM pg_tables
   WHERE schemaname = 'public';
   ```
3. **Si l'utilisateur n'est pas propriétaire**, changez le propriétaire :
   ```sql
   ALTER TABLE users OWNER TO votre_utilisateur;
   ALTER TABLE user_sessions OWNER TO votre_utilisateur;
   ALTER TABLE user_usage OWNER TO votre_utilisateur;
   ALTER TABLE usage_logs OWNER TO votre_utilisateur;
   ```

## Support

Si vous rencontrez des difficultés, vérifiez les logs de l'application :
```bash
cat logs/combined.log | grep "droit refusé"
```
