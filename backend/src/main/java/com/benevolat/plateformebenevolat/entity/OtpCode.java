package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité OTP (One-Time Password) pour la vérification email lors de l'inscription.
 * L'OTP est un code à 6 chiffres valide 10 minutes.
 */
@Entity
@Table(name = "otp_codes")
@Getter
@Setter
@NoArgsConstructor
public class OtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    private boolean used = false;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
}
