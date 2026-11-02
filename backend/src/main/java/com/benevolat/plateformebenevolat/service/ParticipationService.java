package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.ApercuDtos.ApercuMission;
import com.benevolat.plateformebenevolat.dto.ImageEvenementDto;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.CertificatRepository;
import com.benevolat.plateformebenevolat.repository.ImageEvenementRepository;
import com.benevolat.plateformebenevolat.repository.ImageParticipationRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Aperçu d'une mission depuis « Mes inscriptions » et photos de participation du bénévole.
 * Un bénévole ne peut publier des photos que pour une inscription certifiée (participation attestée).
 */
@Service
@RequiredArgsConstructor
public class ParticipationService {

    private static final int MAX_PHOTOS_PAR_INSCRIPTION = 10;
    private static final int LONGUEUR_MAX_URL = 500;

    private final InscriptionRepository inscriptionRepository;
    private final CertificatRepository certificatRepository;
    private final ImageEvenementRepository imageEvenementRepository;
    private final ImageParticipationRepository imageParticipationRepository;

    @Transactional(readOnly = true)
    public ApercuMission apercu(String email, Long inscriptionId) {
        Inscription i = inscriptionDuBenevole(email, inscriptionId);
        Mission m = i.getMission();
        Association a = m.getAssociation();
        return new ApercuMission(
                i.getIdInscription(), i.getStatut().name(),
                m.getIdMission(), m.getTitre(), m.getDescription(),
                m.getDomaine() != null ? m.getDomaine().getNom() : null,
                m.getStatut(), m.getDateDebut(), m.getDateFin(), m.getAdresse(),
                a != null ? a.getVille() : null,
                m.getCompetences().stream().map(Competence::getNom).toList(),
                a != null ? a.getIdUtilisateur() : null,
                a != null ? a.getNom() : null,
                a != null ? a.getPhotoProfil() : null,
                imageEvenementRepository.findByMission_IdMissionOrderByDatePublicationDesc(m.getIdMission())
                        .stream().map(ParticipationService::toDto).toList(),
                mesPhotos(inscriptionId),
                certificatRepository.findByInscription_IdInscription(inscriptionId).isPresent());
    }

    @Transactional
    public ImageEvenementDto ajouterPhoto(String email, Long inscriptionId, String url, String description) {
        Inscription i = inscriptionDuBenevole(email, inscriptionId);
        if (certificatRepository.findByInscription_IdInscription(inscriptionId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous pourrez ajouter des photos une fois votre certificat reçu pour cette mission.");
        }
        if (url == null || url.isBlank() || !(url.startsWith("http://") || url.startsWith("https://"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'URL de la photo est invalide.");
        }
        if (url.length() > LONGUEUR_MAX_URL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'URL de la photo est trop longue.");
        }
        if (imageParticipationRepository.findByInscription_IdInscriptionOrderByDatePublicationDesc(inscriptionId).size()
                >= MAX_PHOTOS_PAR_INSCRIPTION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vous avez atteint la limite de " + MAX_PHOTOS_PAR_INSCRIPTION + " photos pour cette mission.");
        }
        String desc = description == null || description.isBlank() ? null : description.trim();
        return toDto(imageParticipationRepository.save(new ImageParticipation(url, desc, i)));
    }

    @Transactional
    public void supprimerPhoto(String email, Long inscriptionId, Long photoId) {
        inscriptionDuBenevole(email, inscriptionId);
        ImageParticipation photo = imageParticipationRepository.findById(photoId)
                .filter(p -> p.getInscription().getIdInscription().equals(inscriptionId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo introuvable."));
        imageParticipationRepository.delete(photo);
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private List<ImageEvenementDto> mesPhotos(Long inscriptionId) {
        return imageParticipationRepository.findByInscription_IdInscriptionOrderByDatePublicationDesc(inscriptionId)
                .stream().map(ParticipationService::toDto).toList();
    }

    /** L'inscription doit appartenir au bénévole connecté (sinon 404, pour ne rien révéler). */
    private Inscription inscriptionDuBenevole(String email, Long inscriptionId) {
        return inscriptionRepository.findById(inscriptionId)
                .filter(i -> i.getBenevole().getEmail().equalsIgnoreCase(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscription introuvable."));
    }

    private static ImageEvenementDto toDto(ImageEvenement img) {
        return new ImageEvenementDto(img.getIdImage(), img.getUrl(), img.getTitre(), img.getDescription(),
                img.getDatePublication());
    }

    private static ImageEvenementDto toDto(ImageParticipation img) {
        return new ImageEvenementDto(img.getIdImage(), img.getUrl(), null, img.getDescription(),
                img.getDatePublication());
    }
}
