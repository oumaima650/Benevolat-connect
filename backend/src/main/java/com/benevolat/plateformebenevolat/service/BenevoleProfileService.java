package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.BenevoleProfileDto;
import com.benevolat.plateformebenevolat.entity.Benevole;
import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
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

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bénévole introuvable : " + email));

        List<String> competenceNoms = b.getCompetences().stream()
                .map(Competence::getNom)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("id", b.getIdUtilisateur());
        result.put("email", b.getEmail());
        result.put("prenom", b.getPrenom());
        result.put("nom", b.getNom());
        result.put("telephone", b.getTelephone());
        result.put("ville", b.getVille());
        result.put("biographie", b.getBiographie());
        result.put("rayonDeplacementKm", b.getRayonDeplacementKm());
        result.put("competences", competenceNoms);
        result.put("photoUrl", b.getPhotoUrl());
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
        if (dto.getVille() != null) {
            b.setVille(dto.getVille());
        }
        if (dto.getBiographie() != null) {
            b.setBiographie(dto.getBiographie());
        }
        if (dto.getRayonDeplacementKm() != null) {
            b.setRayonDeplacementKm(dto.getRayonDeplacementKm());
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

        benevoleRepository.save(b);
        return getProfile(email);
    }
}
