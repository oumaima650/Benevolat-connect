package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.AssociationSummaryDto;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/associations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssociationController {

    private final AssociationRepository associationRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public List<AssociationSummaryDto> getAssociations() {
        return associationRepository.findAll().stream().map(a -> {
            String domaine = a.getDomaine();
            return new AssociationSummaryDto(
                    a.getIdUtilisateur(),
                    a.getNom(),
                    a.getDescription(),
                    domaine,
                    a.getVille(),
                    a.getEmail(),
                    a.getContact(),
                    a.getPhotoProfil(),
                    a.getLatitude(),
                    a.getLongitude()
            );
        }).collect(Collectors.toList());
    }
}
