package com.benevolat.plateformebenevolat.chatbot;

import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.ScoreMatchingRepository;
import com.benevolat.plateformebenevolat.service.GamificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BenevoleChatProfile implements ChatProfile {

    private final BenevoleRepository benevoleRepository;
    private final InscriptionRepository inscriptionRepository;
    private final ScoreMatchingRepository scoreMatchingRepository;
    private final GamificationService gamificationService;

    @Override
    public String buildSystemPrompt() {
        return VisitorChatProfile.readFile("chatbot/system-benevole.md")
                + "\n\n# FAQ Bénévole\n"
                + VisitorChatProfile.readFile("chatbot/faq-benevole.md");
    }

    @Override
    @Transactional(readOnly = true)
    public String buildContext(Long userId) {
        if (userId == null) return "";
        try {
            var sb = new StringBuilder();

            // Gamification (niveau + badges — sans données nominatives)
            var gamif = gamificationService.profil(userId);
            sb.append("Niveau actuel : ").append(gamif.niveau())
              .append(" (").append(gamif.nomNiveau()).append(")\n");
            long badgesObtenus = gamif.badges().stream().filter(b -> b.obtenu()).count();
            sb.append("Badges obtenus : ").append(badgesObtenus).append("/")
              .append(gamif.badges().size()).append("\n");

            // Compétences du bénévole (noms seulement)
            benevoleRepository.findById(userId).ifPresent(b -> {
                List<String> comps = b.getCompetences().stream()
                        .map(Competence::getNom).limit(5).toList();
                if (!comps.isEmpty()) {
                    sb.append("Compétences : ").append(String.join(", ", comps)).append("\n");
                }
            });

            // Inscriptions récentes (5 max, sans données nominatives d'autres personnes)
            var inscriptions = inscriptionRepository
                    .findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(userId);

            if (!inscriptions.isEmpty()) {
                sb.append("\nInscriptions récentes :\n");
                inscriptions.stream().limit(5).forEach(i -> {
                    sb.append("- \"").append(i.getMission().getTitre()).append("\"")
                      .append(" | Statut : ").append(i.getStatut());
                    if (i.getRang() != null) {
                        sb.append(" | Rang : ").append(i.getRang());
                    }
                    if (i.getMission().getDateDebut() != null) {
                        sb.append(" | Début : ").append(i.getMission().getDateDebut().toLocalDate());
                    }
                    sb.append("\n");
                });
            }

            // Missions recommandées — score déjà calculé par le backend (lecture seule, top 5)
            var recommandations = scoreMatchingRepository
                    .findRecommandationsValides(userId, LocalDateTime.now());
            if (!recommandations.isEmpty()) {
                sb.append("\nMissions recommandées (score calculé par le backend) :\n");
                recommandations.stream().limit(5).forEach(s -> {
                    sb.append("- \"").append(s.getMission().getTitre()).append("\"")
                      .append(" | Score : ").append(s.getScore()).append("/100");
                    if (s.getExplication() != null && !s.getExplication().isBlank()) {
                        sb.append(" | Pourquoi : ").append(s.getExplication());
                    }
                    sb.append("\n");
                });
            }

            return sb.toString();
        } catch (Exception e) {
            log.warn("Impossible de construire le contexte bénévole pour userId={} : {}", userId, e.getMessage());
            return "";
        }
    }

    @Override
    public List<String> suggestions() {
        return List.of(
                "Où en est mon inscription ?",
                "Comment annuler une inscription ?",
                "Que signifie mon rang dans la liste d'attente ?"
        );
    }
}
