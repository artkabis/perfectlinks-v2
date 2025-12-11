# 📡 Exemples d'utilisation de l'API

Ce document contient des exemples pratiques d'utilisation de l'API Perfect Links.

---

## 🔐 Authentification

### 1. Inscription d'un nouvel utilisateur

```bash
curl -X POST http://localhost:9090/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to validate your account.",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "free",
    "status": "pending"
  }
}
```

### 2. Validation du compte (via email)

L'utilisateur reçoit un email avec un lien de validation :
```
https://perfectlinksapi.artkabis.fr/api/validate-account?token=abc123...&userid=550e8400...
```

Ou via curl :
```bash
curl -X GET "http://localhost:9090/api/validate-account?token=abc123...&userid=550e8400..."
```

**Réponse :**
```json
{
  "success": true,
  "message": "Account validated successfully. You can now log in.",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "free"
  }
}
```

### 3. Connexion

```bash
curl -X POST http://localhost:9090/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h",
  "tokenType": "Bearer",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "free",
    "status": "active"
  },
  "session": {
    "sessionId": "660e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Rafraîchir le token

```bash
curl -X POST http://localhost:9090/api/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h",
  "tokenType": "Bearer"
}
```

### 5. Obtenir les informations de l'utilisateur connecté

```bash
curl -X GET http://localhost:9090/api/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "success": true,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "free",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "usage": {
      "requestsMade": 25,
      "requestsLimit": 100,
      "remaining": 75,
      "periodStart": "2024-01-01T00:00:00.000Z",
      "periodEnd": "2024-01-31T00:00:00.000Z"
    },
    "stats": {
      "totalRequests": 150,
      "lastRequest": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 6. Déconnexion

```bash
curl -X POST http://localhost:9090/api/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🔍 Analyse de sitemap

### 1. Analyser un sitemap

```bash
curl -X GET "http://localhost:9090/api/sitemap-analysis?url=https://example.com/sitemap.xml" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
[{
  "datas": {
    "links": [
      "https://example.com/page1",
      "https://example.com/page2",
      "https://example.com/page3"
    ],
    "internalLinks": [
      {
        "link": "https://example.com/page1",
        "statusCode": 200,
        "internalLinks": [
          {
            "url": "https://example.com/page2",
            "anchor": "Link to page 2",
            "status": 200,
            "redirectUrl": null
          },
          {
            "url": "https://example.com/page3",
            "anchor": "Link to page 3",
            "status": 200,
            "redirectUrl": null
          }
        ]
      },
      {
        "link": "https://example.com/page2",
        "statusCode": 200,
        "internalLinks": [
          {
            "url": "https://example.com/page1",
            "anchor": "Back to page 1",
            "status": 200,
            "redirectUrl": null
          }
        ]
      },
      {
        "link": "https://example.com/page3",
        "statusCode": 404,
        "internalLinks": []
      }
    ],
    "missingLinks": [
      "https://example.com/page3"
    ]
  },
  "meta": {
    "totalUrls": 3,
    "totalInternalLinks": 3,
    "orphanLinks": 1,
    "duration": "5234ms"
  }
}]
```

**Headers de quota dans la réponse :**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 74
X-RateLimit-Used: 26
X-RateLimit-Reset: 1705843200000
```

### 2. Cas d'erreurs

#### Quota dépassé (429)
```json
{
  "success": false,
  "error": "Quota exceeded",
  "message": "You have reached your monthly request limit",
  "quota": {
    "used": 100,
    "limit": 100,
    "remaining": 0,
    "periodEnd": "2024-01-31T00:00:00.000Z"
  }
}
```

#### URL invalide (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "url",
      "message": "Invalid URL format"
    }
  ]
}
```

#### Token expiré (401)
```json
{
  "success": false,
  "error": "Invalid token",
  "message": "Token is invalid or expired"
}
```

---

## 📊 Historique et statistiques

### 1. Obtenir l'historique des analyses

```bash
curl -X GET "http://localhost:9090/api/analysis-history?limit=10&offset=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 123,
      "siteUrl": "https://example.com/sitemap.xml",
      "statusCode": 200,
      "duration": 5234,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "error": null
    },
    {
      "id": 122,
      "siteUrl": "https://example2.com/sitemap.xml",
      "statusCode": 500,
      "duration": 2100,
      "timestamp": "2024-01-15T09:15:00.000Z",
      "error": "Failed to parse sitemap"
    }
  ]
}
```

### 2. Obtenir les statistiques d'analyse

```bash
curl -X GET "http://localhost:9090/api/analysis-stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 150,
    "successfulRequests": 142,
    "failedRequests": 8,
    "averageDuration": 4523,
    "maxDuration": 15234,
    "firstRequest": "2023-12-01T00:00:00.000Z",
    "lastRequest": "2024-01-15T10:30:00.000Z",
    "uniqueSitesAnalyzed": 25
  }
}
```

---

## 🔧 Exemples avec JavaScript (Fetch API)

### Inscription et connexion

```javascript
// Inscription
async function register(username, email, password) {
  const response = await fetch('http://localhost:9090/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  return data;
}

// Connexion
async function login(email, password) {
  const response = await fetch('http://localhost:9090/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  // Stocker les tokens
  if (data.success) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  return data;
}

// Exemple d'utilisation
register('johndoe', 'john@example.com', 'SecurePass123!')
  .then(result => console.log('Registration:', result));

login('john@example.com', 'SecurePass123!')
  .then(result => console.log('Login:', result));
```

### Analyse de sitemap avec gestion d'erreurs

```javascript
async function analyzeSitemap(sitemapUrl) {
  const token = localStorage.getItem('accessToken');

  try {
    const response = await fetch(
      `http://localhost:9090/api/sitemap-analysis?url=${encodeURIComponent(sitemapUrl)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    // Vérifier les headers de quota
    const quotaLimit = response.headers.get('X-RateLimit-Limit');
    const quotaRemaining = response.headers.get('X-RateLimit-Remaining');
    console.log(`Quota: ${quotaRemaining}/${quotaLimit}`);

    const data = await response.json();

    if (!response.ok) {
      // Gérer les erreurs
      if (response.status === 401) {
        // Token expiré, essayer de rafraîchir
        await refreshAccessToken();
        return analyzeSitemap(sitemapUrl); // Réessayer
      } else if (response.status === 429) {
        throw new Error('Quota exceeded');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    }

    return data[0]; // Retourner le résultat
  } catch (error) {
    console.error('Error analyzing sitemap:', error);
    throw error;
  }
}

// Rafraîchir le token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:9090/api/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('accessToken', data.accessToken);
  } else {
    // Refresh token expiré, rediriger vers login
    window.location.href = '/login';
  }
}

// Exemple d'utilisation
analyzeSitemap('https://example.com/sitemap.xml')
  .then(result => {
    console.log('Analysis result:', result);
    console.log('Total URLs:', result.meta.totalUrls);
    console.log('Orphan links:', result.datas.missingLinks);
  })
  .catch(error => console.error(error));
```

---

## 🐍 Exemples avec Python (requests)

```python
import requests
import json

BASE_URL = 'http://localhost:9090'

class PerfectLinksClient:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None

    def register(self, username, email, password):
        """Inscription d'un nouvel utilisateur"""
        response = requests.post(
            f'{BASE_URL}/api/register',
            json={
                'username': username,
                'email': email,
                'password': password
            }
        )
        return response.json()

    def login(self, email, password):
        """Connexion"""
        response = requests.post(
            f'{BASE_URL}/api/login',
            json={
                'email': email,
                'password': password
            }
        )
        data = response.json()

        if data.get('success'):
            self.access_token = data['accessToken']
            self.refresh_token = data['refreshToken']

        return data

    def analyze_sitemap(self, sitemap_url):
        """Analyser un sitemap"""
        if not self.access_token:
            raise Exception('Not authenticated')

        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }

        response = requests.get(
            f'{BASE_URL}/api/sitemap-analysis',
            headers=headers,
            params={'url': sitemap_url}
        )

        # Vérifier les quotas
        quota_remaining = response.headers.get('X-RateLimit-Remaining')
        quota_limit = response.headers.get('X-RateLimit-Limit')
        print(f'Quota: {quota_remaining}/{quota_limit}')

        if response.status_code == 401:
            # Token expiré, rafraîchir
            self.refresh_access_token()
            return self.analyze_sitemap(sitemap_url)

        return response.json()

    def refresh_access_token(self):
        """Rafraîchir le token d'accès"""
        response = requests.post(
            f'{BASE_URL}/api/refresh-token',
            json={'refreshToken': self.refresh_token}
        )
        data = response.json()

        if data.get('success'):
            self.access_token = data['accessToken']

        return data

# Utilisation
client = PerfectLinksClient()

# Connexion
result = client.login('john@example.com', 'SecurePass123!')
print('Login:', result)

# Analyse
analysis = client.analyze_sitemap('https://example.com/sitemap.xml')
print('Analysis:', json.dumps(analysis, indent=2))
```

---

## 📝 Notes importantes

### Gestion des tokens
- Les **access tokens** expirent après 1 heure par défaut
- Les **refresh tokens** expirent après 7 jours par défaut
- Utilisez le refresh token pour obtenir un nouvel access token
- Stockez les tokens de manière sécurisée (jamais en localStorage en production)

### Quotas
- Les quotas sont vérifiés avant chaque analyse
- Les headers `X-RateLimit-*` indiquent l'état du quota
- Quota réinitialisé automatiquement tous les 30 jours
- Plans disponibles : Free (100), Premium (500), Pro (1000)

### Bonnes pratiques
- Toujours gérer les erreurs 401 (token expiré)
- Implémenter un retry avec refresh token
- Vérifier les quotas avant les opérations lourdes
- Logger les erreurs pour le debugging

---

**Pour plus d'exemples, consultez la [documentation complète](../README.md)**
