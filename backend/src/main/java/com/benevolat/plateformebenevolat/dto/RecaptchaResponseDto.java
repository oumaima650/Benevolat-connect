package com.benevolat.plateformebenevolat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Objet de réponse renvoyé par l'API Google reCAPTCHA.
 */
@Data
public class RecaptchaResponseDto {

    private boolean success;

    @JsonProperty("challenge_ts")
    private String challengeTs;

    private String hostname;

    @JsonProperty("error-codes")
    private List<String> errorCodes;
}
