-- =====================================================================
-- Niveaux bénévoles : nombre de missions requis pour atteindre le niveau
-- À exécuter une fois sur benevolat_db AVANT de démarrer le backend
-- (nécessaire avec spring.jpa.hibernate.ddl-auto=validate).
-- Idempotent : la colonne n'est ajoutée que si elle n'existe pas déjà.
-- Hibernate convertit @Column(name = "seuilMissions") en seuil_missions.
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

CALL add_column_if_missing('Niveau', 'seuil_missions', 'INT NULL');

DROP PROCEDURE IF EXISTS add_column_if_missing;
