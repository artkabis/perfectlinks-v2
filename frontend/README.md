# Perfect Links - Frontend

Interface React pour l'analyse du maillage interne des sites web.

## 🚀 Technologies

- **React 18** - Framework UI
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utilitaire
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - Client HTTP
- **React Hot Toast** - Notifications
- **Lucide React** - Icônes modernes

## 📦 Installation

```bash
# Installer les dépendances
npm install
```

## 🛠️ Développement

```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:5173
```

**Note:** Le backend doit être lancé sur `http://localhost:9090`

## 🏗️ Build

```bash
# Créer un build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure

```
src/
├── assets/
│   └── styles/          # Styles globaux
├── components/
│   ├── analysis/        # Composants d'analyse
│   ├── auth/            # Composants d'authentification
│   ├── common/          # Composants communs
│   ├── dashboard/       # Composants du dashboard
│   └── ui/              # Composants UI réutilisables
├── hooks/               # Custom hooks React
├── pages/               # Pages de l'application
├── services/            # Services API
├── utils/               # Utilitaires
├── App.jsx              # Composant principal
└── main.jsx             # Point d'entrée
```

## 🔑 Fonctionnalités

- ✅ Authentification (Login/Register)
- ✅ Analyse de sitemap.xml
- ✅ Détection automatique via robots.txt
- ✅ Visualisation des pages orphelines
- ✅ Analyse des liens internes
- ✅ Détection des liens externes
- ✅ Détection des liens de conversion (tel:, mailto:)
- ✅ Statistiques en temps réel
- ✅ Interface responsive

## 🌐 Configuration API

Le frontend communique avec le backend via proxy Vite (développement) ou directement (production).

**Développement:** Les requêtes `/api/*` sont automatiquement proxifiées vers `http://localhost:9090`

**Production:** Modifier `VITE_API_URL` dans le fichier `.env`

## 📝 Variables d'environnement

Créer un fichier `.env` à la racine de `/frontend`:

```bash
VITE_API_URL=http://localhost:9090/api
```

## 🎨 Thème & Style

Le design utilise Tailwind CSS avec une palette de couleurs personnalisée :
- Primary: Bleu (#0ea5e9)
- Success: Vert (#22c55e)
- Warning: Orange (#f59e0b)
- Danger: Rouge (#ef4444)

## 👤 Compte de démo

```
Email: demo@test.com
Password: Demo123!
```

## 📄 License

MIT
