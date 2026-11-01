-- =====================================================================
-- CountMeIn - Plateforme de bénévolat intelligente
-- Script de création de la base (MySQL 8.0.16+ : les CHECK sont appliqués)
-- Source : MCD + diagramme de classes (fichier drawio)
-- Noms de tables et d'attributs identiques au MCD ; seules les tables
-- issues d'associations plusieurs-à-plusieurs ont reçu un nom explicite.
-- =====================================================================

DROP DATABASE IF EXISTS countmein;
CREATE DATABASE countmein CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE countmein;

-- =====================================================================
-- 1. HÉRITAGE : Utilisateur (abstraite) -> Administrateur / Benevole / Association
--    Stratégie JOINED : les tables filles partagent la clé de la table mère
--    (idBenevole = idUtilisateur, etc.)
-- =====================================================================

CREATE TABLE Utilisateur (
    idUtilisateur   BIGINT        NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)  NOT NULL,
    motDePasse      VARCHAR(255)  NOT NULL,                 -- hash BCrypt
    statut          ENUM('ACTIF','SUSPENDUE','DESACTIVE') NOT NULL DEFAULT 'ACTIF',
    notifEstActive  BOOLEAN       NOT NULL DEFAULT TRUE,
    photoProfil     VARCHAR(500)  NULL,
    createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idUtilisateur),
    CONSTRAINT uq_utilisateur_email UNIQUE (email)           -- RM01
) ENGINE=InnoDB;

CREATE TABLE Administrateur (
    idAdministrateur BIGINT NOT NULL,                        -- absent du MCD, nécessaire comme clé
    PRIMARY KEY (idAdministrateur),
    CONSTRAINT fk_admin_utilisateur FOREIGN KEY (idAdministrateur)
        REFERENCES Utilisateur (idUtilisateur)
) ENGINE=InnoDB;

CREATE TABLE Benevole (
    idBenevole          BIGINT       NOT NULL,
    nom                 VARCHAR(100) NULL,
    prenom              VARCHAR(100) NULL,
    dateNaissance       DATE         NULL,
    ville               VARCHAR(100) NULL,
    latitude            DOUBLE       NULL,
    longitude           DOUBLE       NULL,
    biographie          TEXT         NULL,
    rayonDeplacementKm  DOUBLE       NULL,
    telephone           VARCHAR(20)  NULL,
    -- Gamification : le niveau n'est pas stocké, il vaut le nombre de certificats délivrés
    -- (1 mission avec certificat = +1 niveau). Les noms des niveaux sont définis dans le backend.
    PRIMARY KEY (idBenevole),
    CONSTRAINT fk_benevole_utilisateur FOREIGN KEY (idBenevole)
        REFERENCES Utilisateur (idUtilisateur),
    CONSTRAINT ck_benevole_rayon CHECK (rayonDeplacementKm IS NULL OR rayonDeplacementKm >= 0)
) ENGINE=InnoDB;

CREATE TABLE Association (
    idAssociation    BIGINT       NOT NULL,
    nom              VARCHAR(150) NOT NULL,
    description      TEXT         NULL,
    ville            VARCHAR(100) NULL,
    contact          VARCHAR(255) NULL,
    statutValidation ENUM('EN_ATTENTE','VALIDE','REFUSE') NOT NULL DEFAULT 'EN_ATTENTE',  -- RM06 : seule une association VALIDE peut publier
    motifRefus       VARCHAR(500) NULL,                      -- F39 : motif saisi par l'administrateur
    latitude         DOUBLE       NULL,
    longitude        DOUBLE       NULL,
    idAdministrateur BIGINT       NULL,                      -- « valide » : administrateur qui a traité la demande (NULL tant qu'en attente)
    PRIMARY KEY (idAssociation),
    CONSTRAINT fk_association_utilisateur FOREIGN KEY (idAssociation)
        REFERENCES Utilisateur (idUtilisateur),
    CONSTRAINT fk_association_admin FOREIGN KEY (idAdministrateur)
        REFERENCES Administrateur (idAdministrateur)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. RÉFÉRENTIELS : Domaine, Competence, Badge
-- =====================================================================

CREATE TABLE Domaine (
    idDomaine   BIGINT       NOT NULL AUTO_INCREMENT,
    nom         VARCHAR(100) NOT NULL,
    description TEXT         NULL,
    categorie   VARCHAR(100) NULL,
    PRIMARY KEY (idDomaine),
    CONSTRAINT uq_domaine_nom UNIQUE (nom)
) ENGINE=InnoDB;

CREATE TABLE Competence (
    idCompetence BIGINT       NOT NULL AUTO_INCREMENT,
    nom          VARCHAR(100) NOT NULL,
    description  TEXT         NULL,
    categorie    VARCHAR(100) NULL,
    PRIMARY KEY (idCompetence),
    CONSTRAINT uq_competence_nom UNIQUE (nom)
) ENGINE=InnoDB;

-- PALIER  : obtenu en atteignant un niveau (tous les 5 niveaux) ; débloque une bannière de profil.
-- SPECIAL : obtenu selon un critère d'engagement (renfort, fidélité, diversité…).
CREATE TABLE Badge (
    idBadge        BIGINT       NOT NULL AUTO_INCREMENT,
    code           VARCHAR(50)  NOT NULL,
    nom            VARCHAR(100) NOT NULL,
    description    VARCHAR(255) NOT NULL,
    type           ENUM('PALIER','SPECIAL') NOT NULL,
    critere        ENUM('NIVEAU','RENFORT','MEME_ASSOCIATION','DOMAINES_DIFFERENTS',
                        'MEME_DOMAINE','MOIS_CONSECUTIFS') NOT NULL,
    valeurCritere  INT          NOT NULL,                    -- niveau à atteindre, nombre de missions, de domaines ou de mois
    theme          VARCHAR(30)  NULL,                        -- thème de la bannière de profil (badges PALIER)
    ordre          INT          NOT NULL DEFAULT 0,          -- ordre d'affichage
    PRIMARY KEY (idBadge),
    CONSTRAINT uq_badge_code UNIQUE (code),
    CONSTRAINT ck_badge_valeur CHECK (valeurCritere > 0)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. MISSION et ses dépendances
-- =====================================================================

CREATE TABLE Mission (
    idMission             BIGINT       NOT NULL AUTO_INCREMENT,
    titre                 VARCHAR(150) NOT NULL,
    description           TEXT         NULL,
    adresse               VARCHAR(255) NULL,
    latitude              DECIMAL(9,6) NULL,
    longitude             DECIMAL(9,6) NULL,
    dateDebut             DATETIME     NOT NULL,
    dateFin               DATETIME     NOT NULL,
    nbPlaces              INT          NOT NULL,
    nbRenfortDemande      INT          NOT NULL DEFAULT 0,
    nbPlacesListeAttente  INT          NOT NULL DEFAULT 0,
    statut ENUM('BROUILLON','PUBLIEE','COMPLETE','EN_COURS',
                'RENFORT_URGENT','TERMINEE','CLOTUREE','ANNULEE')
                                       NOT NULL DEFAULT 'BROUILLON',
    estSignalee           BOOLEAN      NOT NULL DEFAULT FALSE,
    motifSignalement      VARCHAR(500) NULL,                 -- F41 : motif du dernier signalement
    estMasquee            BOOLEAN      NOT NULL DEFAULT FALSE, -- F41 : masquée par un administrateur
    createdAt             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    idAssociation         BIGINT       NOT NULL,             -- « publie »
    idDomaine             BIGINT       NOT NULL,             -- « classe »
    PRIMARY KEY (idMission),
    CONSTRAINT fk_mission_association FOREIGN KEY (idAssociation) REFERENCES Association (idAssociation),
    CONSTRAINT fk_mission_domaine     FOREIGN KEY (idDomaine)     REFERENCES Domaine (idDomaine),
    CONSTRAINT ck_mission_dates   CHECK (dateFin > dateDebut),
    CONSTRAINT ck_mission_places  CHECK (nbPlaces > 0),
    CONSTRAINT ck_mission_renfort CHECK (nbRenfortDemande >= 0 AND nbPlacesListeAttente >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_mission_statut_date ON Mission (statut, dateDebut);
CREATE INDEX idx_mission_association ON Mission (idAssociation);

CREATE TABLE ImageEvenement (
    idImage         BIGINT       NOT NULL AUTO_INCREMENT,
    URL             VARCHAR(500) NOT NULL,
    description     TEXT         NULL,
    datePublication DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    titre           VARCHAR(150) NULL,                       -- ajout de l'équipe (à reporter dans le MCD)
    idMission       BIGINT       NOT NULL,                   -- « obtient » Mission-ImageEvenement
    PRIMARY KEY (idImage),
    CONSTRAINT fk_imgevt_mission FOREIGN KEY (idMission) REFERENCES Mission (idMission) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. INSCRIPTION (association « s'inscrit » Benevole-Mission)
-- =====================================================================

CREATE TABLE Inscription (
    idInscription    BIGINT   NOT NULL AUTO_INCREMENT,       -- clé technique ajoutée (JPA + FK de Certificat)
    idBenevole       BIGINT   NOT NULL,
    idMission        BIGINT   NOT NULL,
    statut           ENUM('CONFIRMEE','EN_LISTE_ATTENTE','ANNULEE') NOT NULL,
    rang             INT      NULL,                          -- rang en liste d'attente (NULL si confirmée/annulée)
    dateInscription  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rappelEnvoye     BOOLEAN  NOT NULL DEFAULT FALSE,        -- F29 : un seul rappel par inscription
    estRenfort       BOOLEAN  NOT NULL DEFAULT FALSE,        -- venue en réponse à un renfort urgent (badge « Renfort de choc »)
    PRIMARY KEY (idInscription),
    CONSTRAINT uq_inscription_benevole_mission UNIQUE (idBenevole, idMission),   -- RM02
    CONSTRAINT fk_inscription_benevole FOREIGN KEY (idBenevole) REFERENCES Benevole (idBenevole),
    CONSTRAINT fk_inscription_mission  FOREIGN KEY (idMission)  REFERENCES Mission (idMission),
    CONSTRAINT ck_inscription_rang CHECK (rang IS NULL OR rang >= 1)
) ENGINE=InnoDB;

CREATE INDEX idx_inscription_mission_statut ON Inscription (idMission, statut, dateInscription);

CREATE TABLE ImageParticipation (
    idImage         BIGINT       NOT NULL AUTO_INCREMENT,
    URL             VARCHAR(500) NOT NULL,
    description     TEXT         NULL,
    datePublication DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idInscription   BIGINT       NOT NULL,                   -- « associe »
    PRIMARY KEY (idImage),
    CONSTRAINT fk_imgpart_inscription FOREIGN KEY (idInscription) REFERENCES Inscription (idInscription) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Certificat (
    idCertificat      BIGINT       NOT NULL AUTO_INCREMENT,
    codeVerification  VARCHAR(64)  NOT NULL,
    dateDelivrance    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    urlPdf            VARCHAR(500) NULL,
    idInscription     BIGINT       NOT NULL,                 -- « atteste »
    PRIMARY KEY (idCertificat),
    CONSTRAINT uq_certificat_code        UNIQUE (codeVerification),   -- RM09
    CONSTRAINT uq_certificat_inscription UNIQUE (idInscription),      -- RM08 : 1 certificat par bénévole et par mission
    CONSTRAINT fk_certificat_inscription FOREIGN KEY (idInscription) REFERENCES Inscription (idInscription)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. SCORE DE MATCHING (association « score » Benevole-Mission)
-- =====================================================================

CREATE TABLE ScoreMatching (
    idScore     BIGINT   NOT NULL AUTO_INCREMENT,
    idBenevole  BIGINT   NOT NULL,
    idMission   BIGINT   NOT NULL,
    score       INT      NOT NULL,
    explication TEXT     NULL,
    methode     ENUM('IA','FORMULE') NOT NULL,
    dateCalcul  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idScore),
    CONSTRAINT uq_score_benevole_mission UNIQUE (idBenevole, idMission),
    CONSTRAINT fk_score_benevole FOREIGN KEY (idBenevole) REFERENCES Benevole (idBenevole) ON DELETE CASCADE,
    CONSTRAINT fk_score_mission  FOREIGN KEY (idMission)  REFERENCES Mission (idMission)  ON DELETE CASCADE,
    CONSTRAINT ck_score_borne CHECK (score BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. BADGES OBTENUS (association « obtient » Benevole-Badge)
-- =====================================================================

CREATE TABLE Obtention (
    idObtention      BIGINT   NOT NULL AUTO_INCREMENT,
    idBenevole       BIGINT   NOT NULL,
    idBadge          BIGINT   NOT NULL,
    dateAttribution  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vu               BOOLEAN  NOT NULL DEFAULT FALSE,        -- célébration déjà affichée au bénévole
    PRIMARY KEY (idObtention),
    CONSTRAINT uq_obtention UNIQUE (idBenevole, idBadge),    -- RM11
    CONSTRAINT fk_obtention_benevole FOREIGN KEY (idBenevole) REFERENCES Benevole (idBenevole),
    CONSTRAINT fk_obtention_badge    FOREIGN KEY (idBadge)    REFERENCES Badge (idBadge)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. TABLES DE JOINTURE (plusieurs-à-plusieurs sans attribut)
-- =====================================================================

-- « se specialise » : Association 0..* <-> 0..* Domaine
CREATE TABLE AssociationDomaine (
    idAssociation BIGINT NOT NULL,
    idDomaine     BIGINT NOT NULL,
    PRIMARY KEY (idAssociation, idDomaine),
    CONSTRAINT fk_assodom_association FOREIGN KEY (idAssociation) REFERENCES Association (idAssociation) ON DELETE CASCADE,
    CONSTRAINT fk_assodom_domaine     FOREIGN KEY (idDomaine)     REFERENCES Domaine (idDomaine)         ON DELETE CASCADE
) ENGINE=InnoDB;

-- « s'intéresse » : Benevole 0..* <-> 0..* Domaine (centres d'intérêt)
CREATE TABLE BenevoleDomaine (
    idBenevole BIGINT NOT NULL,
    idDomaine  BIGINT NOT NULL,
    PRIMARY KEY (idBenevole, idDomaine),
    CONSTRAINT fk_bendom_benevole FOREIGN KEY (idBenevole) REFERENCES Benevole (idBenevole) ON DELETE CASCADE,
    CONSTRAINT fk_bendom_domaine  FOREIGN KEY (idDomaine)  REFERENCES Domaine (idDomaine)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- « maîtrise » : Benevole 0..* <-> 0..* Competence
CREATE TABLE BenevoleCompetence (
    idBenevole   BIGINT NOT NULL,
    idCompetence BIGINT NOT NULL,
    PRIMARY KEY (idBenevole, idCompetence),
    CONSTRAINT fk_bencomp_benevole   FOREIGN KEY (idBenevole)   REFERENCES Benevole (idBenevole)     ON DELETE CASCADE,
    CONSTRAINT fk_bencomp_competence FOREIGN KEY (idCompetence) REFERENCES Competence (idCompetence) ON DELETE CASCADE
) ENGINE=InnoDB;

-- « requiert » : Mission 0..* <-> 0..* Competence
CREATE TABLE MissionCompetence (
    idMission    BIGINT NOT NULL,
    idCompetence BIGINT NOT NULL,
    PRIMARY KEY (idMission, idCompetence),
    CONSTRAINT fk_miscomp_mission    FOREIGN KEY (idMission)    REFERENCES Mission (idMission)       ON DELETE CASCADE,
    CONSTRAINT fk_miscomp_competence FOREIGN KEY (idCompetence) REFERENCES Competence (idCompetence) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. NOTIFICATION (association « recoit » Utilisateur-Notification)
-- =====================================================================

CREATE TABLE Notification (
    idNotification BIGINT       NOT NULL AUTO_INCREMENT,
    idUtilisateur  BIGINT       NOT NULL,
    type           ENUM('EMAIL','NOTIF_PUSH') NOT NULL,
    titre          VARCHAR(200) NOT NULL,
    message        TEXT         NOT NULL,
    lue            BOOLEAN      NOT NULL DEFAULT FALSE,
    statutEnvoi    ENUM('EN_ATTENTE','ENVOYE','ECHEC') NOT NULL DEFAULT 'EN_ATTENTE',
    categorie      VARCHAR(30)  NOT NULL DEFAULT 'SYSTEME',      -- événement à l'origine (F28) ; type = canal
    lien           VARCHAR(255) NULL,                            -- page de l'application concernée
    createdAt      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idNotification),
    CONSTRAINT fk_notification_utilisateur FOREIGN KEY (idUtilisateur) REFERENCES Utilisateur (idUtilisateur)
) ENGINE=InnoDB;

CREATE INDEX idx_notification_user_lue ON Notification (idUtilisateur, lue);

-- Réinitialisation du mot de passe (F05) : un jeton actif par utilisateur
CREATE TABLE PasswordResetToken (
    idToken         BIGINT       NOT NULL AUTO_INCREMENT,
    token           VARCHAR(255) NOT NULL,
    idUtilisateur   BIGINT       NOT NULL,
    dateExpiration  DATETIME     NOT NULL,
    PRIMARY KEY (idToken),
    CONSTRAINT uq_prt_token       UNIQUE (token),
    CONSTRAINT uq_prt_utilisateur UNIQUE (idUtilisateur),
    CONSTRAINT fk_prt_utilisateur FOREIGN KEY (idUtilisateur) REFERENCES Utilisateur (idUtilisateur) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 9. DONNÉES DE RÉFÉRENCE (Badge est « une table prédéfinie » dans le MCD)
--    Niveau = nombre de certificats ; un badge PALIER tous les 5 niveaux.
-- =====================================================================

INSERT INTO Badge (code, nom, description, type, critere, valeurCritere, theme, ordre) VALUES
    ('ETINCELLE',       'Étincelle',       'Atteindre le niveau 5 : tes premières missions ont allumé l''étincelle.',  'PALIER',  'NIVEAU',              5, 'etincelle', 1),
    ('FLAMME',          'Flamme',          'Atteindre le niveau 10 : ton engagement brûle d''une belle flamme.',        'PALIER',  'NIVEAU',             10, 'flamme', 2),
    ('PHARE',           'Phare',           'Atteindre le niveau 15 : tu guides et inspires les autres bénévoles.',     'PALIER',  'NIVEAU',             15, 'phare', 3),
    ('ETOILE',          'Étoile',          'Atteindre le niveau 20 : une étoile de la solidarité.',                    'PALIER',  'NIVEAU',             20, 'etoile', 4),
    ('CONSTELLATION',   'Constellation',   'Atteindre le niveau 25 : ton impact relie toute une communauté.',          'PALIER',  'NIVEAU',             25, 'constellation', 5),
    ('LEGENDE',         'Légende',         'Atteindre le niveau 30 : une légende du bénévolat.',                       'PALIER',  'NIVEAU',             30, 'legende', 6),
    ('RENFORT_DE_CHOC', 'Renfort de choc', 'Répondre présent à un renfort urgent.',                                    'SPECIAL', 'RENFORT',             1, NULL, 7),
    ('FIDELE',          'Fidèle',          'Réaliser 3 missions avec la même association.',                            'SPECIAL', 'MEME_ASSOCIATION',    3, NULL, 8),
    ('EXPLORATEUR',     'Explorateur',     'Réaliser des missions dans 3 domaines différents.',                        'SPECIAL', 'DOMAINES_DIFFERENTS', 3, NULL, 9),
    ('SPECIALISTE',     'Spécialiste',     'Réaliser 5 missions dans un même domaine.',                                'SPECIAL', 'MEME_DOMAINE',        5, NULL, 10),
    ('REGULIER',        'Régulier',        'Réaliser au moins une mission par mois pendant 3 mois d''affilée.',        'SPECIAL', 'MOIS_CONSECUTIFS',    3, NULL, 11);
