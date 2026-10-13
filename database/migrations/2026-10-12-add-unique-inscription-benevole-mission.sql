-- =====================================================================
-- Contrainte unique (idBenevole, idMission) sur la table Inscription
-- Garantit qu'un bénévole ne peut pas avoir deux inscriptions pour la même mission.
-- Idempotent : ne fait rien si la contrainte existe déjà.
-- =====================================================================

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Inscription'
      AND CONSTRAINT_NAME = 'uq_inscription_benevole_mission'
);

SET @sql = IF(
    @exists = 0,
    'ALTER TABLE Inscription ADD CONSTRAINT uq_inscription_benevole_mission UNIQUE (idBenevole, idMission)',
    'SELECT ''contrainte uq_inscription_benevole_mission deja existante'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
