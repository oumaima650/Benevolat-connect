-- =====================================================================
-- Gamification : niveaux calculés + nouveaux badges (paliers et spéciaux)
-- À exécuter une fois sur benevolat_db AVANT de démarrer le backend.
-- Idempotent : peut être relancé sans erreur.
-- Noms en snake_case : Hibernate convertit @Column(name = "valeurCritere") en valeur_critere.
--
-- Ce que fait le script :
--   1. supprime la table niveau et les colonnes benevole.id_niveau / badge.id_niveau
--      (le niveau = nombre de certificats délivrés, il n'est plus stocké) ;
--   2. remplace les anciens badges (Première mission, Engagé, Expert, Champion)
--      par 6 badges PALIER (tous les 5 niveaux) et 5 badges SPECIAL ;
--   3. ajoute obtention.vu (célébration affichée) et inscription.est_renfort ;
--   4. attribue les badges PALIER déjà mérités. Les badges SPECIAL sont attribués
--      par le backend au démarrage (GamificationService).
-- =====================================================================

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS drop_column_if_exists;
DROP PROCEDURE IF EXISTS drop_fks_on_column;

DELIMITER $$
CREATE PROCEDURE add_column_if_missing(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(tbl) AND COLUMN_NAME = col
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', def);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

-- Supprime toutes les clés étrangères posées sur une colonne (noms générés par Hibernate inconnus)
CREATE PROCEDURE drop_fks_on_column(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
    DECLARE fin INT DEFAULT 0;
    DECLARE fk VARCHAR(64);
    DECLARE cur CURSOR FOR
        SELECT DISTINCT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(tbl)
          AND COLUMN_NAME = col AND REFERENCED_TABLE_NAME IS NOT NULL;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET fin = 1;
    OPEN cur;
    boucle: LOOP
        FETCH cur INTO fk;
        IF fin = 1 THEN LEAVE boucle; END IF;
        SET @ddl = CONCAT('ALTER TABLE ', tbl, ' DROP FOREIGN KEY ', fk);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
END$$

CREATE PROCEDURE drop_column_if_exists(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(tbl) AND COLUMN_NAME = col
    ) THEN
        CALL drop_fks_on_column(tbl, col);
        SET @ddl = CONCAT('ALTER TABLE ', tbl, ' DROP COLUMN ', col);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 1. Plus de table niveau : le niveau est calculé
-- ---------------------------------------------------------------------
CALL drop_column_if_exists('benevole', 'id_niveau');
CALL drop_column_if_exists('badge', 'id_niveau');
DROP TABLE IF EXISTS niveau;

-- ---------------------------------------------------------------------
-- 2. Nouveaux badges (les anciens ne sont plus attribués : on repart de zéro)
-- ---------------------------------------------------------------------
DELETE FROM obtention;
DELETE FROM badge;
ALTER TABLE badge AUTO_INCREMENT = 1;

CALL add_column_if_missing('badge', 'description', 'VARCHAR(255) NOT NULL');
CALL add_column_if_missing('badge', 'type', "ENUM('PALIER','SPECIAL') NOT NULL");
CALL add_column_if_missing('badge', 'critere',
    "ENUM('NIVEAU','RENFORT','MEME_ASSOCIATION','DOMAINES_DIFFERENTS','MEME_DOMAINE','MOIS_CONSECUTIFS') NOT NULL");
CALL add_column_if_missing('badge', 'valeur_critere', 'INT NOT NULL');
CALL add_column_if_missing('badge', 'theme', 'VARCHAR(30) NULL');
CALL add_column_if_missing('badge', 'ordre', 'INT NOT NULL DEFAULT 0');
-- Pas d'icône stockée : les médailles sont dessinées par le frontend à partir du code du badge
CALL drop_column_if_exists('badge', 'icone');

INSERT INTO badge (code, nom, description, type, critere, valeur_critere, theme, ordre) VALUES
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

-- ---------------------------------------------------------------------
-- 3. Nouvelles colonnes
-- ---------------------------------------------------------------------
CALL add_column_if_missing('obtention', 'vu', 'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_missing('inscription', 'est_renfort', 'BOOLEAN NOT NULL DEFAULT FALSE');

-- ---------------------------------------------------------------------
-- 4. Rattrapage : badges PALIER déjà mérités (niveau = nombre de certificats)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO obtention (id_benevole, id_badge, date_attribution, vu)
SELECT n.id_benevole, b.id_badge, NOW(), FALSE
FROM (
    SELECT i.id_benevole, COUNT(*) AS niveau
    FROM certificat c
    JOIN inscription i ON i.id_inscription = c.id_inscription
    GROUP BY i.id_benevole
) n
JOIN badge b ON b.type = 'PALIER' AND b.critere = 'NIVEAU' AND n.niveau >= b.valeur_critere;

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS drop_column_if_exists;
DROP PROCEDURE IF EXISTS drop_fks_on_column;

-- Vérification
SELECT code, nom, type, critere, valeur_critere, theme FROM badge ORDER BY ordre;
