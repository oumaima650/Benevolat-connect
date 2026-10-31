# CountMeIn — Suivi des tâches en cours

> Fichier de suivi pour reprendre le travail si la session est interrompue.
> Stack : Spring Boot 4.1.1 · Java 21 · React + TypeScript · TanStack Router · Tailwind CSS

---

## Session actuelle — 18 octobre 2026

## ✅ Corrections multiples (18/10/2026) — terminées, à tester manuellement

### 1. Déconnexion / retour accueil bloqués (espaces association + bénévole) ✅
- Cause : `navigate()` appelé pendant le rendu du layout (`if (!user) navigate('/login')`) en course avec
  `navigate('/')` au logout ; + Radix (Dropdown/Sheet) laissait `pointer-events: none` sur `<body>` quand
  il était démonté ouvert → page qui ne répond plus.
- Fix : `<Navigate>` déclaratif dans `association.tsx` / `benevole.tsx` ; logout = `navigate('/').then(logout)` ;
  nettoyage de `body.style.pointerEvents` à chaque navigation (`__root.tsx`) ; Toaster dupliqué retiré.

### 2. Après connexion → rester sur la landing page ✅
- `LoginModal.tsx` : plus de redirection vers /association ou /benevole.

### 3. Places / saturation / renfort / liste d'attente ✅
- Convention : `Mission.nbPlaces` en BDD = places RESTANTES (0 quand saturée, c'est normal).
  Capacité totale = confirmés + restantes. Capacité liste d'attente = capacité totale.
- Nouveau `MissionPlacesService.recalculer()` : promotion liste d'attente, renumérotation des rangs,
  PUBLIEE ↔ SATUREE, fin du RENFORT_URGENT quand comblé (→ EN_COURS si démarrée, sinon SATUREE).
- `MissionDto.nbPlaces` = capacité totale (fix « 2/0 »), + `nbPlacesRestantes`, `nbPlacesTotal`,
  `nbListeAttente` (= nb réel de personnes en attente), `nbRenfortDemande`.
- Modification : autorisée seulement BROUILLON/PUBLIEE/SATUREE ; nbPlaces du formulaire = total ;
  refus si total < confirmés ; 2 → 3 sur une mission saturée ⇒ promotion liste d'attente ou PUBLIEE.
- Renfort : autorisé PUBLIEE/SATUREE/EN_COURS/RENFORT_URGENT ; ajoute N places (liste d'attente promue
  d'abord) ; bouton Renfort visible pour SATUREE.
- Inscription : ouverte aussi en RENFORT_URGENT (même après dateDebut, tant que dateFin non passée) ;
  liste d'attente fonctionnelle même pour les missions existantes (nbPlacesListeAttente = 0 en BDD).
- Scheduler : RENFORT_URGENT n'est plus écrasé en EN_COURS à dateDebut.
- Page publique `missions.$id.tsx` : bannière renfort urgent, bouton désactivé si inscriptions fermées.

### 4. Certificat Cloudinary 403 + prévisualisation ✅
- Cause : la clé API Cloudinary du backend n'a pas la permission `create` (upload signé refusé).
- Fix : fallback automatique sur le preset non signé `CLOUDINARY_UPLOAD_PRESET` (=benevolat_preset,
  ajouté au `.env` backend) ; `public_id` avec extension `.pdf` (sinon servi en octet-stream) ;
  ré-upload des certificats sans PDF (bouton « Réessayer l'upload »).
- Nouvel endpoint `GET /api/associations/me/certificats/{id}/apercu` (PDF généré à la volée, inline)
  + bouton « Aperçu » (iframe dans un Dialog) dans `association.certificats.tsx`.
- ⚠️ Si le fallback échoue aussi : vérifier dans la console Cloudinary que le preset `benevolat_preset`
  est bien *Unsigned* et accepte les fichiers raw/PDF, ou créer une clé API avec droits d'upload.

### 5. Refonte du design du certificat PDF ✅
- `CertificatService.genererPdfBytes()` : charte CountMeIn (ink / mustard / pink / emerald, bordures
  épaisses, ombre décalée, formes décoratives), logo CountMeIn + logo association (initiales si absent).
- Logo CountMeIn embarqué en base64 depuis `backend/src/main/resources/certificat/countmein-logo.png`.
- Flying Saucer = CSS 2.1 : pas de flex/box-shadow → tableaux + `position: absolute` + `z-index`.

## 🔄 En cours (26/10/2026) — branche feat/notifs-Admin

### ⚠️ Migration SQL à exécuter AVANT de démarrer le backend
`database/migrations/2026-10-26-notifications-admin.sql` (colonnes Notification.categorie/lien,
Association.motifRefus, Mission.motifSignalement/estMasquee).

### 6. Notifications (F28-F31) — backend ✅ / frontend ✅
- `NotificationService` : notification in-app + e-mail après commit, en arrière-plan ;
  via webhook n8n si `N8N_WEBHOOK_URL` défini (secret `X-Webhook-Secret`), sinon SMTP ; repli SMTP si n8n KO.
- Préférences (F31) : tout ou rien via `Utilisateur.notifEstActive` (pas de nouvelle colonne).
  COMPTE / VALIDATION / MISSION_ANNULEE toujours envoyées.
- Événements branchés : inscription / liste d'attente / promotion (F17) / désistement / mission modifiée
  (date ou lieu, F08) / mission annulée (RM10) / renfort comblé (F45) / certificat / validation-refus
  association / suspension / modération / nouvelle association → admins.
- `RappelService` (F29) : toutes les 15 min, rappel 24 h avant, une seule fois (`rappelEnvoye`).
- API : `GET /api/notifications`, `GET /non-lues/count`, `PATCH /{id}/lue`, `PATCH /lire-tout`,
  `DELETE /{id}`, `GET|PUT /preferences`.
- Règles ajoutées : RM06 (publication interdite si association non validée), annulation de mission
  seulement avant le début, annulation d'inscription seulement avant le début (F18).

### 7. Espace administrateur — backend ✅ / frontend ✅
- `AdminInitializer` : crée l'admin au démarrage (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, défaut
  admin@countmein.ma / Admin@CountMeIn2026).
- `/api/admin/**` (rôle ADMIN) : `GET /stats` (F34), `GET /associations?statut=`,
  `PATCH /associations/{id}/valider|refuser` (F39), `GET /utilisateurs?role=&q=`,
  `PATCH /utilisateurs/{id}/suspendre|reactiver` (F40), `GET /missions?filtre=signalees|masquees`,
  `PATCH /missions/{id}/masquer|retablir` (F41).
- `POST /api/missions/{id}/signaler` (connecté) ; missions masquées exclues de la recherche,
  des missions en vedette et du détail public.
- `JwtAuthFilter` : un compte suspendu/désactivé perd l'accès même avec un jeton valide (RM12).

### Frontend (notifications + admin)
- `components/notifications/NotificationCenter.tsx` : centre partagé (bénévole, association, admin),
  lu/non lu, suppression, clic → page liée, préférence e-mail tout ou rien.
- `hooks/use-unread-notifications.ts` : compteur live (30 s + focus + après action) dans les 3 layouts
  (remplace les badges « 2 » / « 3 » codés en dur).
- Espace admin : `admin.tsx` (layout), `admin.index.tsx` (KPIs + graphiques F34),
  `admin.associations.tsx` (F39), `admin.utilisateurs.tsx` (F40), `admin.missions.tsx` (F41),
  `admin.notifications.tsx`. Services : `services/http.ts`, `notificationApi.ts`, `adminApi.ts`.
- `components/site/SignalerMission.tsx` sur la page mission publique (utilisateur connecté).
- Redirections : ADMIN → /admin depuis les espaces bénévole/association et le Header.
- `server.error.include-message=always` : les messages d'erreur métier s'affichent enfin dans les toasts.

### ⏳ Reste à faire
- [ ] Exécuter la migration SQL puis tester de bout en bout (rien n'a été lancé contre la BDD)
- [ ] Tester les workflows n8n de bout en bout (voir n8n/README.md)

### 8. E-mails : templates Java + n8n/IA ✅ (choix d'architecture)
- E-mails liés à une action → **templates Java** (`EmailTemplates.java`, couleur/badge/bouton par catégorie,
  encadré mission/date/lieu/rang). Ne dépendent plus de n8n.
- **n8n + IA (Google Gemini, offre gratuite)** uniquement pour le planifié / non critique : `n8n/workflows/01-rappel-24h.json`,
  `02-renfort-urgent.json` (bénévoles proches), `03-resume-hebdomadaire.json` (formule pondérée F47).
- API n8n (secret `X-Webhook-Secret`) : `GET /api/n8n/rappels`, `POST /api/n8n/rappels/{id}/envoye`,
  `GET /api/n8n/renforts/{missionId}/benevoles`, `GET /api/n8n/digest`.
- Backend → n8n : webhook `{N8N_BASE_URL}/renfort` si places libres après promotion de la liste d'attente.
- `RappelService` : sans n8n → envoie tout ; avec n8n → seulement e-mails coupés (in-app) + secours 3 h avant.
- Config : `N8N_BASE_URL`, `N8N_WEBHOOK_SECRET` (vide = n8n désactivé). Guide : `n8n/README.md`.
- F43 : la confirmation par lien est abandonnée au profit de la promotion automatique (cahier à mettre à jour).
- [ ] Tests manuels des 4 points ci-dessus

---

### ✅ Tâches terminées (sessions précédentes)

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
