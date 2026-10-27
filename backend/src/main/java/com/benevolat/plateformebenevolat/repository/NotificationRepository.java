package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUtilisateur_IdUtilisateurOrderByCreatedAtDesc(Long utilisateurId);
}
