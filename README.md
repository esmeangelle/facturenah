# Facturenah

Application web de gestion de factures.



## Installation

### 1. Cloner le projet


git clone https://github.com/tonuser/facturenah.git
cd facturenah


### 2. Installer les dépendances frontend


npm install


### 3. Installer les dépendances backend


cd backend
npm install


### 4. Configurer les variables d'environnement backend

Crée un fichier `backend/.env` :

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=monfacture
JWT_SECRET=monfacture_secret_key_2024
PORT=5000


### 5. Créer la base de données

Ouvre phpMyAdmin et importe le fichier `backend/database.sql`


## Démarrage

### Terminal 1 — Backend


cd backend
node server.js


### Terminal 2 — Frontend


npm run dev


Ouvre `http://localhost:3000` dans votre navigateur.
