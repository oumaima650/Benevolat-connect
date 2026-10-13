package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.BenevoleProfileDto;
import com.benevolat.plateformebenevolat.entity.Benevole;
import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class BenevoleProfileService {

    private final BenevoleRepository benevoleRepository;
    private final CompetenceRepository competenceRepository;
    private final DomaineRepository domaineRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bénévole introuvable : " + email));

        List<String> competenceNoms = b.getCompetences().stream()
                .map(Competence::getNom)
                .toList();

        List<Long> domaineIds = b.getDomaines().stream()
                .map(Domaine::getId)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("id", b.getIdUtilisateur());
        result.put("email", b.getEmail());
        result.put("prenom", b.getPrenom());
        result.put("nom", b.getNom());
        result.put("telephone", b.getTelephone());
        result.put("dateNaissance", b.getDateNaissance());
        result.put("ville", b.getVille());
        result.put("biographie", b.getBiographie());
        result.put("rayonDeplacementKm", b.getRayonDeplacementKm());
        result.put("competences", competenceNoms);
        result.put("domaineIds", domaineIds);
        result.put("photoUrl", b.getPhotoUrl());
        result.put("latitude", b.getLatitude());
        result.put("longitude", b.getLongitude());
        return result;
    }

    public Map<String, Object> updateProfile(String email, BenevoleProfileDto dto) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bénévole introuvable : " + email));

        if (dto.getPrenom() != null) {
            b.setPrenom(dto.getPrenom());
        }
        if (dto.getNom() != null) {
            b.setNom(dto.getNom());
        }
        if (dto.getTelephone() != null) {
            b.setTelephone(dto.getTelephone());
        }
        if (dto.getDateNaissance() != null) {
            b.setDateNaissance(dto.getDateNaissance());
        }
        if (dto.getVille() != null) {
            b.setVille(dto.getVille());
        }
        if (dto.getBiographie() != null) {
            b.setBiographie(dto.getBiographie());
        }
        if (dto.getRayonDeplacementKm() != null) {
            b.setRayonDeplacementKm(dto.getRayonDeplacementKm());
        }
        if (dto.getLatitude() != null) {
            b.setLatitude(dto.getLatitude());
        }
        if (dto.getLongitude() != null) {
            b.setLongitude(dto.getLongitude());
        }
        if (dto.getPhotoUrl() != null) {
            b.setPhotoUrl(dto.getPhotoUrl());
        }
        if (dto.getCompetences() != null) {
            List<Competence> competences = new ArrayList<>();
            for (String nom : dto.getCompetences()) {
                // Chercher la compétence existante ou en créer une nouvelle
                Competence competence = competenceRepository.findByNomIgnoreCase(nom)
                        .orElseGet(() -> competenceRepository.save(new Competence(nom, null, null)));
                competences.add(competence);
            }
            b.setCompetences(competences);
        }

        if (dto.getDomaineIds() != null) {
            if (dto.getDomaineIds().isEmpty()) {
                b.setDomaines(new ArrayList<>());
            } else {
                List<Domaine> domaines = domaineRepository.findAllById(dto.getDomaineIds());
                b.setDomaines(domaines);
            }
        }

        benevoleRepository.save(b);
        return getProfile(email);
    }
}
