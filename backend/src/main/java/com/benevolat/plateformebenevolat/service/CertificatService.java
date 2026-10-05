package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.CertificatDto;
import com.benevolat.plateformebenevolat.entity.Certificat;
import com.benevolat.plateformebenevolat.repository.CertificatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificatService {

    private final CertificatRepository certificatRepository;

    public CertificatDto verifyCertificat(String codeVerification) {
        if (codeVerification == null || codeVerification.trim().isEmpty()) {
            return new CertificatDto(false, codeVerification, null, null, null, null, null, null, "Code de vérification invalide ou vide.");
        }

        String cleanCode = codeVerification.trim();
        Optional<Certificat> certOpt = certificatRepository.findByCodeVerification(cleanCode);

        if (certOpt.isEmpty()) {
            return new CertificatDto(false, cleanCode, null, null, null, null, null, null, "Aucun certificat trouvé avec ce code de vérification.");
        }

        Certificat cert = certOpt.get();
        String benevoleNom = cert.getBenevole() != null ? cert.getBenevole().getNom() : "";
        String benevolePrenom = cert.getBenevole() != null ? cert.getBenevole().getPrenom() : "";
        String missionTitre = cert.getMission() != null ? cert.getMission().getTitre() : "";
        String associationNom = (cert.getMission() != null && cert.getMission().getAssociation() != null)
                ? cert.getMission().getAssociation().getNom()
                : "";

        return new CertificatDto(
                true,
                cert.getCodeVerification(),
                cert.getDateEmission(),
                cert.getNbHeures(),
                benevoleNom,
                benevolePrenom,
                missionTitre,
                associationNom,
                "Certificat d'engagement bénévole authentique et valide."
        );
    }
}
