package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.GamificationDto;
import com.benevolat.plateformebenevolat.dto.GamificationDto.BadgeDto;
import com.benevolat.plateformebenevolat.dto.GamificationDto.EtapeDto;
import com.benevolat.plateformebenevolat.dto.GamificationDto.Resume;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.BadgeRepository;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.CertificatRepository;
import com.benevolat.plateformebenevolat.repository.ObtentionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Gamification : 1 mission avec certificat délivré = +1 niveau ; un badge PALIER tous les 5 niveaux
 * (il débloque une bannière de profil) et des badges SPECIAL selon des critères d'engagement.
 * Le niveau n'est pas stocké : il est recalculé à partir des certificats.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    public static final int NIVEAUX_PAR_PALIER = 5;
    public static final String THEME_PAR_DEFAUT = "nouveau";

    /** Nom de chaque niveau ; l'indice est le niveau. Au-delà : « Légende » + une étoile tous les 5 niveaux. */
    private static final List<String> NOMS_NIVEAUX = List.of(
            "Nouveau cœur",
            "Premier pas", "Main tendue", "Volontaire", "Coéquipier", "Étincelle",
            "Bâtisseur", "Relais", "Pilier", "Moteur", "Flamme",
            "Guide", "Mentor", "Ambassadeur", "Éclaireur", "Phare",
            "Inspirateur", "Rassembleur", "Visionnaire", "Héros du quotidien", "Étoile",
            "Gardien", "Sage", "Pionnier", "Icône", "Constellation",
            "Comète", "Nébuleuse", "Galaxie", "Univers", "Légende"
    );

    private final BadgeRepository badgeRepository;
    private final ObtentionRepository obtentionRepository;
    private final CertificatRepository certificatRepository;
    private final BenevoleRepository benevoleRepository;
    private final NotificationService notificationService;

    public static String nomNiveau(int niveau) {
        if (niveau < NOMS_NIVEAUX.size()) return NOMS_NIVEAUX.get(Math.max(0, niveau));
        int etoiles = (niveau - (NOMS_NIVEAUX.size() - 1)) / NIVEAUX_PAR_PALIER;
        return "Légende" + (etoiles > 0 ? " " + "★".repeat(etoiles) : "");
    }

    /* ─── Lecture ──────────────────────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public GamificationDto profil(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable"));
        return profil(b.getIdUtilisateur());
    }

    @Transactional(readOnly = true)
    public GamificationDto profil(Long benevoleId) {
        Stats stats = stats(benevoleId);
        int niveau = stats.niveau();
        List<Badge> badges = badgeRepository.findAllByOrderByOrdreAsc();
        Map<Long, Obtention> obtenus = obtentionRepository.findByBenevoleOrderByDateDesc(benevoleId).stream()
                .collect(Collectors.toMap(o -> o.getBadge().getIdBadge(), Function.identity(), (a, c) -> a));

        List<BadgeDto> dtos = badges.stream().map(badge -> toDto(badge, obtenus.get(badge.getIdBadge()), stats)).toList();

        Badge palierActuel = palierAtteint(badges, niveau);
        Badge prochainPalier = badges.stream()
                .filter(bd -> bd.getType() == TypeBadge.PALIER && bd.getValeurCritere() > niveau)
                .min(Comparator.comparingInt(Badge::getValeurCritere))
                .orElse(null);

        // Série de 5 niveaux en cours : 1-5, 6-10… (au niveau 5, on affiche déjà la série 6-10)
        int debut = (niveau / NIVEAUX_PAR_PALIER) * NIVEAUX_PAR_PALIER + 1;
        List<EtapeDto> echelle = new ArrayList<>();
        for (int n = debut; n < debut + NIVEAUX_PAR_PALIER; n++) {
            echelle.add(new EtapeDto(n, nomNiveau(n), niveau >= n));
        }
        int progression = (niveau - (debut - 1)) * 100 / NIVEAUX_PAR_PALIER;

        List<BadgeDto> nouveaux = obtenus.values().stream()
                .filter(o -> !Boolean.TRUE.equals(o.getVu()))
                .sorted(Comparator.comparing(o -> o.getBadge().getOrdre()))
                .map(o -> toDto(o.getBadge(), o, stats))
                .toList();

        return new GamificationDto(
                niveau,
                nomNiveau(niveau),
                nomNiveau(niveau + 1),
                palierActuel != null ? palierActuel.getTheme() : THEME_PAR_DEFAUT,
                palierActuel != null ? toDto(palierActuel, obtenus.get(palierActuel.getIdBadge()), stats) : null,
                prochainPalier != null ? toDto(prochainPalier, null, stats) : null,
                prochainPalier != null ? prochainPalier.getValeurCritere() - niveau : 0,
                progression,
                echelle,
                dtos,
                nouveaux
        );
    }

    /** Niveau et bannière de plusieurs bénévoles en une requête (listes des associations et de l'admin). */
    @Transactional(readOnly = true)
    public Map<Long, Resume> resumes(Collection<Long> benevoleIds) {
        if (benevoleIds == null || benevoleIds.isEmpty()) return Map.of();
        Map<Long, Integer> niveaux = new HashMap<>();
        for (Object[] row : certificatRepository.compterParBenevole(benevoleIds)) {
            niveaux.put((Long) row[0], ((Number) row[1]).intValue());
        }
        List<Badge> badges = badgeRepository.findAllByOrderByOrdreAsc();
        Map<Long, Resume> result = new HashMap<>();
        for (Long id : benevoleIds) {
            result.put(id, resume(niveaux.getOrDefault(id, 0), badges));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Resume resume(Long benevoleId) {
        return resumes(List.of(benevoleId)).get(benevoleId);
    }

    private static Resume resume(int niveau, List<Badge> badges) {
        Badge palier = palierAtteint(badges, niveau);
        return new Resume(niveau, nomNiveau(niveau),
                palier != null ? palier.getTheme() : THEME_PAR_DEFAUT,
                palier != null ? palier.getNom() : null);
    }

    /* ─── Attribution ──────────────────────────────────────────────────────── */

    /**
     * Appelé après la délivrance d'un certificat : le bénévole gagne un niveau
     * et reçoit les badges mérités (notification + e-mail pour chaque badge).
     */
    @Transactional
    public void onCertificatDelivre(Benevole benevole) {
        List<Badge> nouveaux = attribuerBadges(benevole);
        int niveau = stats(benevole.getIdUtilisateur()).niveau();

        notificationService.notifier(benevole, CategorieNotif.GAMIFICATION,
                "Niveau " + niveau + " atteint : " + nomNiveau(niveau),
                "Bravo ! Grâce à ta dernière mission, tu passes au niveau " + niveau
                        + " « " + nomNiveau(niveau) + " ».",
                "/benevole/badges", false);

        for (Badge badge : nouveaux) {
            String message = badge.getType() == TypeBadge.PALIER
                    ? "Tu as débloqué le badge « " + badge.getNom() + " » et sa bannière de profil. " + badge.getDescription()
                    : "Tu as débloqué le badge « " + badge.getNom() + " ». " + badge.getDescription();
            notificationService.notifier(benevole, CategorieNotif.GAMIFICATION,
                    "Nouveau badge : " + badge.getNom(),
                    message, "/benevole/badges", true);
        }
    }

    /** Attribue les badges mérités et pas encore obtenus ; idempotent. */
    @Transactional
    public List<Badge> attribuerBadges(Benevole benevole) {
        Stats stats = stats(benevole.getIdUtilisateur());
        Set<Long> dejaObtenus = obtentionRepository.findByBenevoleOrderByDateDesc(benevole.getIdUtilisateur())
                .stream().map(o -> o.getBadge().getIdBadge()).collect(Collectors.toSet());

        List<Badge> nouveaux = new ArrayList<>();
        for (Badge badge : badgeRepository.findAllByOrderByOrdreAsc()) {
            if (dejaObtenus.contains(badge.getIdBadge())) continue;
            if (stats.valeur(badge.getCritere()) >= badge.getValeurCritere()) {
                obtentionRepository.save(new Obtention(benevole, badge));
                nouveaux.add(badge);
            }
        }
        return nouveaux;
    }

    /** Rattrapage au démarrage : badges mérités par les certificats déjà délivrés (sans notification). */
    @Transactional
    public void rattraperTous() {
        int total = 0;
        for (Benevole b : benevoleRepository.findAll()) {
            total += attribuerBadges(b).size();
        }
        if (total > 0) log.info("Gamification : {} badge(s) attribué(s) au rattrapage.", total);
    }

    @Transactional
    public void marquerVus(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable"));
        obtentionRepository.marquerVus(b.getIdUtilisateur());
    }

    /* ─── Calcul des critères ──────────────────────────────────────────────── */

    private record Stats(int niveau, int renforts, int memeAssociation, int domainesDifferents,
                         int memeDomaine, int moisConsecutifs) {
        int valeur(CritereBadge critere) {
            return switch (critere) {
                case NIVEAU -> niveau;
                case RENFORT -> renforts;
                case MEME_ASSOCIATION -> memeAssociation;
                case DOMAINES_DIFFERENTS -> domainesDifferents;
                case MEME_DOMAINE -> memeDomaine;
                case MOIS_CONSECUTIFS -> moisConsecutifs;
            };
        }
    }

    private Stats stats(Long benevoleId) {
        List<Certificat> certificats = certificatRepository.findAvecMissionByBenevole(benevoleId);
        List<Mission> missions = certificats.stream().map(c -> c.getInscription().getMission()).toList();
        int renforts = (int) certificats.stream()
                .filter(c -> Boolean.TRUE.equals(c.getInscription().getEstRenfort())).count();

        Map<Long, Long> parAssociation = missions.stream()
                .collect(Collectors.groupingBy(m -> m.getAssociation().getIdUtilisateur(), Collectors.counting()));
        Map<Long, Long> parDomaine = missions.stream().filter(m -> m.getDomaine() != null)
                .collect(Collectors.groupingBy(m -> m.getDomaine().getIdDomaine(), Collectors.counting()));

        return new Stats(
                missions.size(),
                renforts,
                parAssociation.values().stream().mapToInt(Long::intValue).max().orElse(0),
                parDomaine.size(),
                parDomaine.values().stream().mapToInt(Long::intValue).max().orElse(0),
                plusLongueSerieDeMois(missions));
    }

    private static int plusLongueSerieDeMois(List<Mission> missions) {
        List<YearMonth> mois = missions.stream().filter(m -> m.getDateDebut() != null)
                .map(m -> YearMonth.from(m.getDateDebut())).distinct().sorted().toList();
        int meilleure = 0, courante = 0;
        YearMonth precedent = null;
        for (YearMonth m : mois) {
            courante = precedent != null && precedent.plusMonths(1).equals(m) ? courante + 1 : 1;
            meilleure = Math.max(meilleure, courante);
            precedent = m;
        }
        return meilleure;
    }

    private static Badge palierAtteint(List<Badge> badges, int niveau) {
        return badges.stream()
                .filter(b -> b.getType() == TypeBadge.PALIER && b.getValeurCritere() <= niveau)
                .max(Comparator.comparingInt(Badge::getValeurCritere))
                .orElse(null);
    }

    private static BadgeDto toDto(Badge b, Obtention o, Stats stats) {
        return new BadgeDto(b.getCode(), b.getNom(), b.getDescription(), b.getType().name(),
                b.getTheme(), b.getValeurCritere(),
                Math.min(stats.valeur(b.getCritere()), b.getValeurCritere()),
                o != null, o != null ? o.getDateAttribution() : null);
    }
}
