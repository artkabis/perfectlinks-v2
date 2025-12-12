-- ============================================================================
-- Perfect Links API - PostgreSQL Permissions (GRANTS)
-- ============================================================================
--
-- Ce fichier accorde toutes les permissions nécessaires à l'utilisateur
-- de l'application pour qu'il puisse effectuer toutes les opérations.
--
-- IMPORTANT: Remplacez 'VOTRE_UTILISATEUR_DB' par le nom réel de votre
-- utilisateur PostgreSQL (celui défini dans DB_USER de votre .env)
--
-- Exemples d'utilisateurs o2switch:
--   - nigr8844_artkabis_perfectlinksV2
--   - votre_prefix_nomutilisateur
--
-- Pour o2switch, l'utilisateur est généralement le même que DB_NAME
-- ============================================================================

-- ATTENTION: Remplacez 'VOTRE_UTILISATEUR_DB' avant d'exécuter !
-- Vous pouvez trouver le nom dans votre fichier .env (variable DB_USER)

-- ============================================================================
-- ACCORDER LES PERMISSIONS SUR TOUTES LES TABLES
-- ============================================================================

-- Permissions complètes sur la table users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO VOTRE_UTILISATEUR_DB;

-- Permissions complètes sur la table user_sessions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_sessions TO VOTRE_UTILISATEUR_DB;

-- Permissions complètes sur la table user_usage
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_usage TO VOTRE_UTILISATEUR_DB;

-- Permissions complètes sur la table usage_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usage_logs TO VOTRE_UTILISATEUR_DB;

-- ============================================================================
-- ACCORDER LES PERMISSIONS SUR LES SÉQUENCES
-- ============================================================================
-- Les séquences sont utilisées pour les colonnes SERIAL (id auto-incrémenté)

GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO VOTRE_UTILISATEUR_DB;
GRANT USAGE, SELECT ON SEQUENCE user_sessions_id_seq TO VOTRE_UTILISATEUR_DB;
GRANT USAGE, SELECT ON SEQUENCE user_usage_id_seq TO VOTRE_UTILISATEUR_DB;
GRANT USAGE, SELECT ON SEQUENCE usage_logs_id_seq TO VOTRE_UTILISATEUR_DB;

-- ============================================================================
-- ACCORDER LES PERMISSIONS SUR LES FONCTIONS
-- ============================================================================
-- Permet à l'utilisateur d'exécuter les fonctions de nettoyage et de gestion

GRANT EXECUTE ON FUNCTION update_updated_at_column() TO VOTRE_UTILISATEUR_DB;
GRANT EXECUTE ON FUNCTION initialize_user_usage() TO VOTRE_UTILISATEUR_DB;
GRANT EXECUTE ON FUNCTION update_usage_limit_on_plan_change() TO VOTRE_UTILISATEUR_DB;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO VOTRE_UTILISATEUR_DB;
GRANT EXECUTE ON FUNCTION reset_expired_quotas() TO VOTRE_UTILISATEUR_DB;

-- ============================================================================
-- ACCORDER LES PERMISSIONS SUR LE SCHÉMA PUBLIC
-- ============================================================================
-- Permet à l'utilisateur de créer des objets si nécessaire

GRANT USAGE ON SCHEMA public TO VOTRE_UTILISATEUR_DB;
GRANT CREATE ON SCHEMA public TO VOTRE_UTILISATEUR_DB;

-- ============================================================================
-- PERMISSIONS PAR DÉFAUT POUR LES FUTURS OBJETS
-- ============================================================================
-- Ces permissions s'appliqueront automatiquement aux nouvelles tables/séquences

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO VOTRE_UTILISATEUR_DB;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO VOTRE_UTILISATEUR_DB;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO VOTRE_UTILISATEUR_DB;

-- ============================================================================
-- VÉRIFICATION DES PERMISSIONS
-- ============================================================================
-- Pour vérifier que les permissions ont été accordées, exécutez :
--
-- SELECT grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_name = 'users';
--
-- SELECT grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_name = 'user_sessions';
-- ============================================================================
