# Implementation Plan — CountMeIn Dashboard Espaces

> Ce plan est le fallback pour la boucle implement-and-review.
> La décomposition FEAT canonique se trouve dans `.agents/tasks/task-dashboard-espaces/`.

---

## Contexte du projet

- **Stack** : Vite 8 + React 19 + TypeScript strict + TanStack Router v1 (file-based, autoCodeSplitting) + Tailwind CSS v4
- **Routage** : `src/routes/` — chaque fichier = une route. `routeTree.gen.ts` est auto-généré, ne jamais le modifier.
- **Design system** : neo-brutaliste (border-2 border-ink, shadow-[N px N px 0 var(--color-ink)]), couleurs oklch via classes Tailwind `bg-mustard`, `bg-pink`, `bg-emerald`, `text-ink`, `bg-paper`.
- **Composants UI** : `src/components/ui/` (button, card, badge, dialog, select, table, tabs, skeleton, sidebar, chart, progress, slider, switch, sheet, etc.)
- **Auth** : `useAuth()` de `@/context/AuthContext.tsx` — `{ user, token, loginUser, logout }`. `UserProfile.role` = `'BENEVOLE' | 'ASSOCIATION' | 'ADMIN'`.
- **Graphiques** : `recharts` déjà installé. Utiliser `ChartContainer` de `@/components/ui/chart.tsx`.
- **Toasts** : `sonner` — `import { toast } from 'sonner'`.
- **Build** : `cd d:\benevolat-connect\frontend && npm run build`

---

## FEAT-001 — Infrastructure partagée

- [ ] 1. Installer react-leaflet, leaflet, @types/leaflet.
      `npm install leaflet react-leaflet @types/leaflet` dans `d:\benevolat-connect\frontend`.
      Files: package.json, package-lock.json
      Verify: `npm run build` passe.

- [ ] 2. Créer `src/components/dashboard/data.ts` avec toutes les données fictives marocaines.
      Types: MissionStatut, MissionDash, InscriptionBenevole, CertificatDash, BadgeDash, NotificationDash, BenevoleProfile, AssociationProfile, InscritMission, RecommandationMission.
      Données: 8 missions (villes Tétouan/Tanger/Rabat/Casablanca/Fès, couvrant tous les statuts), 5 inscriptions bénévole, 3 certificats, 4 badges (2 débloqués), 8 notifications (mix lu/non-lu), profil bénévole Yasmine El Idrissi de Tétouan, profil association "Association Nour" de Tétouan (VALIDEE), 6 inscrits fictifs, 5 recommandations avec score/critères.
      Files: `src/components/dashboard/data.ts`
      Verify: `npm run build` — aucune erreur TS d'import.

- [ ] 3. Créer les 6 composants réutilisables.
      - `StatusBadge.tsx` : statut → couleur fixe (PUBLIEE=vert, COMPLETE=orange, EN_COURS=bleu, RENFORT_URGENT=rouge, TERMINEE=gris clair, CLOTUREE=gris foncé, ANNULEE=rouge clair, BROUILLON=jaune).
      - `KpiCard.tsx` : label + value + icon + trend optionnel, style neo-brutaliste shadow-ink.
      - `EmptyState.tsx` : icon + title + description + action optionnelle.
      - `ConfirmDialog.tsx` : wrapper Dialog avec bouton confirm (variant default|destructive).
      - `ScoreGauge.tsx` : SVG cercle, arc coloré selon score 0-100, texte centré.
      - `MissionCardDash.tsx` : carte mission dashboard avec StatusBadge, places, listeAttente, badge Renfort urgent rouge, bouton actionLabel.
      Files: `src/components/dashboard/StatusBadge.tsx`, `KpiCard.tsx`, `EmptyState.tsx`, `ConfirmDialog.tsx`, `ScoreGauge.tsx`, `MissionCardDash.tsx`, `index.ts`
      Verify: `npm run build` — aucune erreur TS.

- [ ] 4. Créer `src/routes/dashboard-login.tsx` — page `/dashboard-login`.
      Deux cartes cliquables (Bénévole / Association) avec identité visuelle du site.
      Bénévole : loginUser({email:'yasmine@example.ma', prenom:'Yasmine', nom:'El Idrissi', role:'BENEVOLE'}, 'demo-benevole-token') + navigate('/benevole').
      Association : loginUser({email:'contact@nour-asso.ma', nomAssociation:'Association Nour', role:'ASSOCIATION'}, 'demo-association-token') + navigate('/association').
      Files: `src/routes/dashboard-login.tsx`
      Verify: `npm run build` — route `/dashboard-login` apparaît dans routeTree.gen.ts.

---

## FEAT-002 — Espace bénévole

- [ ] 5. Créer `src/routes/benevole.tsx` — layout bénévole.
      Sidebar gauche repliable (256px → 64px), 8 liens nav avec icônes Lucide, lien actif bg-mustard border-l-4 border-ink.
      Header fixe : hamburger toggle + titre page + pastille notifs + avatar Yasmine.
      Mobile : sidebar en Sheet overlay.
      Bouton déconnexion en bas de sidebar (logout() + navigate('/')).
      `<Outlet />` pour contenu.
      Files: `src/routes/benevole.tsx`
      Verify: `npm run build` passe.

- [ ] 6. Créer `src/routes/benevole.index.tsx` — tableau de bord bénévole.
      4 KpiCard, barre progression niveau (Progress), prochaines missions confirmées, liste d'attente avec rang, 3 dernières notifs, doughnut missions par domaine (recharts).
      Skeleton loaders (useEffect setTimeout 800ms).
      Files: `src/routes/benevole.index.tsx`
      Verify: `npm run build` passe.

- [ ] 7. Créer `src/routes/benevole.explorer.tsx` — explorer les missions.
      Filtres (motCle, domaine, ville, date) + bascule liste/grille + pagination 10/page.
      Bouton contextuel : S'inscrire / Rejoindre la liste d'attente selon statut COMPLETE.
      Bandeau rouge 'Renfort urgent !' sur missions RENFORT_URGENT.
      Dialog de détail au clic. Toasts sonner à chaque action.
      Files: `src/routes/benevole.explorer.tsx`
      Verify: `npm run build` passe.

- [ ] 8. Créer `src/routes/benevole.carte.tsx` — carte Leaflet.
      Import dynamique react-leaflet (lazy + Suspense). Fix icônes Leaflet. Carte centrée sur Maroc.
      Markers colorés par statut. Popup avec titre/places/bouton détail. Filtres superposés.
      `import 'leaflet/dist/leaflet.css'` dans ce fichier.
      Files: `src/routes/benevole.carte.tsx`
      Verify: `npm run build` passe.

- [ ] 9. Créer `src/routes/benevole.recommandations.tsx` — recommandations.
      5 missions triées par score décroissant. ScoreGauge + barres critères (Progress) + texte explication.
      Bandeau 'Score calculé par formule de secours' sur missions avec flag rescueScore.
      Files: `src/routes/benevole.recommandations.tsx`
      Verify: `npm run build` passe.

- [ ] 10. Créer `src/routes/benevole.parcours.tsx` — parcours (Tabs: inscriptions + certificats).
       Inscriptions filtrables par statut, rang affiché pour liste d'attente, bouton Annuler + ConfirmDialog.
       Certificats : liste avec code, bouton Télécharger PDF (toast).
       Files: `src/routes/benevole.parcours.tsx`
       Verify: `npm run build` passe.

- [ ] 11. Créer `src/routes/benevole.badges.tsx` — badges & niveau.
        Section niveau avec Progress, tableau des paliers, grille de badges (débloqués colorés, verrouillés grisés).
        Files: `src/routes/benevole.badges.tsx`
        Verify: `npm run build` passe.

- [ ] 12. Créer `src/routes/benevole.notifications.tsx` — notifications bénévole.
        Liste lu/non-lu avec badge points bleus, bouton 'Tout marquer comme lu', filtres, section préférences avec Switch.
        Files: `src/routes/benevole.notifications.tsx`
        Verify: `npm run build` passe.

- [ ] 13. Créer `src/routes/benevole.profil.tsx` — profil bénévole.
        react-hook-form : photo avatar, nom/prénom/ville/bio, Slider rayon, tags compétences/intérêts, changement mot de passe (Collapsible), zone dangereuse (Désactiver compte + ConfirmDialog destructive).
        Files: `src/routes/benevole.profil.tsx`
        Verify: `npm run build` passe — toutes les routes /benevole/* dans routeTree.gen.ts.

---

## FEAT-003 — Espace association

- [ ] 14. Créer `src/routes/association.tsx` — layout association.
         Même structure que benevole.tsx mais couleur active bg-emerald, 8 liens association, bandeau d'alerte conditionnel si associationProfile.statut === 'EN_ATTENTE'.
         Files: `src/routes/association.tsx`
         Verify: `npm run build` passe.

- [ ] 15. Créer `src/routes/association.index.tsx` — tableau de bord association.
          5 KpiCard, section 'À faire', 3 graphiques recharts (barres taux remplissage, courbe inscriptions sur 6 mois, doughnut par statut), Skeleton loaders.
          Files: `src/routes/association.index.tsx`
          Verify: `npm run build` passe.

- [ ] 16. Créer `src/routes/association.missions.tsx` — liste des missions.
          Table + recherche + filtre statut + pagination. Actions contextuelles par statut. ConfirmDialog pour Publier/Annuler/Clôturer.
          Files: `src/routes/association.missions.tsx`
          Verify: `npm run build` passe.

- [ ] 17. Créer `src/routes/association.nouvelle-mission.tsx` — créer/modifier une mission.
          react-hook-form + zod. 3 sections : infos générales, lieu (type + adresse + mini-carte Leaflet draggable) + dates, participants (places + compétences tags).
          Boutons Brouillon et Publier. Avertissement si edit + places < inscrits confirmés.
          `import 'leaflet/dist/leaflet.css'`.
          Files: `src/routes/association.nouvelle-mission.tsx`
          Verify: `npm run build` passe.

- [ ] 18. Créer `src/routes/association.inscrits.tsx` — inscrits & liste d'attente.
          Select mission. Deux colonnes inscrits confirmés / liste d'attente avec rang. Sheet latéral au clic sur bénévole.
          Files: `src/routes/association.inscrits.tsx`
          Verify: `npm run build` passe.

- [ ] 19. Créer `src/routes/association.renforts.tsx` — renforts.
          Missions EN_COURS/RENFORT_URGENT, barre X/Y renforts (Progress), Dialog déclaration renfort, étapes de suivi visuelles.
          Files: `src/routes/association.renforts.tsx`
          Verify: `npm run build` passe.

- [ ] 20. Créer `src/routes/association.certificats.tsx` — certificats.
          Sélecteur missions TERMINEE. Checkboxes inscrits confirmés. Bouton Délivrer (désactivé si pas TERMINEE). Table certificats déjà délivrés.
          Files: `src/routes/association.certificats.tsx`
          Verify: `npm run build` passe.

- [ ] 21. Créer `src/routes/association.notifications.tsx` — notifications association.
          Même implémentation que benevole.notifications.tsx (centre notifs + préférences Switch).
          Files: `src/routes/association.notifications.tsx`
          Verify: `npm run build` passe.

- [ ] 22. Créer `src/routes/association.profil.tsx` — profil association.
          react-hook-form : nom, description, domaine, ville, contact, logo placeholder. Badge statut validation (En attente / Validée).
          Files: `src/routes/association.profil.tsx`
          Verify: `npm run build` — toutes les routes /association/* dans routeTree.gen.ts.

---

## Points d'attention TypeScript / TanStack Router

1. **routeTree.gen.ts est auto-généré** — ne jamais l'éditer. Chaque `npm run build` ou `npm run dev` le recrée depuis `src/routes/`.

2. **Nommage des routes** : `benevole.explorer.tsx` → route `/benevole/explorer`. Le point sépare les segments de chemin. Le layout parent s'appelle `benevole.tsx` (sans suffixe de segment).

3. **`createFileRoute` path** : le path doit correspondre exactement au chemin d'URL. Ex: `createFileRoute('/benevole/explorer')({...})` dans `benevole.explorer.tsx`.

4. **searchParams** : utiliser `validateSearch: z.object({...})` dans `Route` pour les routes avec query params (ex: `?id=`, `?mission=`).

5. **TypeScript strict** : `noUncheckedIndexedAccess` est activé — toujours garder la propriété optionnelle (`array[0]?.prop`) et non `array[0].prop`. `exactOptionalPropertyTypes` est activé — ne pas passer `undefined` là où la prop n'est pas marquée `?`.

6. **Leaflet SSR** : Leaflet ne supporte pas le SSR. Utiliser `React.lazy` + `<Suspense>` pour importer le composant carte, ou protéger avec `typeof window !== 'undefined'`. Fixer les icônes par défaut avec `L.Icon.Default.mergeOptions`.

7. **recharts + ChartContainer** : utiliser `ChartContainer` de `@/components/ui/chart.tsx` qui gère le `ResponsiveContainer` et les variables CSS de couleur.

8. **Toasts** : `import { toast } from 'sonner'` (pas de `useToast`). Le `<Toaster />` est déjà dans `__root.tsx` (ou l'ajouter si absent).

9. **useNavigate** : `const navigate = useNavigate()` de `@tanstack/react-router`. Appeler avec `navigate({ to: '/benevole' as const })`.

10. **Leaflet CSS** : `import 'leaflet/dist/leaflet.css'` doit être dans chaque composant qui utilise Leaflet, sinon les tiles ne s'affichent pas correctement.
