package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExplorerStatsDto {
    private long missionsRealisees;
    private long inscriptionsAVenir;
    private long enListeAttente;
    private boolean renfortDisponiblePourMoi;
    private Recommandations recommandations;
    private NiveauInfo niveau;
    private DernierBadge dernierBadge;
    private ProchaineMission prochaineMission;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recommandations {
        private long nombre;
        private Integer meilleurScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NiveauInfo {
        private int niveau;
        private String nom;
        /** Thème de la bannière (plus haut badge PALIER obtenu). */
        private String theme;
        private long missionsActuelles;
        /** Niveau du prochain badge PALIER (null si tous obtenus). */
        private Integer seuilSuivant;
        /** Nom du prochain badge PALIER. */
        private String niveauSuivant;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DernierBadge {
        private String code;
        private String nom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProchaineMission {
        private Long idMission;
        private String titre;
        private LocalDateTime dateDebut;
        private String ville;
    }
}
