# Implementation Plan — Association Dashboard Backend + Frontend

## Context discovered

- **Backend**: Spring Boot, package `com.benevolat.plateformebenevolat`, Lombok, JPA (JOINED inheritance). DTOs use `@AllArgsConstructor` + `@Getter/@Setter`. SecurityConfig uses a flat `permitAll` matcher for `/api/associations/**`, so `/api/associations/me/**` is currently public — needs tightening. JWT principal = email string set by `JwtAuthFilter`. No `AssociationService` exists yet.
- **Association entity**: `Association extends Utilisateur`. Logo = `photoProfil` (inherited). Domaines = `@ManyToMany` list. `statutValidation` is `StatutValidation` enum (VALIDE / EN_ATTENTE / REFUSE). `nom` is the association name. `getLogoUrl()` delegates to `getPhotoProfil()`.
- **Mission entity**: `dateDebut`/`dateFin` are `LocalDateTime`. `domaine` is `@ManyToOne Domaine`. Competences = `@ManyToMany`. Statut enum `StatutMission` has 8 values. `nbPlacesListeAttente` column exists.
- **Frontend**: TanStack Router. Token stored in `localStorage` as `countmein_token`. API base from `VITE_API_URL` env var (default `http://localhost:8080`). `authApi.ts` already has `fetchDomaines()` and `fetchCompetences()`. `ImageUpload` component exists at `src/components/common/ImageUpload.tsx`.
- **Build verification**: `node node_modules/typescript/bin/tsc --noEmit` + `node node_modules/vite/bin/vite.js build` from `frontend/`.

## Assumptions

1. No `Inscription` counting table is yet wired in `MissionService` — `nbInscritsConfirmes` and `nbListeAttente` in `MissionDto` are computed from `mission.getNbPlacesListeAttente()` and `mission.getNbPlaces() - placesRestantes`. This is consistent with the existing `MissionService.toCardDto` approach.
2. `ville` on a `Mission` is not a direct column — location is stored on the `Association`. The plan exposes `association.getVille()` as the mission city (consistent with the existing `MissionCardDto`).
3. `SecurityConfig` currently allows `/api/associations/**` (wildcards included) publicly. The plan narrows this: `GET /api/associations` stays public; `/api/associations/me/**` requires `ROLE_ASSOCIATION`.

---

## Implementation Plan

- [ ] 1. Create `AssociationProfileDto` — read-only profile response for the connected association.
      Package: `com.benevolat.plateformebenevolat.dto`.
      Fields: `Long id`, `String email`, `String nomAssociation`, `String description`, `String ville`, `String contact`, `String logoUrl`, `String statutValidation`, `List<Long> domaineIds`, `List<String> domaineNoms`.
      Use Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`.
      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/dto/AssociationProfileDto.java`
      Verify: project compiles — `cd backend && mvnw compile` (or open in IDE and build).

- [ ] 2. Create `UpdateAssociationRequest` DTO — payload for PUT /api/associations/me.
      Package: `com.benevolat.plateformebenevolat.dto`.
      Fields: `String nomAssociation`, `String description`, `String ville`, `String contact`, `String logoUrl`, `String adresse`, `List<Long> domaineIds`.
      Use `@Data @NoArgsConstructor @AllArgsConstructor`.
      Note: no `email` field — email is immutable.
      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/dto/UpdateAssociationRequest.java`
      Verify: `mvnw compile` succeeds.

- [ ] 3. Create `MissionRequest` DTO — payload for POST and PUT mission endpoints.
      Package: `com.benevolat.plateformebenevolat.dto`.
      Fields: `String titre` (required), `String description`, `Long domaineId` (required), `String adresse`, `String ville` (ignored for storage — kept for frontend convenience), `BigDecimal latitude`, `BigDecimal longitude`, `String dateDebut` (ISO-8601 string, e.g. `2026-10-15T09:00`), `String dateFin`, `Integer nbPlaces` (required), `List<Long> competenceIds`, `String statut` (optional, default `BROUILLON`).
      Use `@Data @NoArgsConstructor @AllArgsConstructor`.
      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/dto/MissionRequest.java`
      Verify: `mvnw compile` succeeds.

- [ ] 4. Create `MissionDto` DTO — full mission response for the association dashboard.
      Package: `com.benevolat.plateformebenevolat.dto`.
      Fields: `Long id`, `String titre`, `String description`, `String adresse`, `BigDecimal latitude`, `BigDecimal longitude`, `LocalDateTime dateDebut`, `LocalDateTime dateFin`, `Integer nbPlaces`, `Integer nbInscritsConfirmes`, `Integer nbListeAttente`, `StatutMission statut`, `Long domaineId`, `String domaineNom`, `List<String> competenceNoms`, `Long associationId`, `String associationNom`, `String associationLogoUrl`.
      Use `@Data @Builder @NoArgsConstructor @AllArgsConstructor`.
      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/dto/MissionDto.java`
      Verify: `mvnw compile` succeeds.

- [ ] 5. Create `AssociationService` with five methods.
      Package: `com.benevolat.plateformebenevolat.service`.
      Annotate with `@Service @RequiredArgsConstructor @Transactional`.
      Inject: `AssociationRepository`, `DomaineRepository`, `MissionRepository`, `CompetenceRepository`.

      Method signatures and logic:

      **`AssociationProfileDto getProfile(String email)`**
      — `associationRepository.findByEmail(email)` → throw `ResponseStatusException(NOT_FOUND)` if absent.
      — Map fields: `id`, `email`, `nom` → `nomAssociation`, `description`, `ville`, `contact`, `photoProfil` → `logoUrl`, `statutValidation.name()`, collect `domaines` into `domaineIds` and `domaineNoms`.

      **`AssociationProfileDto updateProfile(String email, UpdateAssociationRequest req)`**
      — Load association by email (same guard as above).
      — Set `nom`, `description`, `ville`, `contact`; if `req.getLogoUrl() != null && !blank` → `setPhotoProfil(...)`.
      — If `req.getDomaineIds() != null` → replace `domaines` list: `domaineRepository.findAllById(req.getDomaineIds())`.
      — `associationRepository.save(asso)`.
      — Return `getProfile(email)`.

      **`List<MissionDto> getMissions(String email)`**
      — Load association by email.
      — `missionRepository.findByAssociationIdUtilisateurOrderByDateDebutDesc(asso.getIdUtilisateur())` — add this query to `MissionRepository` (step 6).
      — Map each `Mission` using private helper `toMissionDto(Mission)`.

      **`MissionDto createMission(String email, MissionRequest req)`**
      — Load association by email.
      — Parse `dateDebut` / `dateFin`: `LocalDateTime.parse(req.getDateDebut())` (ISO-8601).
      — Load `Domaine`: `domaineRepository.findById(req.getDomaineId())` → throw `BAD_REQUEST` if absent.
      — Build `Mission` entity: set all fields; set `statut = (req.getStatut() != null && req.getStatut().equalsIgnoreCase("PUBLIEE")) ? StatutMission.PUBLIEE : StatutMission.BROUILLON`.
      — If `req.getCompetenceIds() != null` → `mission.setCompetences(competenceRepository.findAllById(req.getCompetenceIds()))`.
      — `missionRepository.save(mission)` → return `toMissionDto(savedMission)`.

      **`MissionDto updateMission(String email, Long missionId, MissionRequest req)`**
      — Load mission by id → throw `NOT_FOUND` if absent.
      — Verify `mission.getAssociation().getEmail().equals(email)` → throw `FORBIDDEN` if not.
      — Verify `statut` not in `{ANNULEE, CLOTUREE}` → throw `BAD_REQUEST("Mission non modifiable")`.
      — Update all non-null fields (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, domaine, competences).
      — `missionRepository.save(mission)` → return `toMissionDto(...)`.

      **`MissionDto changeStatut(String email, Long missionId, String newStatut)`**
      — Load mission; verify ownership; verify not `ANNULEE/CLOTUREE`.
      — Parse `StatutMission.valueOf(newStatut)` → throw `BAD_REQUEST` on `IllegalArgumentException`.
      — `mission.setStatut(parsed)` → save → return `toMissionDto(...)`.

      **Private helper `toMissionDto(Mission m)`**
      — `nbInscritsConfirmes = m.getNbPlaces() - Math.max(0, placesRestantes)` — for now: compute `placesRestantes` as in `MissionService.toCardDto` (0 inscriptions counted, so `nbInscritsConfirmes = 0`; wire real count when Inscription entity is added).
      — `nbListeAttente = m.getNbPlacesListeAttente()`.
      — Return `MissionDto.builder()...build()`.

      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/service/AssociationService.java`
      Verify: `mvnw compile` succeeds.

- [ ] 6. Add query method to `MissionRepository`.
      Add:
      ```java
      List<Mission> findByAssociationIdUtilisateurOrderByDateDebutDesc(Long associationId);
      ```
      Spring Data derives the query from the method name against `association.idUtilisateur`.
      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/repository/MissionRepository.java`
      Verify: `mvnw compile` succeeds.

- [ ] 7. Add the six REST endpoints to `AssociationController`.
      Inject `AssociationService` (add to constructor via `@RequiredArgsConstructor`).
      Add a private helper `currentEmail()` that reads the email from `SecurityContextHolder.getContext().getAuthentication().getName()`.

      Endpoints:
      ```
      GET  /api/associations/me        → getProfile(currentEmail())                → 200 AssociationProfileDto
      PUT  /api/associations/me        → updateProfile(currentEmail(), body)        → 200 AssociationProfileDto
      GET  /api/associations/me/missions → getMissions(currentEmail())              → 200 List<MissionDto>
      POST /api/associations/me/missions → createMission(currentEmail(), body)      → 201 MissionDto
      PUT  /api/associations/me/missions/{id} → updateMission(currentEmail(), id, body) → 200 MissionDto
      PATCH /api/associations/me/missions/{id}/statut?newStatut=PUBLIEE → changeStatut(currentEmail(), id, newStatut) → 200 MissionDto
      ```

      The `PATCH` endpoint takes `newStatut` as a `@RequestParam`.
      The `POST` endpoint returns `ResponseEntity.status(HttpStatus.CREATED).body(dto)`.

      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/controller/AssociationController.java`
      Verify: `mvnw compile` succeeds.

- [ ] 8. Update `SecurityConfig` to protect `/api/associations/me/**` while keeping `GET /api/associations` public.
      Replace the single `"/api/associations/**"` matcher with two rules, in order (Spring Security evaluates first match):
      ```java
      .requestMatchers(HttpMethod.GET,  "/api/associations").permitAll()
      .requestMatchers("/api/associations/me/**").hasRole("ASSOCIATION")
      .requestMatchers("/api/associations/**").permitAll()
      ```
      Add `import org.springframework.http.HttpMethod;`.
      Files: `backend/src/main/java/com/benevolat/plateformebenevolat/config/SecurityConfig.java`
      Verify: `mvnw compile` succeeds; start the application and verify `GET /api/associations` returns 200 without token, `GET /api/associations/me` returns 401 without token.

- [ ] 9. Create the frontend `associationApi.ts` service.
      Location: `frontend/src/services/associationApi.ts`.
      Reads token from `localStorage.getItem("countmein_token")`.
      Uses the same `API_BASE` pattern as `authApi.ts` (`import.meta.env["VITE_API_URL"] ?? "http://localhost:8080"`).
      Provides a private `authFetch(method, path, body?)` helper that adds `Authorization: Bearer <token>` header.

      Exported functions and their types:

      ```typescript
      // --- Types ---
      export interface AssociationProfile {
        id: number;
        email: string;
        nomAssociation: string;
        description: string;
        ville: string;
        contact: string;
        logoUrl: string;
        statutValidation: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
        domaineIds: number[];
        domaineNoms: string[];
      }

      export interface UpdateProfilePayload {
        nomAssociation: string;
        description: string;
        ville: string;
        contact: string;
        logoUrl?: string;
        adresse?: string;
        domaineIds: number[];
      }

      export interface MissionPayload {
        titre: string;
        description?: string;
        domaineId: number;
        adresse?: string;
        latitude?: number;
        longitude?: number;
        dateDebut: string;   // ISO-8601 datetime
        dateFin: string;
        nbPlaces: number;
        competenceIds?: number[];
        statut?: string;     // "PUBLIEE" to publish, omit for BROUILLON
      }

      export interface MissionDashApi {
        id: number;
        titre: string;
        description: string;
        adresse: string;
        latitude: number;
        longitude: number;
        dateDebut: string;
        dateFin: string;
        nbPlaces: number;
        nbInscritsConfirmes: number;
        nbListeAttente: number;
        statut: string;
        domaineId: number;
        domaineNom: string;
        competenceNoms: string[];
        associationId: number;
        associationNom: string;
        associationLogoUrl: string;
      }

      // --- Functions ---
      export async function getMyProfile(): Promise<AssociationProfile>
      export async function updateMyProfile(payload: UpdateProfilePayload): Promise<AssociationProfile>
      export async function getMyMissions(): Promise<MissionDashApi[]>
      export async function createMission(payload: MissionPayload): Promise<MissionDashApi>
      export async function updateMission(id: number, payload: MissionPayload): Promise<MissionDashApi>
      export async function changeMissionStatut(id: number, newStatut: string): Promise<MissionDashApi>
      ```

      All functions throw `{ message: string; status: number }` on non-2xx response (same pattern as `authApi.ts`).

      Files: `frontend/src/services/associationApi.ts`
      Verify: `cd frontend && node node_modules/typescript/bin/tsc --noEmit` — no errors.

- [ ] 10. Update `association.profil.tsx` — wire real API data.
       Replace static `associationProfile` import with API calls.

       Changes:
       - Add `useEffect` that calls `getMyProfile()` on mount; store result in `useState<AssociationProfile | null>`.
       - Replace `useState` form initializer: after API response, call `setForm({...})` with real data.
       - Add `loading` and `error` states; show skeleton/spinner while loading.
       - Email field: add read-only `<Input value={profile?.email} disabled />` below the header, labeled "Adresse e-mail (non modifiable)".
       - Logo: replace the static `AN` initials div with `<ImageUpload label="Logo de l'association" value={form.logoUrl} onChange={(url) => setForm(f => ({...f, logoUrl: url}))} id="logo-asso" />` (import from `@/components/common/ImageUpload`).
       - Domaine selector: change from single `<Select>` to multi-select rendered as clickable badge pills. Fetch domaines via `fetchDomaines()` from `authApi.ts` on mount. State: `domaineIds: number[]`. Render each domaine as a `<button>` pill: selected = `bg-emerald border-ink`, unselected = `bg-paper border-ink/30`. Toggle on click.
       - `statutValidation`: map `VALIDE` → "Association validée" badge, everything else → "En attente" badge (replaces hardcoded `associationProfile.statut === 'VALIDEE'` check).
       - `handleSave`: call `updateMyProfile({ nomAssociation: form.nom, description, ville, contact, logoUrl: form.logoUrl, domaineIds: form.domaineIds })` → on success `toast.success('Profil mis à jour !')` and update local profile state.

       Files: `frontend/src/routes/association.profil.tsx`
       Verify: `tsc --noEmit` — no errors.

- [ ] 11. Update `association.missions.tsx` — wire real API data.
       Replace static `MISSIONS_ASSO` array with API-fetched data.

       Changes:
       - Import `getMyMissions`, `changeMissionStatut`, `MissionDashApi` from `associationApi.ts`.
       - `useState<MissionDashApi[]>` for missions, add `loading` boolean state.
       - `useEffect` on mount: call `getMyMissions()`, map response to local state; catch errors with `toast.error(...)`.
       - Show loading skeleton (same 5-row skeleton pattern as existing pages) while loading.
       - The `executeAction` function: instead of local `setMissions(...)`, call `changeMissionStatut(Number(id), newStatut)` → on success update the missions list by replacing the matching item with the returned `MissionDashApi`.
       - The "Modifier" `<Link>` button: add `search={{ id: Number(m.id) }}` so the edit form receives the mission id. Change `to="/association/nouvelle-mission"` — TanStack Router route search param.
       - Map `MissionDashApi` fields to table display: `placesTotal` = `nbPlaces`, `placesConfirmees` = `nbInscritsConfirmes`, `listeAttente` = `nbListeAttente`, `statut` stays the same string.
       - The `MissionStatut` type in `data.ts` already matches all enum values so `StatusBadge` works without changes.

       Files: `frontend/src/routes/association.missions.tsx`
       Verify: `tsc --noEmit` — no errors.

- [ ] 12. Update `association.nouvelle-mission.tsx` — full redesign + API wiring.
       This step replaces the static form with a fully wired neobrutalist creation/edit form.

       **State additions:**
       - `const { id } = Route.useSearch()` — read optional `id?: number` from search params.
       - `const isEditMode = id != null`.
       - `loading` boolean, `submitting` boolean.
       - `domaines: DomaineItem[]` — fetched from `fetchDomaines()`.
       - `allCompetences: CompetenceItem[]` — fetched from `fetchCompetences()`.
       - Extend `form` state: add `domaineId: number | null`, `competenceIds: number[]`, replace `places: string` with `places: string` (keep as string for input binding).
       - Keep `position: [number, number]` for map picker.

       **Route definition update:** add `validateSearch: (search) => ({ id: search.id as number | undefined })` to `createFileRoute('/association/nouvelle-mission')`.

       **On mount useEffect:**
       - Fetch `fetchDomaines()` and `fetchCompetences()` in parallel.
       - If `isEditMode`: call `getMyMissions()`, find the mission with matching `id`, pre-populate `form` fields (titre, description, domaineId, adresse, dateDebut as `YYYY-MM-DDTHH:mm`, dateFin, places, competenceIds, position from lat/lng).

       **Design — sections with neobrutalist cards:**

       Section 1 "Informations générales" (`MapPin` icon):
       - Titre input (required, `border-2 border-ink rounded-xl`).
       - Description textarea.
       - Domaine: render fetched `domaines` as clickable badge pills (one selectable at a time): selected = `bg-emerald border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] font-bold`, unselected = `border-2 border-ink/40 bg-paper`. On click set `form.domaineId`.

       Section 2 "Lieu & dates" (`CalendarDays` icon):
       - Type radio (sur place / à distance) — keep existing.
       - Adresse input (shown when sur_place).
       - Map picker (shown when sur_place, existing `MissionMapPicker` lazy component).
       - Date début / Date fin grid (datetime-local inputs).
       - Nombre de places input.

       Section 3 "Compétences requises" (`Users` icon):
       - Show `allCompetences` as toggleable badge pills: selected = `bg-mustard border-2 border-ink font-bold`, unselected = `border-2 border-ink/40 bg-paper`. Toggle adds/removes `competenceId` from `form.competenceIds`.
       - Keep existing `TagInput` component below the pills for adding custom competences by name (stores names in a separate `customCompetences: string[]` state; these are displayed as tags but NOT sent as ids — assumption: the backend accepts competence ids only; custom names are informational for now until a "create competence" endpoint exists). Add a note comment in code.

       **Submit handlers:**

       `handleSaveDraft`: calls `createMission({ ...form, nbPlaces: Number(form.places), statut: undefined })` (BROUILLON default) or `updateMission(id!, ...)` in edit mode → toast → navigate to `/association/missions`.

       `handlePublish`: same but `statut: "PUBLIEE"` → toast "Mission publiée !" → navigate.

       Both handlers wrap in `try/catch`, set `submitting = true/false`, show `toast.error(...)` on failure.

       **Button row:**
       - "Enregistrer en brouillon": `bg-mustard border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] rounded-xl font-bold`.
       - "Publier la mission": `bg-emerald border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] rounded-xl font-bold text-emerald-foreground`.
       - Both disabled while `submitting`.
       - Page title: "Modifier la mission" when `isEditMode`, "Créer une mission" otherwise.

       Files: `frontend/src/routes/association.nouvelle-mission.tsx`
       Verify: `tsc --noEmit` — no errors.

- [ ] 13. Final TypeScript compilation and Vite build check.
       Run both verification commands and fix any remaining type errors.
       ```
       cd c:\Users\PC\IdeaProjects\Benevolat-connect\frontend
       node node_modules/typescript/bin/tsc --noEmit
       node node_modules/vite/bin/vite.js build
       ```
       Expected: zero TypeScript errors, Vite build completes with output in `dist/`.
       Files: any files with residual type errors found in this step.
       Verify: commands above exit with code 0.

---

## Gaps and notes

1. **Inscription counts**: `nbInscritsConfirmes` in `MissionDto` will always be 0 until the `Inscription` table/entity is wired. This is consistent with the existing `MissionService` which also returns 0 for inscriptions. No action needed in this plan.
2. **`adresse` on Association entity**: `Association` has no `adresse` column. `UpdateAssociationRequest` includes it per the spec, but the service will ignore it (not map to entity) with a comment noting it requires a DB migration.
3. **Custom competences in mission form**: the free-text competence tags in `TagInput` are not sent to the backend (which expects IDs). They are displayed locally as a UX nicety. A "create competence" endpoint would be needed to fully support this.
4. **`StatutValidation` enum**: must exist at `com.benevolat.plateformebenevolat.entity.StatutValidation` — it is referenced in `Association.java`. It is not in the files-to-read list but is already present in the codebase.
5. **Backend build command**: `mvnw compile` is written as a shorthand. The actual command on Windows is `.\mvnw.cmd compile` run from the `backend/` directory. The coder should use whichever works in the environment.
