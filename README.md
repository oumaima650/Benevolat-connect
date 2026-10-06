# CountMeIn — Plateforme de Bénévolat

**CountMeIn** est une plateforme web moderne permettant la mise en relation fluide et sécurisée entre **Bénévoles** et **Associations**.

---

## 🛠️ Architecture & Technologies

### **Backend (API REST)**

- **Framework :** Java 21, Spring Boot 3.x (Spring Security, Spring Data JPA, JavaMailSender)
- **Authentification :** Stateless JWT (JSON Web Token), OTP en mémoire (One-Time Password) & reCAPTCHA v2 Google
- **Base de données :** MySQL 8.x (Héritage JPA `JOINED` pour `Utilisateur`, relations `ManyToMany` pour `Domaine`)
- **Configuration :** Variables d'environnement dynamiques via `.env` (`spring-dotenv`)

### **Frontend (Application Web)**

- **Framework :** React 19, TypeScript, Vite
- **Routage & State :** `@tanstack/react-router`
- **UI & Style :** Tailwind CSS v4, Lucide Icons, Shadcn UI
- **Formulaires & Validation :** Zod, ReCAPTCHA React Component

---

## Lancement Rapide

### 1. Démarrer le Backend (Spring Boot)

1. Naviguez dans le dossier `backend` :

   ```bash
   cd backend
   ```
2. Créez votre fichier local `.env` à partir du modèle fourni :

   ```bash
   cp .env.example .env
   ```

   *(Configurez vos identifiants MySQL `DB_USERNAME`, `DB_PASSWORD`, et optionnellement votre serveur SMTP Gmail).*
3. Démarrez le serveur Spring Boot :

   ```bash
   ./mvnw spring-boot:run
   ```

   *L'API REST est accessible sur `http://localhost:8080`.*
   *(Au premier démarrage, `DataInitializer` pré-remplit le catalogue des compétences et domaines partagés).*

---

### 2. Démarrer le Frontend (React + Vite)

1. Naviguez dans le dossier `frontend` :

   ```bash
   cd frontend
   ```
2. Installez les dépendances et démarrez le serveur de développement :

   ```bash
   npm install
   npm run dev
   ```

   *L'application web est disponible sur `http://localhost:5173`.*

---

## Endpoints de l'API REST

### Authentification & Gestion des Comptes (`/api/auth`)

- `POST /api/auth/register` : Inscription d'un nouveau Bénévole ou d'une Association (renvoie un token JWT)
- `POST /api/auth/login` : Connexion utilisateur (renvoie un token JWT)
- `POST /api/auth/send-otp` : Génération et envoi d'un code OTP de vérification par email
- `POST /api/auth/verify-otp` : Validation du code OTP soumis par l'utilisateur
- `POST /api/auth/forgot-password` : Demande de réinitialisation de mot de passe par email
- `POST /api/auth/reset-password` : Validation du nouveau mot de passe via token
- `POST /api/auth/verify-recaptcha` : Vérification du jeton reCAPTCHA v2

### Catalogues publics (`/api`)

- `GET /api/competences` : Liste des compétences pré-enregistrées
- `GET /api/domaines` : Liste des domaines d'activité partagés (bénévoles & associations)Missions (`/api/missions`)
- `GET /api/missions/search?q={keyword}&ville={ville}&domaine={domaine}` : Recherche multi-critères
- `GET /api/missions/featured` : Missions à la une
- `GET /api/missions/{id}` : Détails d'une mission
- `GET /api/missions/cities` : Villes proposant des missions actives
- `GET /api/missions/domaines` : Domaines d'activité disponibles

### Certificats de Bénévolat (`/api/certificates`)

- `GET /api/certificates/verify/{code}` : Vérification publique d'authenticité d'un certificat

### Statistiques (`/api/stats`)

- `GET /api/stats` : Statistiques globales d'impact (heures, missions, bénévoles et associations)

---

## Sécurité & Bonnes Pratiques

- Aucun secret ou mot de passe n'est stocké en clair dans le code. Les clés sensibles résident uniquement dans le fichier local `backend/.env` (ignoré par Git).
- Les mots de passe sont hachés avec la norme **BCrypt**.
- Les jetons d'accès **JWT** sont gérés en mode sans état (*Stateless*) et transmis via l'en-tête HTTP `Authorization: Bearer <token>`.
