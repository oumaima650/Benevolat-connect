package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.entity.Association;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/associations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssociationController {

    private final AssociationRepository associationRepository;

    @GetMapping
    public List<Association> getAssociations() {
        return associationRepository.findAll();
    }
}
