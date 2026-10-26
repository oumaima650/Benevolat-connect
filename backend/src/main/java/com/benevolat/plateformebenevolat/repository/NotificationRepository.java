package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Notification;
import com.benevolat.plateformebenevolat.entity.StatutEnvoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Les 100 dernières notifications d'un utilisateur (centre de notifications, F30). */
    List<Notification> findTop100ByUtilisateur_IdUtilisateurOrderByCreatedAtDesc(Long utilisateurId);

    long countByUtilisateur_IdUtilisateurAndLueFalse(Long utilisateurId);

    Optional<Notification> findByIdNotificationAndUtilisateur_IdUtilisateur(Long id, Long utilisateurId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lue = true WHERE n.utilisateur.idUtilisateur = :userId AND n.lue = false")
    int marquerToutesLues(@Param("userId") Long userId);

    /** Mise à jour du statut d'envoi e-mail depuis le thread d'envoi asynchrone. */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.statutEnvoi = :statut WHERE n.idNotification = :id")
    int majStatutEnvoi(@Param("id") Long id, @Param("statut") StatutEnvoi statut);
}
