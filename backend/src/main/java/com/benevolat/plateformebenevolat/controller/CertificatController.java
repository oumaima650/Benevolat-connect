package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.CertificatDto;
import com.benevolat.plateformebenevolat.service.CertificatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CertificatController {

    private final CertificatService certificatService;

    @GetMapping("/verify/{code}")
    public ResponseEntity<CertificatDto> verifyCertificat(@PathVariable String code) {
        CertificatDto result = certificatService.verifyCertificat(code);
        return ResponseEntity.ok(result);
    }
}
