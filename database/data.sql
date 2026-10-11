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

-- Niveau est créé avant Benevole (Benevole en dépend)
CREATE TABLE Niveau (
    idNiveau BIGINT       NOT NULL AUTO_INCREMENT,
    nom      VARCHAR(50)  NOT NULL,
    PRIMARY KEY (idNiveau),
    CONSTRAINT uq_niveau_nom UNIQUE (nom)
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
    idNiveau            BIGINT       NULL,                   -- « obtient » Benevole-Niveau (le service affecte « Débutant » à l'inscription)
    PRIMARY KEY (idBenevole),
    CONSTRAINT fk_benevole_utilisateur FOREIGN KEY (idBenevole)
        REFERENCES Utilisateur (idUtilisateur),
    CONSTRAINT fk_benevole_niveau FOREIGN KEY (idNiveau)
        REFERENCES Niveau (idNiveau),
    CONSTRAINT ck_benevole_rayon CHECK (rayonDeplacementKm IS NULL OR rayonDeplacementKm >= 0)
) ENGINE=InnoDB;

CREATE TABLE Association (
    idAssociation    BIGINT       NOT NULL,
    nom              VARCHAR(150) NOT NULL,
    description      TEXT         NULL,
    ville            VARCHAR(100) NULL,
    contact          VARCHAR(255) NULL,
    statutValidation ENUM('EN_ATTENTE','VALIDE','REFUSE') NOT NULL DEFAULT 'EN_ATTENTE',  -- RM06 : seule une association VALIDE peut publier
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

CREATE TABLE Badge (
    idBadge  BIGINT       NOT NULL AUTO_INCREMENT,
    code     VARCHAR(50)  NOT NULL,
    nom      VARCHAR(100) NOT NULL,
    idNiveau BIGINT       NOT NULL,                          -- association « associé » : 1 badge <-> 1 niveau
    PRIMARY KEY (idBadge),
    CONSTRAINT uq_badge_code   UNIQUE (code),
    CONSTRAINT uq_badge_niveau UNIQUE (idNiveau),            -- Niveau 0..1 badge
    CONSTRAINT fk_badge_niveau FOREIGN KEY (idNiveau) REFERENCES Niveau (idNiveau)
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
--    Niveaux et badges d'après le cahier des charges (section Gamification)
-- =====================================================================

INSERT INTO Niveau (nom) VALUES ('Débutant'), ('Engagé'), ('Expert'), ('Champion');
-- ordre d'insertion = idNiveau 1..4 ; idNiveau 1 (Débutant) est le défaut de Benevole

INSERT INTO Badge (code, nom, idNiveau) VALUES
    ('PREMIERE_MISSION', 'Première mission', 1),
    ('ENGAGE',           'Engagé',           2),
    ('EXPERT',           'Expert',           3),
    ('CHAMPION',         'Champion',         4);

-- =====================================================================
-- 10. AJOUTS RECOMMANDÉS (hors MCD actuel) - à décommenter si vous les validez
-- =====================================================================
-- Seuils pour calculer niveaux et badges (cahier : 0-4 / 5-14 / 15-29 / 30+ ; badges à 1, 5, 15, 30)
-- ALTER TABLE Niveau ADD COLUMN seuilMissions INT NOT NULL DEFAULT 0;
-- ALTER TABLE Badge  ADD COLUMN seuilMissions INT NOT NULL DEFAULT 1;
-- UPDATE Niveau SET seuilMissions = 0  WHERE idNiveau = 1;
-- UPDATE Niveau SET seuilMissions = 5  WHERE idNiveau = 2;
-- UPDATE Niveau SET seuilMissions = 15 WHERE idNiveau = 3;
-- UPDATE Niveau SET seuilMissions = 30 WHERE idNiveau = 4;
-- UPDATE Badge  SET seuilMissions = 1  WHERE idBadge = 1;
-- UPDATE Badge  SET seuilMissions = 5  WHERE idBadge = 2;
-- UPDATE Badge  SET seuilMissions = 15 WHERE idBadge = 3;
-- UPDATE Badge  SET seuilMissions = 30 WHERE idBadge = 4;
