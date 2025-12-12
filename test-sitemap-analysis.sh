#!/bin/bash

# =========================================================================
# Script de test pour l'analyse de sitemap - Perfect Links API v2.0
# =========================================================================
# Ce script teste l'endpoint /api/sitemap-analysis avec l'ordre correct
# des middlewares et le paramètre ?url= (pas ?siteUrl=)
# =========================================================================

# =========================================================================
# 1. PRÉPARATION DE L'ENVIRONNEMENT ET DÉFINITION DES VARIABLES
#    Assurez-vous que l'application Node.js est déjà lancée via `npm start`
# =========================================================================

# Activation de l'environnement virtuel (selon votre chemin cPanel/Node v16)
# IMPORTANT: Adaptez ce chemin selon votre configuration o2switch
source /home/nigr8844/nodevenv/perfectlinksv2.artkabis.fr/16/bin/activate

# Navigation vers le répertoire racine de l'application
cd /home/nigr8844/perfectlinksv2.artkabis.fr

# =========================================================================
# 2. CONNEXION ET EXTRACTION DU TOKEN
# =========================================================================

echo "🔐 1/4 Connexion..."
RESPONSE=$(curl -s -X POST http://localhost:9090/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"Demo123!"}')

# Extraction du token
TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec de connexion. Réponse du serveur :"
  echo $RESPONSE
  exit 1
fi
echo "✅ Connecté ! Token: ${TOKEN:0:50}..."

# =========================================================================
# 3. TEST DE L'ANALYSE DU SITEMAP (avec le nouvel ordre et ?url=)
# =========================================================================

echo ""
echo "🔍 2/4 Analyse du sitemap (Testing validateUrl)..."
curl -s -i -X GET "http://localhost:9090/api/sitemap-analysis?url=https://www.huetpeinture.com/sitemap.xml" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# =========================================================================
# 4. VÉRIFICATION DE L'USAGE ET DES STATISTIQUES
# =========================================================================

echo ""
echo "📊 3/4 Statistiques d'utilisation (Vérification de l'incrémentation):"
curl -s -X GET "http://localhost:9090/api/me" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"requestsMade":[0-9]*'

# =========================================================================
# 5. TEST DE DÉCONNEXION
# =========================================================================

echo ""
echo "🚪 4/4 Déconnexion..."
curl -s -X POST "http://localhost:9090/api/logout" \
  -H "Authorization: Bearer $TOKEN"
echo "✅ Déconnecté."

echo ""
echo "========================================="
echo "✅ Test terminé avec succès !"
echo "========================================="
