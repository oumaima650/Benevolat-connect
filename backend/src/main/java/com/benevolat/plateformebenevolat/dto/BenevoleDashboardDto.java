package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BenevoleDashboardDto {
    private String prenom;
    private long missionsRealisees;
    private String niveauActuel;
    private int badgesObtenus;
    private long enListeAttenteCount;
    
    private int progressPct;
    private int missionsPourSuivant;
    private int missionsTotalPourSuivant;
    private String prochainNiveauLabel;
    
    private List<MissionCardDto> prochainesMissions;
    private List<BenevoleInscriptionDto> listeAttente;
    private List<NotificationDto> dernieresNotifications;
    
    private List<MonthlyActivityDto> activiteMensuelle;
    private List<DomaineStatDto> missionsParDomaine;
}
