# Workflows n8n — CountMeIn

n8n envoie les e-mails **planifiés et non critiques**, rédigés par l'IA (Claude). Tous les e-mails
liés à une action (inscription, liste d'attente, promotion, annulation, validation, certificat…)
partent directement du backend avec les templates Java (`EmailTemplates.java`) : ils ne dépendent pas de n8n.

| Workflow | Déclencheur | Ce qu'il fait |
|---|---|---|
| `01-rappel-24h.json` | Toutes les heures | Rappel personnalisé aux inscrits confirmés dont la mission commence dans les 24 h (F29) |
| `02-renfort-urgent.json` | Webhook appelé par le backend | Invite les bénévoles **proches** (non inscrits) quand une association demande un renfort |
| `03-resume-hebdomadaire.json` | Chaque lundi à 9 h | Envoie à chaque bénévole 1 à 3 missions recommandées, avec une explication |

```
Backend Spring Boot                                   n8n                               Claude / SMTP
───────────────────                                   ───                               ─────────────
GET  /api/n8n/rappels            ◄── toutes les heures ── Rappel 24 h ──► rédaction IA ──► e-mail
POST /api/n8n/rappels/{id}/envoye ◄──────────────────────┘
demande de renfort ── POST {N8N_BASE_URL}/renfort ──► Renfort urgent
GET  /api/n8n/renforts/{id}/benevoles ◄─────────────────┘               ──► rédaction IA ──► e-mails
GET  /api/n8n/digest             ◄── lundi 9 h ───────── Résumé hebdo  ──► rédaction IA ──► e-mails
```

**Règle importante (RM13)** : n8n ne décide de rien. Le backend choisit qui reçoit quoi (filtres,
distance, score, préférences e-mail) ; n8n se contente de rédiger avec l'IA et d'envoyer.

**Résilience (NF07)** :
- si Claude ne répond pas ou refuse, un texte standard est envoyé à la place (F48) ;
- si n8n est arrêté, le backend envoie lui-même les rappels encore en attente 3 h avant la mission.

---

## 1. Lancer n8n

Prérequis : Docker Desktop.

```bash
cd n8n
docker compose up -d
```

Ouvrez http://localhost:5678 et créez le compte propriétaire (local, aucune donnée envoyée).

> Le backend tourne sur votre machine, pas dans Docker : depuis n8n, il est joignable à
> `http://host.docker.internal:8080` (déjà configuré dans les workflows).

## 2. Configurer le backend

Dans `backend/.env`, ajoutez puis **redémarrez le backend** :

```properties
N8N_BASE_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=une-longue-chaine-aleatoire
```

Générer un secret : `openssl rand -hex 32` (ou n'importe quelle longue chaîne aléatoire).

- Le même secret protège les deux sens : n8n → backend (`/api/n8n/**`) et backend → n8n (webhook renfort).
- Tant que ces variables sont vides, n8n est **désactivé** : le backend envoie lui-même tous les rappels.

## 3. Créer les identifiants dans n8n

Menu **Overview → Credentials → Create credential**.

| Nom à donner | Type | Champs |
|---|---|---|
| **CountMeIn backend** | Header Auth | Name : `X-Webhook-Secret` — Value : la valeur de `N8N_WEBHOOK_SECRET` |
| **Anthropic API** | Header Auth | Name : `x-api-key` — Value : votre clé API Anthropic (console.anthropic.com) |
| **SMTP CountMeIn** | SMTP | Host `smtp.gmail.com`, Port `587`, SSL/TLS désactivé (STARTTLS), User/Password : les mêmes que `MAIL_USERNAME` / `MAIL_PASSWORD` |

La clé API et le mot de passe restent chiffrés dans n8n : ils ne sont jamais écrits dans les fichiers JSON des workflows (NF01).

## 4. Importer les workflows

Pour chacun des 3 fichiers de `n8n/workflows/` :

1. **Overview → Create workflow → ⋯ (en haut à droite) → Import from File**.
2. Ouvrez chaque nœud marqué d'un avertissement et choisissez l'identifiant (la note du nœud indique lequel) :
   - nœuds HTTP vers le backend et nœud Webhook → **CountMeIn backend** ;
   - nœud **Rediger avec Claude** → **Anthropic API** ;
   - nœud **Envoyer l e-mail** → **SMTP CountMeIn**.
3. Dans **Envoyer l e-mail**, remplacez `votre.adresse@gmail.com` par l'adresse d'expédition (la même que `MAIL_USERNAME`).
4. **Save**.

## 5. Tester (avant d'activer)

### Rappel 24 h
1. Créez une mission qui commence dans moins de 24 h et inscrivez un bénévole (avec une vraie adresse e-mail).
2. Ouvrez le workflow et cliquez **Execute workflow**.
3. Vérifiez chaque nœud (cliquez dessus pour voir les données) puis la boîte de réception.
4. Relancez : rien ne doit partir une 2ᵉ fois (le dernier nœud marque l'inscription comme rappelée).

### Renfort urgent
1. Dans le nœud **Renfort declare**, cliquez **Listen for test event**.
2. Côté association, demandez un renfort sur une mission (ou simulez l'appel du backend) :
   ```bash
   curl -X POST http://localhost:5678/webhook-test/renfort \
     -H "Content-Type: application/json" -H "X-Webhook-Secret: VOTRE_SECRET" \
     -d '{"missionId": 12, "titre": "Test", "placesRestantes": 2}'
   ```
3. Les bénévoles proches reçoivent l'invitation. S'il n'y en a aucun, vérifiez qu'ils ont une ville
   (ou une position GPS) dans leur profil, un compte actif et les e-mails activés.

### Résumé hebdomadaire
Cliquez **Execute workflow**. Seuls les bénévoles avec au moins une mission recommandée (score ≥ 40)
reçoivent un e-mail. Pour voir la liste sans rien envoyer :
```bash
curl http://localhost:8080/api/n8n/digest -H "X-Webhook-Secret: VOTRE_SECRET"
```

## 6. Activer

Passez chaque workflow sur **Active** (interrupteur en haut à droite). Le webhook de production
devient `http://localhost:5678/webhook/renfort`, l'URL utilisée par le backend (`N8N_BASE_URL` + `/renfort`).

## 7. Modèle d'IA

Les workflows appellent l'API Messages d'Anthropic (`POST https://api.anthropic.com/v1/messages`) :

- **modèle** `claude-opus-5-5` ;
- **effort** `low` : les e-mails sont courts, inutile de faire réfléchir longtemps le modèle ;
- **sortie JSON imposée** (`output_config.format`) : la réponse respecte toujours le schéma attendu
  (sujet, titre, paragraphes) ;
- **`fallbacks: "default"`** (en-tête `anthropic-beta: server-side-fallback-2026-07-01`) : si le modèle
  refuse une demande, l'API la relance automatiquement sur un autre modèle.

Pour changer de modèle, modifiez `model` dans le nœud **Preparer la requete IA** de chaque workflow.

Données envoyées à l'IA : uniquement le prénom, la ville, les centres d'intérêt et les informations
publiques de la mission (jamais l'e-mail, le nom de famille ou le téléphone).

## 8. Dépannage

| Symptôme | Cause probable |
|---|---|
| `401 Secret n8n invalide` | La valeur de l'identifiant **CountMeIn backend** ≠ `N8N_WEBHOOK_SECRET` |
| `503 Intégration n8n non configurée` | `N8N_WEBHOOK_SECRET` vide dans `backend/.env`, ou backend pas redémarré |
| `ECONNREFUSED host.docker.internal:8080` | Le backend n'est pas lancé |
| E-mail reçu avec le texte standard | Erreur de l'IA : ouvrez le nœud **Rediger avec Claude** pour lire la réponse (clé invalide, crédit épuisé…) |
| Le renfort ne déclenche rien | Workflow non activé, `N8N_BASE_URL` vide, ou plus aucune place libre après la promotion de la liste d'attente |
| Erreur SMTP `535` | Utilisez un **mot de passe d'application** Gmail, pas le mot de passe du compte |

## 9. Modifier un workflow

Après modification dans n8n : **⋯ → Download**, puis remplacez le fichier dans `n8n/workflows/`
et commitez-le, pour que toute l'équipe ait la même version.
