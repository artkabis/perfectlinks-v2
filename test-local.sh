#!/bin/bash

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Test local Perfect Links API${NC}"
echo "================================"

# Variables
API="http://localhost:9090"
EMAIL="test$(date +%s)@local.com"
PASSWORD="TestPass123!"
USERNAME="testuser$(date +%s)"

# Fonction pour afficher les résultats
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    exit 1
  fi
}

# Test 1: Health Check
echo ""
echo -e "${YELLOW}1️⃣ Test Health Check...${NC}"
HEALTH=$(curl -s $API/api/health)
if echo $HEALTH | grep -q "healthy"; then
  print_result 0 "Health check OK"
  echo $HEALTH | jq .
else
  print_result 1 "Health check failed - Is the server running?"
fi

# Test 2: Inscription
echo ""
echo -e "${YELLOW}2️⃣ Inscription utilisateur...${NC}"
REGISTER=$(curl -s -X POST $API/api/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo $REGISTER | grep -q "success"; then
  print_result 0 "Inscription réussie"
  echo $REGISTER | jq .
  USER_ID=$(echo $REGISTER | jq -r '.user.userId')
else
  print_result 1 "Inscription échouée"
fi

# Test 3: Validation du compte
echo ""
echo -e "${YELLOW}3️⃣ Validation manuelle du compte...${NC}"
psql -U perfectlinks_user -d perfectlinks_db -h localhost -c \
  "UPDATE users SET email_validated = TRUE, status = 'active' WHERE user_id = '$USER_ID';" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  print_result 0 "Compte validé"
else
  echo -e "${YELLOW}⚠️  Validation manuelle requise (vérifiez la connexion PostgreSQL)${NC}"
fi

# Test 4: Connexion
echo ""
echo -e "${YELLOW}4️⃣ Connexion...${NC}"
LOGIN=$(curl -s -X POST $API/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo $LOGIN | grep -q "accessToken"; then
  print_result 0 "Connexion réussie"
  echo $LOGIN | jq '{success, tokenType, expiresIn, user: {email, plan}}'
  TOKEN=$(echo $LOGIN | jq -r '.accessToken')
else
  print_result 1 "Connexion échouée"
fi

# Test 5: Get Me
echo ""
echo -e "${YELLOW}5️⃣ Récupération des infos utilisateur...${NC}"
ME=$(curl -s -X GET $API/api/me \
  -H "Authorization: Bearer $TOKEN")

if echo $ME | grep -q "success"; then
  print_result 0 "Récupération des infos OK"
  echo $ME | jq '{user: {email, plan, usage}}'
else
  print_result 1 "Récupération des infos échouée"
fi

# Test 6: Statistiques
echo ""
echo -e "${YELLOW}6️⃣ Récupération des statistiques...${NC}"
STATS=$(curl -s -X GET $API/api/analysis-stats \
  -H "Authorization: Bearer $TOKEN")

if echo $STATS | grep -q "success"; then
  print_result 0 "Statistiques récupérées"
  echo $STATS | jq .
else
  print_result 1 "Récupération des statistiques échouée"
fi

# Test 7: Historique
echo ""
echo -e "${YELLOW}7️⃣ Récupération de l'historique...${NC}"
HISTORY=$(curl -s -X GET $API/api/analysis-history \
  -H "Authorization: Bearer $TOKEN")

if echo $HISTORY | grep -q "success"; then
  print_result 0 "Historique récupéré"
  echo $HISTORY | jq '{success, count}'
else
  print_result 1 "Récupération de l'historique échouée"
fi

# Résumé
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📊 Informations du test :${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}"
echo -e "Username: ${YELLOW}$USERNAME${NC}"
echo -e "User ID: ${YELLOW}$USER_ID${NC}"
echo ""
echo -e "${BLUE}🔑 Access Token (valide 1h) :${NC}"
echo -e "${YELLOW}$TOKEN${NC}"
echo ""
echo -e "${BLUE}💡 Pour tester l'analyse de sitemap :${NC}"
echo -e "${YELLOW}curl -X GET \"$API/api/sitemap-analysis?url=https://www.sitemaps.org/sitemap.xml\" \\${NC}"
echo -e "${YELLOW}  -H \"Authorization: Bearer $TOKEN\"${NC}"
echo ""
