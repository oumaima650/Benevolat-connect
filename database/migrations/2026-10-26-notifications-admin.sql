-- =====================================================================
-- Notifications (F28-F31) + espace administrateur (F39-F41)
-- À exécuter une fois sur benevolat_db AVANT de démarrer le backend
-- (spring.jpa.hibernate.ddl-auto=validate).
-- Idempotent : chaque colonne n'est ajoutée que si elle n'existe pas déjà.
-- =====================================================================

DROP PROCEDURE IF EXISTS add_column_if_missing;

DELIMITER $$
CREATE PROCEDURE add_column_if_missing(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', def);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- Notification : catégorie de l'événement + lien vers la page concernée
CALL add_column_if_missing('Notification', 'categorie', "VARCHAR(30) NOT NULL DEFAULT 'SYSTEME'");
CALL add_column_if_missing('Notification', 'lien', 'VARCHAR(255) NULL');

-- Association : motif de refus saisi par l'administrateur (F39)
CALL add_column_if_missing('Association', 'motifRefus', 'VARCHAR(500) NULL');

-- Mission : modération (F41)
CALL add_column_if_missing('Mission', 'motifSignalement', 'VARCHAR(500) NULL');
CALL add_column_if_missing('Mission', 'estMasquee', 'BOOLEAN NOT NULL DEFAULT FALSE');

DROP PROCEDURE IF EXISTS add_column_if_missing;
