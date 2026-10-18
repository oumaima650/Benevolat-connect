# CountMeIn — Suivi des tâches en cours

> Fichier de suivi pour reprendre le travail si la session est interrompue.
> Stack : Spring Boot 4.1.1 · Java 21 · React + TypeScript · TanStack Router · Tailwind CSS

---

## Session actuelle — 18 octobre 2026

### ✅ Tâches terminées

- [x] Modales auth (login, inscription bénévole 4 étapes, inscription association 4 étapes, mot de passe oublié, reset)
- [x] AuthModalContext + intégration Header/Hero
- [x] Vérification email OTP après inscription (flow post-création)
- [x] EmailService HTML (bienvenue, OTP, reset mdp)
- [x] DotEnvLoader custom (remplacement spring-dotenv incompatible avec Spring Boot 4.x)
- [x] Dashboard association : profil connecté API (email lecture seule, logo, domaines, géolocalisation)
- [x] Dashboard association : missions CRUD connecté API
- [x] Dashboard association : tableau de bord avec KPIs et graphiques dynamiques
- [x] Dashboard association : inscrits connectés API (confirmés + liste d'attente + panel profil)
- [x] Dashboard association : renfort (endpoint POST /renfort, dialog UI, page renforts connectée)
- [x] Dashboard association : photos événement (upload Cloudinary, galerie dans Dialog)
- [x] Dashboard association : certificats PDF (Flying Saucer + Cloudinary upload, UI certificats.tsx)
- [x] Modal "👁 Voir" mission enrichie : photos + certificats pour missions clôturées/terminées
- [x] StatutMission.COMPLETE → SATUREE (backend + frontend, StatusBadge, filtres)
- [x] Scheduler automatique : PUBLIEE/SATUREE → EN_COURS à dateDebut, EN_COURS → TERMINEE à dateFin
- [x] Fix nbInscritsConfirmes hardcodé à 0 → requête BDD réelle
- [x] Fix compétences non sélectionnées en mode édition (catalogue chargé avant mission)
- [x] Fix localisation (reverse geocoding au chargement + clic carte)
- [x] ValidationContext (fix import circulaire page blanche)

---

## 🔄 En cours — Session interrompue ici

### TÂCHE : Email certificat + endpoint bénévole certificats

**Problème 1 — Certificat ne se crée pas**
- Cause probable : `flying-saucer-pdf` (iText 4/5) incompatible Java 25
- **Fix appliqué** : remplacer `flying-saucer-pdf` par `flying-saucer-pdf-openpdf` dans `pom.xml`
- Fichier modifié : `backend/pom.xml`

**Problème 2 — Email après délivrance manquant**
- **Fix appliqué** :
  - Ajout méthode `sendCertificatDelivre()` dans `EmailService.java`
  - Appel dans `CertificatService.delivrerCertificats()` après sauvegarde
  - Email contient : lien PDF Cloudinary, lien espace bénévole, code de vérification
- Fichiers modifiés : `EmailService.java`, `CertificatService.java`

**Problème 3 — Endpoint bénévole pour voir ses certificats**
- **Fix appliqué** :
  - Ajout `GET /api/benevoles/mes-certificats` dans `BenevoleController.java`
  - Ajout `findByInscription_Benevole_IdUtilisateur()` dans `CertificatRepository.java`
  - Ajout champs `missionTitre` et `associationNom` dans `CertificatResultDto.java`
- Fichiers modifiés : `BenevoleController.java`, `CertificatRepository.java`, `CertificatResultDto.java`

### ⏳ À FAIRE (suite de cette tâche)

- [x] **Frontend** : Connecter onglet certificats dans `benevole.parcours.tsx` à `GET /api/benevoles/mes-certificats`
- [x] **Frontend** : Ajouter `getMesCertificats()` + type `BenevoleCertificat` dans `missionApi.ts`

---

## 📋 Prochaines tâches à implémenter (backlog)

- [ ] Dashboard bénévole : connecter les pages restantes à l'API (badges, parcours, recommandations)
- [ ] Espace bénévole : page explorer connectée aux vraies missions
- [ ] Vérifier que `benevole.profil.tsx` est bien connecté à l'API
- [ ] Admin dashboard (si prévu)

---

## 🔧 Architecture technique

### Backend
- **Base** : `c:\Users\PC\IdeaProjects\Benevolat-connect\backend`
- **Package** : `com.benevolat.plateformebenevolat`
- **Port** : 8080
- **BDD** : MySQL `benevolat_db`
- **Auth** : JWT dans `Authorization: Bearer <token>`
- **Cloudinary** : `CLOUDINARY_CLOUD_NAME=dam3isgtd` (API_KEY/SECRET dans .env)

### Frontend
- **Base** : `c:\Users\PC\IdeaProjects\Benevolat-connect\frontend`
- **Port dev** : 5173
- **Build** : `node node_modules\vite\bin\vite.js build`
- **Style** : neobrutalist — `border-2 border-ink`, `shadow-[4px_4px_0_var(--color-ink)]`, `rounded-2xl`
- **Couleurs** : `bg-mustard` (neutre), `bg-emerald` (principal), `bg-pink` (action), `bg-paper` (fond)

### Services API frontend
- `frontend/src/services/authApi.ts` — auth + catalogue
- `frontend/src/services/associationApi.ts` — dashboard association
- Token JWT : `localStorage.getItem('countmein_token')`

### Endpoints principaux
- `POST /api/auth/register` / `login` / `verify-email`
- `GET/PUT /api/associations/me` + missions/inscrits/renfort/images/certificats
- `GET/PUT /api/benevoles/me` + `mes-inscriptions` + `mes-certificats` ← NOUVEAU
- `GET /api/missions/search` + `/featured` + `/{id}`
- `GET /api/competences` + `/domaines`
- `GET /api/stats` + `/api/health`
