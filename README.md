# Benevolat-connect

Plateforme de mise en relation entre bénévoles et associations. Permet de publier des missions, postuler, suivre les heures et générer des certificats PDF valorisables.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 / Vite / TypeScript / Tailwind CSS |
| Backend | Spring Boot 4.1.1 (Java 21, Maven) |
| Base de données | MySQL 8 |
| Automatisation | n8n (webhooks, rappels email) |

---

## Prérequis

- **Node.js 18+** (avec `npm`) ou **Bun** – pour exécuter le frontend React
- **JDK 21** – [Télécharger](https://adoptium.net/)
- **MySQL 8** – serveur local sur le port 3306
- **IntelliJ IDEA** ou **VS Code**

---

## Structure du dépôt

```
benevolat-connect/
├── backend/                    # Projet Spring Boot Maven
│   └── src/main/java/com/benevolat/plateformebenevolat/
│       ├── config/             # CORS (localhost:5173 autorisé), sécurité
│       ├── controller/         # Endpoints REST
│       ├── service/            # Logique métier
│       ├── repository/         # Accès base de données (JPA)
│       ├── entity/             # Entités JPA (tables MySQL)
│       ├── dto/                # Objets de transfert
│       └── exception/          # Exceptions personnalisées
├── frontend/                   # Application Frontend React (Vite)
│   ├── src/
│   │   ├── components/         # Composants React (site UI, Header, Hero, Missions, etc.)
│   │   ├── services/           # Service API (`api.ts` pour appeler Spring Boot)
│   │   ├── assets/             # Images et logos
│   │   ├── index.css           # Styles Tailwind CSS
│   │   └── main.tsx            # Point d'entrée React
│   ├── public/                 # Assets statiques publics
│   ├── package.json            # Scripts Vite et dépendances
│   ├── vite.config.ts          # Configuration Vite
│   └── index.html              # HTML de l'application SPA
├── database/
│   ├── schema.sql              # Création de la base de données
│   └── data.sql                # Données initiales (seed)
└── README.md
```

---

## Lancement

### 1. Préparer la base de données

```bash
mysql -u root -p < database/schema.sql
```

### 2. Démarrer le backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

> Le serveur API démarrera sur `http://localhost:8080/api`

### 3. Démarrer le frontend (React + Vite)

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

> L'application frontend démarrera sur `http://localhost:5173`

---

## Variable d'environnement (Backend)

Le mot de passe MySQL est lu depuis la variable `DB_PASSWORD`.

```bash
# Windows (PowerShell)
$env:DB_PASSWORD = "votre_mot_de_passe"
mvn spring-boot:run

# Windows (CMD)
set DB_PASSWORD=votre_mot_de_passe
mvn spring-boot:run
```

Si la variable n'est pas définie, le mot de passe est vide par défaut (`root` sans mot de passe).

---

## Test rapide de l'API Backend

Une fois le backend démarré : [http://localhost:8080/api/health](http://localhost:8080/api/health)

Réponse attendue :
```json
{ "status": "OK", "message": "API Bénévolat opérationnelle" }
```
