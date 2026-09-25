-- ============================================================
-- VolunteerConnect – Initialisation de la base de données MySQL
-- Charset utf8mb4 : supporte tous les caractères Unicode
--   (emojis compris) et est recommandé par MySQL 8.
-- ============================================================

CREATE DATABASE IF NOT EXISTS benevolat_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE benevolat_db;

-- Les tables sont créées automatiquement par Hibernate (ddl-auto=update).
-- Ce fichier sert à initialiser la base si elle n'existe pas encore.
-- Exécuter une seule fois avant le premier lancement du backend :
--   mysql -u root -p < database/schema.sql
