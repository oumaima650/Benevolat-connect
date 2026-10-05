# CountMeIn — Plateforme de Bénévolat

Application web pour la mise en relation de bénévoles et d'associations.

---

## Périmètre Module Personne B (Landing Page, Missions & Certificats)

Ce module gère le catalogue public de missions, la recherche multi-critères, le détail des missions avec calcul des places restantes / liste d'attente, les statistiques d'impact ainsi que la vérification publique d'authenticité des certificats de bénévolat.

> **Note :** Le module d'authentification (Spring Security, JWT, endpoints `/api/auth/*`, formulaires de login/register) est géré séparément par la Personne A. Les boutons d'orientation redirigent vers `/login?role=...` ou `/register?role=...`.

---

## 🚀 Lancement Rapide

### 1. Démarrer le Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```
L'API Spring Boot s'exécute sur `http://localhost:8080`.
Des données de démonstration sont injectées automatiquement au premier démarrage (`DataSeeder`) : 4 associations, 6 bénévoles, 10 missions (dont certaines complètes) et 4 certificats.

### 2. Démarrer le Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
Le serveur frontend s'exécute sur `http://localhost:5173`.

---

## 📡 Endpoints de l'API (Publics)

### Missions
- `GET /api/missions/search?q={keyword}&ville={ville}&domaine={domaine}` : Recherche multi-critères
- `GET /api/missions/featured` : 4 missions à la une
- `GET /api/missions/{id}` : Détails d'une mission
- `GET /api/missions/cities` : Liste des villes ayant des missions actives
- `GET /api/missions/domaines` : Liste des domaines d'activité

### Certificats
- `GET /api/certificates/verify/{code}` : Vérification d'un certificat par son code unique

### Statistiques
- `GET /api/stats` : Statistiques globales (missions, bénévoles, associations, heures)

---

## 🧪 Codes de démonstration pour la vérification de certificats

- **Valides :**
  - `CERT-2026-8821` (Thomas Dubois - Maraude nocturne - 18h)
  - `CERT-2026-9932` (Sarah Martin - Collecte alimentaire - 24h)
  - `CERT-2026-1104` (Lucas Bernard - Nettoyage plage - 12h)
  - `CERT-2026-7745` (Emma Petit - Soutien scolaire - 30h)
- **Invalide :**
  - N'importe quel code inexistant (ex : `CERT-INVALID-0000`)
