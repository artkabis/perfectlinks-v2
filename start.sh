#!/bin/bash

# Perfect Links v2 - Script de démarrage pour environnement partagé
# Active l'environnement Node.js virtuel et démarre le serveur

# Chemin de l'environnement Node.js virtuel
VENV_PATH="$HOME/nodevenv/perfectlinksv2.artkabis.fr/16"

# Activer l'environnement virtuel Node.js si disponible
if [ -f "$VENV_PATH/bin/activate" ]; then
    echo "Activation de l'environnement Node.js virtuel..."
    source "$VENV_PATH/bin/activate"
fi

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Démarrer le serveur
echo "Démarrage de Perfect Links v2..."
exec node server.js
