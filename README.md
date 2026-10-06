# CountMeIn — Plateforme de Bénévolat Intelligente

**Mise en relation, liste d'attente automatique, matching par IA et certification de l'engagement.**
*Projet WEB (2026–2027) — ENSA Tétouan (Filière Génie Informatique)*
**Réalisé par :** Ameziane Oumaima & Mohito Raihana
**Encadré par :** Pr. EL HAJJAMY OUSSAMA

---

## Présentation & Problématique

Le bénévolat joue un rôle essentiel dans la vie sociale et solidaire. Cependant, la mise en relation entre les associations et les bénévoles reste souvent artisanale (annonces éparpillées, manque de transparence sur l'attribution des places, désistements non gérés, absence de vérification simple des attestations).

**CountMeIn** apporte une solution web complète et automatisée qui va au-delà d'un simple CRUD :

- **Matching Intelligent par IA :** Recommandation personnalisée de missions avec score (0-100) et explications en langage naturel (avec formule de secours : 45% Proximité, 35% Affinité, 20% Besoin).
- **Inscription Équitable & Liste d'Attente Automatique :** Règle du « premier arrivé, premier servi » avec basculement automatique des bénévoles de la liste d'attente vers une place confirmée lors d'un désistement.
- **Renfort Urgent en cours de mission :** Gestion des besoins de dernière minute lorsque la mission est en cours (`RENFORT_URGENT`).
- **Certificats PDF Vérifiables :** Attestations d'engagement générées en PDF et vérifiables publiquement via un code unique non devinable.
- **Automatisation & Rappels n8n :** Workflows n8n déclenchés par le backend (rappels H-24, e-mails d'inscription, messages générés par IA).
- **Gamification & Impact :** Badges (*Première mission*, *Engagé*, *Expert*, *Champion*) et niveaux de progression.
- **Cartographie & Tableaux de bord :** Carte interactive Leaflet/OpenStreetMap et métriques d'impact.

---

## Stack Technique

| Couche                              | Technologie                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| **Langage & Backend**         | Java 21, Spring Boot 3.x (Spring Security, Spring Data JPA, JavaMailSender)                |
| **Sécurité & Auth**         | Stateless JWT (JSON Web Token), OTP en mémoire (RAM), reCAPTCHA v2 Google                 |
| **Base de Données**          | MySQL 8.x (Héritage JPA`JOINED` pour `Utilisateur`, `@ManyToMany` pour `Domaine`) |
| **Frontend**                  | React 19, TypeScript, Vite,`@tanstack/react-router`                                      |
| **Style & UI**                | Tailwind CSS v4, Lucide Icons, Shadcn UI                                                   |
| **Intelligence Artificielle** | API Modèle de langage (LLM) pour scoring et génération de messages                      |
| **Automatisation**            | n8n (workflows Docker, webhooks backend, SMTP)                                             |
| **Cartographie & PDF**        | Leaflet, OpenStreetMap, OpenPDF / iText                                                    |

---

## Architecture en Couches (Backend)

```
[ Client React Frontend (Port 5173) ]
          │  (Requêtes HTTP / API REST)
          ▼
  1. CONTROLLER (REST API - /api/auth, /api/missions, /api/domaines, etc.)
          │  (Validation DTO via @Valid)
          ▼
  2. SERVICE (Logique métier, Sécurité BCrypt/JWT, Matching IA, OTP RAM)
          │  (Contrôle des règles métier RM01 à RM13)
          ▼
  3. REPOSITORY (Spring Data JPA)
          │  (Requêtes SQL optimisées)
          ▼
  4. ENTITY (Utilisateur, Benevole, Association, Domaine, Mission, ImageEvenement)
          │
          ▼
  [ Base de données MySQL (benevolat_db) ]
```

---

## Cycle de Vie d'une Mission

Une mission suit un cycle d'états automatisé encadré par les règles métier :

1. `BROUILLON` : Rédaction par l'association.
2. `PUBLIEE` : Mission publique ouverte aux inscriptions.
3. `COMPLETE` : Nombre maximum de places atteint (inscriptions redirigées vers la liste d'attente).
4. `EN_COURS` : La date de début est atteinte.
5. `RENFORT_URGENT` : Besoin temporaire de bénévoles supplémentaires pendant la mission.
6. `TERMINEE` : La date de fin est dépassée, délivrance des certificats ouverte.
7. `CLOTUREE` : Certificats distribués et mission archivée.
8. `ANNULEE` : Mission annulée (notification envoyée à tous les inscrits via n8n).

---

## Lancement Rapide

### 1. Prérequis

- **Java 21** ou supérieur
- **Node.js 18+** & `npm`
- **MySQL 8.x**

---

### 2. Configuration & Démarrage du Backend

1. Rendez-vous dans le dossier `backend` :

   ```bash
   cd backend
   ```
2. Créez votre fichier local `.env` depuis le modèle :

   ```bash
   cp .env.example .env
   ```

   *(Ajustez vos identifiants MySQL `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` et `MAIL_PASSWORD` dans `.env`).*
3. Démarrez le serveur Spring Boot :

   ```bash
   ./mvnw spring-boot:run
   ```

   *L'API REST s'exécute sur `http://localhost:8080`.*
   *(Au démarrage, `DataInitializer` injecte automatiquement les 12 domaines d'activité et compétences).*

---

### 3. Démarrage du Frontend

1. Rendez-vous dans le dossier `frontend` :

   ```bash
   cd frontend
   ```
2. Installez les dépendances et lancez le serveur Vite :

   ```bash
   npm install
   npm run dev
   ```

   *L'application React est accessible sur `http://localhost:5173`.*

---

## Endpoints Principaux de l'API REST

### Authentification (`/api/auth`)

- `POST /api/auth/register` : Inscription Bénévole ou Association (renvoie un token JWT)
- `POST /api/auth/login` : Connexion utilisateur (renvoie un token JWT)
- `POST /api/auth/send-otp` : Génération et envoi d'un OTP par email (stockage en mémoire RAM)
- `POST /api/auth/verify-otp` : Validation de l'OTP
- `POST /api/auth/forgot-password` & `/reset-password` : Réinitialisation sécurisée du mot de passe
- `POST /api/auth/verify-recaptcha` : Vérification du captcha Google v2

### Catalogues & Données Partagées (`/api`)

- `GET /api/domaines` : Liste des 12 domaines d'activité partagés (badges UI)
- `GET /api/competences` : Liste des compétences bénévoles

### Missions (`/api/missions`)

- `GET /api/missions/search?q={keyword}&ville={ville}&domaine={domaine}` : Recherche multi-critères
- `GET /api/missions/featured` : Missions à la une
- `GET /api/missions/{id}` : Détails d'une mission
- `POST /api/missions/{id}/subscribe` : Inscription ou mise en liste d'attente
- `POST /api/missions/{id}/cancel` : Annulation d'inscription par le bénévole

### Certificats (`/api/certificates`)

- `POST /api/certificates/generate` : Délivrance d'un certificat PDF par l'association
- `GET /api/certificates/verify/{code}` : Vérification publique d'authenticité par code unique

### Statistiques & Impact (`/api/stats`)

- `GET /api/stats` : Statistiques d'impact (missions, heures, bénévoles, associations)

---


## Sécurité & Conformité

- **Isolation des Secrets :** Aucun mot de passe ni clé API en clair dans le dépôt Git (`.env` exclu via `.gitignore`).
- **Protection des Mots de Passe :** Hachage fort **BCrypt**.
- **Accès API :** Tokens **JWT** avec validation automatique par filtre Spring Security.
