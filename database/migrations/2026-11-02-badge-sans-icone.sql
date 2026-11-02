-- =====================================================================
-- Badges sans émoji : la colonne badge.icone est supprimée.
-- Les médailles sont dessinées par le frontend à partir du code du badge.
-- À exécuter une fois sur benevolat_db si la première version de
-- 2026-11-01-gamification-niveaux-badges.sql (avec icone) a déjà été appliquée.
-- Idempotent : ne fait rien si la colonne n'existe plus.
-- =====================================================================

DROP PROCEDURE IF EXISTS drop_column_if_exists;

DELIMITER $$
CREATE PROCEDURE drop_column_if_exists(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(tbl) AND COLUMN_NAME = col
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', tbl, ' DROP COLUMN ', col);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL drop_column_if_exists('badge', 'icone');

DROP PROCEDURE IF EXISTS drop_column_if_exists;

-- Vérification : l'ordre d'affichage couvre les badges paliers (1-6) puis spéciaux (7-11)
SELECT ordre, code, nom, type, critere, valeur_critere, theme FROM badge ORDER BY ordre;
