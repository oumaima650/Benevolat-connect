# VolunteerConnect 

Plateforme  de mise en relation entre bénévoles et associations. Permet de publier des missions, postuler, suivre les heures et générer des certificats PDF valorisables.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | HTML5 / CSS3 / JavaScript ES6+ |
| Backend | Spring Boot 4.1.1 (Java 21, Maven) |
| Base de données | MySQL 8 |
| Automatisation | n8n (webhooks, rappels email) |

---

## Prérequis

- **JDK 21** – [Télécharger](https://adoptium.net/)
- **MySQL 8** – serveur local sur le port 3306
- **IntelliJ IDEA** (ou VS Code avec extension Spring Boot)
- **Extension Live Server** (VS Code) pour le frontend

---

## Structure du dépôt

```
benevolat-connect/
├── backend/                    # Projet Spring Boot Maven
│   └── src/main/java/com/benevolat/plateformebenevolat/
│       ├── config/             # CORS, sécurité (JWT en V1)
│       ├── controller/         # Endpoints REST
│       ├── service/            # Logique métier
│       ├── repository/         # Accès base de données (JPA)
│       ├── entity/             # Entités JPA (tables MySQL)
│       ├── dto/                # Objets de transfert
│       └── exception/          # Exceptions personnalisées
├── frontend/                   # Interface web
│   ├── index.html              # Accueil
│   ├── css/style.css           # Styles globaux
│   ├── js/
│   │   ├── config.js           # URL de l'API
│   │   └── app.js              # Logique principale
│   ├── pages/                  # Pages secondaires
│   │   
│   └── assets/images/
├── docs/
│   ├── cahier-des-charges.md   # Objectifs, acteurs, règles métier
│   └── architecture.md         # Diagramme et explication des couches
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

### 2. Démarrer le backend

```bash
cd backend
mvn spring-boot:run
```

> Le serveur démarre sur `http://localhost:8080`

### 3. Démarrer le frontend

Ouvrez `frontend/index.html` avec **Live Server** (port 5500) dans VS Code,
ou via le serveur intégré d'IntelliJ IDEA (port 63342).

---

## Variable d'environnement

Le mot de passe MySQL est lu depuis la variable `DB_PASSWORD`.

```bash
# Windows (PowerShell)
$env:DB_PASSWORD = "votre_mot_de_passe"
mvn spring-boot:run

# Windows (CMD)
set DB_PASSWORD=votre_mot_de_passe
mvn spring-boot:run
```

Si la variable n'est pas définie, le mot de passe est vide (compte root sans mot de passe).

---

## Test rapide

Une fois le backend démarré : [http://localhost:8080/api/health](http://localhost:8080/api/health)

Réponse attendue :
```json
{ "status": "OK", "message": "API Bénévolat opérationnelle" }
```
