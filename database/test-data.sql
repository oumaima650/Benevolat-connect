-- =====================================================================
-- Données de test pour CountMeIn
-- Création de missions dans différents états pour tester les filtres
-- =====================================================================

USE countmein;

-- =====================================================================
-- 1. UTILISATEURS
-- =====================================================================

-- Administrateur
INSERT INTO Utilisateur (email, motDePasse, statut, notifEstActive, createdAt, updatedAt)
VALUES ('admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIF', TRUE, NOW(), NOW());
SET @adminId = LAST_INSERT_ID();
INSERT INTO Administrateur (idAdministrateur) VALUES (@adminId);

-- Association 1 (avec statut VALIDE)
INSERT INTO Utilisateur (email, motDePasse, statut, notifEstActive, createdAt, updatedAt)
VALUES ('asso1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIF', TRUE, NOW(), NOW());
SET @asso1Id = LAST_INSERT_ID();
INSERT INTO Association (idAssociation, nom, description, ville, contact, statutValidation, latitude, longitude, idAdministrateur)
VALUES (@asso1Id, 'Croix Rouge Locale', 'Organisation humanitaire locale', 'Casablanca', 'contact@croixrouge.ma', 'VALIDE', 33.5731, -7.5898, @adminId);

-- Association 2 (avec statut VALIDE)
INSERT INTO Utilisateur (email, motDePasse, statut, notifEstActive, createdAt, updatedAt)
VALUES ('asso2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIF', TRUE, NOW(), NOW());
SET @asso2Id = LAST_INSERT_ID();
INSERT INTO Association (idAssociation, nom, description, ville, contact, statutValidation, latitude, longitude, idAdministrateur)
VALUES (@asso2Id, 'Banque Alimentaire', 'Distribution alimentaire', 'Rabat', 'contact@banquealimentaire.ma', 'VALIDE', 34.0209, -6.8416, @adminId);

-- Association 3 (avec statut VALIDE)
INSERT INTO Utilisateur (email, motDePasse, statut, notifEstActive, createdAt, updatedAt)
VALUES ('asso3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIF', TRUE, NOW(), NOW());
SET @asso3Id = LAST_INSERT_ID();
INSERT INTO Association (idAssociation, nom, description, ville, contact, statutValidation, latitude, longitude, idAdministrateur)
VALUES (@asso3Id, 'Ecole du Quartier', 'Soutien scolaire', 'Tanger', 'contact@ecole.ma', 'VALIDE', 35.7595, -5.8340, @adminId);

-- Bénévole de test
INSERT INTO Utilisateur (email, motDePasse, statut, notifEstActive, createdAt, updatedAt)
VALUES ('benevole@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIF', TRUE, NOW(), NOW());
SET @benevoleId = LAST_INSERT_ID();
INSERT INTO Benevole (idBenevole, nom, prenom, dateNaissance, ville, latitude, longitude, biographie, rayonDeplacementKm, telephone)
VALUES (@benevoleId, 'Dupont', 'Jean', '1990-05-15', 'Casablanca', 33.5731, -7.5898, 'Bénévole passionné', 50, '0612345678');

-- =====================================================================
-- 2. DOMAINES ET COMPÉTENCES
-- =====================================================================

INSERT INTO Domaine (nom, description, categorie) VALUES
('Humanitaire', 'Aide humanitaire et sociale', 'Social'),
('Education', 'Soutien éducatif et scolaire', 'Education'),
('Environnement', 'Protection de l''environnement', 'Ecologie'),
('Santé', 'Soutien sanitaire et médical', 'Santé');

INSERT INTO Competence (nom, description, categorie) VALUES
('Animation', 'Animation de groupes', 'Social'),
('Premiers secours', 'Formation premiers secours', 'Santé'),
('Enseignement', 'Soutien pédagogique', 'Education'),
('Bricolage', 'Travaux manuels', 'Technique'),
('Langues', 'Traduction et interprétariat', 'Communication');

-- =====================================================================
-- 3. MISSIONS DANS DIFFÉRENTS ÉTATS
-- =====================================================================

-- Mission 1: PUBLIEE (disponible, places restantes)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Distribution alimentaire', 'Distribution de repas aux sans-abris', 'Centre social Casablanca', 33.5731, -7.5898,
        DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 10, 0, 0, 'PUBLIEE', FALSE, @asso1Id, 1);
SET @mission1Id = LAST_INSERT_ID();

-- Mission 2: PUBLIEE (disponible, géolocalisée)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Journée de nettoyage', 'Nettoyage du parc', 'Parc Hassan II', 33.5929, -7.6304,
        DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 15, 0, 0, 'PUBLIEE', FALSE, @asso1Id, 3);
SET @mission2Id = LAST_INSERT_ID();

-- Mission 3: SATUREE (complète, liste d'attente disponible)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Soutien scolaire', 'Aide aux devoirs pour enfants', 'École primaire', 34.0209, -6.8416,
        DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 5, 0, 10, 'SATUREE', FALSE, @asso2Id, 2);
SET @mission3Id = LAST_INSERT_ID();

-- Mission 4: RENFORT_URGENT (mission en cours qui a besoin de renfort)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Urgence inondation', 'Aide aux victimes inondation', 'Zone sinistrée', 33.5400, -7.6200,
        DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 6 HOUR), 20, 5, 5, 'RENFORT_URGENT', FALSE, @asso1Id, 1);
SET @mission4Id = LAST_INSERT_ID();

-- Mission 5: RENFORT_URGENT (autre urgence)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Distribution eau', 'Distribution d''eau potable', 'Quartier populeux', 33.5500, -7.6000,
        DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), 15, 3, 2, 'RENFORT_URGENT', FALSE, @asso1Id, 1);
SET @mission5Id = LAST_INSERT_ID();

-- Mission 6: EN_COURS (mission en cours, inscriptions fermées)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Animation atelier', 'Atelier créatif pour enfants', 'Centre culturel', 35.7595, -5.8340,
        DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 8, 0, 0, 'EN_COURS', FALSE, @asso3Id, 2);
SET @mission6Id = LAST_INSERT_ID();

-- Mission 7: TERMINEE (mission terminée, certificat disponible)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Marathon solidaire', 'Course caritative', 'Stade', 33.5800, -7.6200,
        DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 20, 0, 0, 'TERMINEE', FALSE, @asso1Id, 1);
SET @mission7Id = LAST_INSERT_ID();

-- Mission 8: TERMINEE (autre mission terminée)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Collecte déchets', 'Collecte des déchets recyclables', 'Quartier résidentiel', 34.0400, -6.8500,
        DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), 12, 0, 0, 'TERMINEE', FALSE, @asso2Id, 3);
SET @mission8Id = LAST_INSERT_ID();

-- Mission 9: CLOTUREE (mission archivée)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Camp d''été', 'Encadrement enfants été', 'Centre de vacances', 35.7400, -5.8000,
        DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY), 10, 0, 0, 'CLOTUREE', FALSE, @asso3Id, 2);
SET @mission9Id = LAST_INSERT_ID();

-- Mission 10: ANNULEE (mission annulée)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Festival musique', 'Aide organisation festival', 'Place publique', 33.5700, -7.5900,
        DATE_ADD(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), 25, 0, 0, 'ANNULEE', FALSE, @asso1Id, 1);
SET @mission10Id = LAST_INSERT_ID();

-- Mission 11: PUBLIEE (disponible, pas géolocalisée - à distance)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Traduction documents', 'Traduction de documents pour ONG', 'À distance', NULL, NULL,
        DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 5, 0, 0, 'PUBLIEE', FALSE, @asso2Id, 2);
SET @mission11Id = LAST_INSERT_ID();

-- Mission 12: SATUREE (complète, beaucoup en liste d'attente)
INSERT INTO Mission (titre, description, adresse, latitude, longitude, dateDebut, dateFin, nbPlaces, nbRenfortDemande, nbPlacesListeAttente, statut, estSignalee, idAssociation, idDomaine)
VALUES ('Visite hôpital', 'Visite personnes âgées', 'Hôpital universitaire', 33.6000, -7.6500,
        DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY), 3, 0, 20, 'SATUREE', FALSE, @asso1Id, 4);
SET @mission12Id = LAST_INSERT_ID();

-- =====================================================================
-- 4. INSCRIPTIONS (pour tester les filtres)
-- =====================================================================

-- Inscription CONFIRMEE sur mission terminée (pour certificat)
INSERT INTO Inscription (idBenevole, idMission, statut, rang, dateInscription, rappelEnvoye)
VALUES (@benevoleId, @mission7Id, 'CONFIRMEE', NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), FALSE);
SET @inscription1Id = LAST_INSERT_ID();

-- Inscription CONFIRMEE sur mission PUBLIEE
INSERT INTO Inscription (idBenevole, idMission, statut, rang, dateInscription, rappelEnvoye)
VALUES (@benevoleId, @mission1Id, 'CONFIRMEE', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE);
SET @inscription2Id = LAST_INSERT_ID();

-- Inscription EN_LISTE_ATTENTE sur mission SATUREE
INSERT INTO Inscription (idBenevole, idMission, statut, rang, dateInscription, rappelEnvoye)
VALUES (@benevoleId, @mission3Id, 'EN_LISTE_ATTENTE', 5, DATE_SUB(NOW(), INTERVAL 2 DAY), FALSE);
SET @inscription3Id = LAST_INSERT_ID();

-- Inscription EN_LISTE_ATTENTE sur mission RENFORT_URGENT
INSERT INTO Inscription (idBenevole, idMission, statut, rang, dateInscription, rappelEnvoye)
VALUES (@benevoleId, @mission4Id, 'EN_LISTE_ATTENTE', 2, DATE_SUB(NOW(), INTERVAL 1 HOUR), FALSE);
SET @inscription4Id = LAST_INSERT_ID();

-- Inscription ANNULEE sur mission PUBLIEE
INSERT INTO Inscription (idBenevole, idMission, statut, rang, dateInscription, rappelEnvoye)
VALUES (@benevoleId, @mission2Id, 'ANNULEE', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), FALSE);
SET @inscription5Id = LAST_INSERT_ID();

-- =====================================================================
-- 5. CERTIFICATS (pour les missions terminées)
-- =====================================================================

-- Certificat pour la mission terminée où le bénévole est inscrit
INSERT INTO Certificat (codeVerification, dateDelivrance, urlPdf, idInscription)
VALUES (CONCAT('CERT-', UUID()), NOW(), NULL, @inscription1Id);

-- =====================================================================
-- 6. COMPÉTENCES DES MISSIONS
-- =====================================================================

-- Mission 1: Distribution alimentaire
INSERT INTO MissionCompetence (idMission, idCompetence) VALUES (@mission1Id, 2); -- Premiers secours

-- Mission 2: Journée de nettoyage
INSERT INTO MissionCompetence (idMission, idCompetence) VALUES (@mission2Id, 4); -- Bricolage

-- Mission 3: Soutien scolaire
INSERT INTO MissionCompetence (idMission, idCompetence) VALUES (@mission3Id, 3); -- Enseignement

-- Mission 4: Urgence inondation
INSERT INTO MissionCompetence (idMission, idCompetence) VALUES (@mission4Id, 1); -- Animation
INSERT INTO MissionCompetence (idMission, idCompetence) VALUES (@mission4Id, 2); -- Premiers secours

-- Mission 7: Marathon solidaire
INSERT INTO MissionCompetence (idMission, idCompetence) VALUES (@mission7Id, 1); -- Animation

-- =====================================================================
-- 7. COMPÉTENCES DU BÉNÉVOLE
-- =====================================================================

INSERT INTO BenevoleCompetence (idBenevole, idCompetence) VALUES (@benevoleId, 1); -- Animation
INSERT INTO BenevoleCompetence (idBenevole, idCompetence) VALUES (@benevoleId, 2); -- Premiers secours
INSERT INTO BenevoleCompetence (idBenevole, idCompetence) VALUES (@benevoleId, 5); -- Langues

-- =====================================================================
-- 8. CENTRES D'INTÉRÊT DU BÉNÉVOLE
-- =====================================================================

INSERT INTO BenevoleDomaine (idBenevole, idDomaine) VALUES (@benevoleId, 1); -- Humanitaire
INSERT INTO BenevoleDomaine (idBenevole, idDomaine) VALUES (@benevoleId, 4); -- Santé

-- =====================================================================
-- 9. ASSOCIATIONS ET DOMAINES
-- =====================================================================

INSERT INTO AssociationDomaine (idAssociation, idDomaine) VALUES (@asso1Id, 1); -- Humanitaire
INSERT INTO AssociationDomaine (idAssociation, idDomaine) VALUES (@asso1Id, 4); -- Santé
INSERT INTO AssociationDomaine (idAssociation, idDomaine) VALUES (@asso2Id, 2); -- Education
INSERT INTO AssociationDomaine (idAssociation, idDomaine) VALUES (@asso2Id, 3); -- Environnement
INSERT INTO AssociationDomaine (idAssociation, idDomaine) VALUES (@asso3Id, 2); -- Education

-- =====================================================================
-- RÉSUMÉ DES MISSIONS CRÉÉES:
-- =====================================================================
-- Mission 1: PUBLIEE - Distribution alimentaire (bénévole inscrit CONFIRMEE)
-- Mission 2: PUBLIEE - Journée de nettoyage (bénévole ANNULEE)
-- Mission 3: SATUREE - Soutien scolaire (bénévole EN_LISTE_ATTENTE rang 5)
-- Mission 4: RENFORT_URGENT - Urgence inondation (bénévole EN_LISTE_ATTENTE rang 2)
-- Mission 5: RENFORT_URGENT - Distribution eau (bénévole non inscrit)
-- Mission 6: EN_COURS - Animation atelier (bénévole non inscrit)
-- Mission 7: TERMINEE - Marathon solidaire (bénévole CONFIRMEE, certificat créé)
-- Mission 8: TERMINEE - Collecte déchets (bénévole non inscrit)
-- Mission 9: CLOTUREE - Camp d'été (bénévole non inscrit)
-- Mission 10: ANNULEE - Festival musique (bénévole non inscrit)
-- Mission 11: PUBLIEE - Traduction documents (à distance, bénévole non inscrit)
-- Mission 12: SATUREE - Visite hôpital (bénévole non inscrit)
