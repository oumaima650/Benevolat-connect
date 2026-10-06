package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller REST public fournissant le catalogue des compétences et domaines.
 * Utilisé par le frontend pour afficher les badges sélectionnables lors de l'inscription.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"})
public class CatalogController {

    private final CompetenceRepository competenceRepository;
    private final DomaineRepository domaineRepository;

    /** GET /api/competences — Liste de toutes les compétences préréglées */
    @GetMapping("/competences")
    public ResponseEntity<List<Competence>> getAllCompetences() {
        return ResponseEntity.ok(competenceRepository.findAll());
    }

    /** GET /api/domaines — Liste de tous les domaines partagés (bénévoles + associations) */
    @GetMapping("/domaines")
    public ResponseEntity<List<Domaine>> getAllDomaines() {
        return ResponseEntity.ok(domaineRepository.findAll());
    }
}
