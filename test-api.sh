#!/bin/bash
# ==============================================================================
# Perfect Links API - Test Script
# ==============================================================================
# Ce script teste tous les endpoints de l'API Perfect Links v2.0
# ==============================================================================

# Configuration
API_URL="${API_URL:-http://localhost:9090/api}"
TEST_EMAIL="test-$(date +%s)@perfectlinks.fr"
TEST_USERNAME="testuser-$(date +%s)"
TEST_PASSWORD="TestPassword123!"
TEST_SITE_URL="https://example.com/sitemap.xml"

# Couleurs pour le terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_test() {
    echo -e "${YELLOW}🧪 TEST: $1${NC}"
}

# Variables pour stocker les tokens
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""

echo ""
echo "======================================================================"
echo "  🚀 Perfect Links API - Suite de Tests"
echo "======================================================================"
echo ""
print_info "API URL: $API_URL"
print_info "Test Email: $TEST_EMAIL"
print_info "Test Username: $TEST_USERNAME"
echo ""

# ==============================================================================
# TEST 1: Health Check
# ==============================================================================
print_test "1. Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Health check passed"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Health check failed (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi
echo ""

# ==============================================================================
# TEST 2: User Registration
# ==============================================================================
print_test "2. User Registration"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    print_success "User registered successfully"
    USER_ID=$(echo "$BODY" | jq -r '.user.user_id' 2>/dev/null)
    print_info "User ID: $USER_ID"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Registration failed (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi
echo ""

# ==============================================================================
# TEST 3: User Login
# ==============================================================================
print_test "3. User Login"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Login successful"
    ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    REFRESH_TOKEN=$(echo "$BODY" | jq -r '.refreshToken' 2>/dev/null)
    print_info "Access Token: ${ACCESS_TOKEN:0:50}..."
    print_info "Refresh Token: ${REFRESH_TOKEN:0:50}..."
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Login failed (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi
echo ""

# ==============================================================================
# TEST 4: Get User Profile (Protected Route)
# ==============================================================================
print_test "4. Get User Profile (Protected Route)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Profile retrieved successfully"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Failed to get profile (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# TEST 5: Get User Statistics
# ==============================================================================
print_test "5. Get User Statistics"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/statistics" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Statistics retrieved successfully"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Failed to get statistics (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# TEST 6: Analyze Sitemap (Main Feature)
# ==============================================================================
print_test "6. Analyze Sitemap"
print_info "Analyzing: $TEST_SITE_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analyze/sitemap" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"siteUrl\": \"$TEST_SITE_URL\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Sitemap analysis completed"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "429" ]; then
    print_error "Rate limit exceeded (HTTP $HTTP_CODE)"
    echo "$BODY"
else
    print_error "Sitemap analysis failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# TEST 7: Refresh Access Token
# ==============================================================================
print_test "7. Refresh Access Token"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{
        \"refreshToken\": \"$REFRESH_TOKEN\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Token refreshed successfully"
    NEW_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    print_info "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
    # Update the access token for subsequent tests
    ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
else
    print_error "Token refresh failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# TEST 8: Get Active Sessions
# ==============================================================================
print_test "8. Get Active Sessions"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/sessions" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Active sessions retrieved"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Failed to get sessions (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# TEST 9: Logout
# ==============================================================================
print_test "9. Logout"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/logout" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Logout successful"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Logout failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# TEST 10: Access Protected Route After Logout (Should Fail)
# ==============================================================================
print_test "10. Access Protected Route After Logout (Should Fail)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    print_success "Correctly rejected (HTTP $HTTP_CODE)"
else
    print_error "Should have been rejected but got HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "======================================================================"
echo "  ✅ Test Suite Complete!"
echo "======================================================================"
echo ""
print_info "All critical endpoints have been tested"
print_info "Check the output above for any failures"
echo ""
print_info "Test user created:"
echo "  - Email: $TEST_EMAIL"
echo "  - Username: $TEST_USERNAME"
echo "  - Password: $TEST_PASSWORD"
echo ""
