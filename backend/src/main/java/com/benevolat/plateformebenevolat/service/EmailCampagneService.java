package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.EmailDtos.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.function.Function;

/**
 * Envoi d'emails ciblés depuis l'espace administrateur et l'espace association.
 * Réutilise le même service SMTP que l'authentification ({@link EmailService}).
 * La rédaction peut être assistée par l'IA ({@link LlmClient}).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EmailCampagneService {

    private final UserRepository userRepository;
    private final AssociationRepository associationRepository;
    private final InscriptionRepository inscriptionRepository;
    private final EmailService emailService;
    private final LlmClient llmClient;

    /* ─── Destinataires ────────────────────────────────────────────────────── */

    /** Admin : tous les bénévoles ou toutes les associations. */
    public List<Destinataire> destinatairesAdmin(String role) {
        Role cible = "ASSOCIATION".equalsIgnoreCase(role) ? Role.ASSOCIATION : Role.BENEVOLE;
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == cible)
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .map(u -> new Destinataire(u.getIdUtilisateur(), nomAffiche(u), u.getEmail()))
                .sorted(Comparator.comparing(Destinataire::nom, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    /** Association : bénévoles inscrits (hors annulations) à au moins une de ses missions. */
    public List<Destinataire> destinatairesAssociation(String emailAssociation) {
        return inscriptionRepository.findBenevolesInscritsByAssociation(emailAssociation).stream()
                .filter(b -> b.getEmail() != null && !b.getEmail().isBlank())
                .map(b -> new Destinataire(b.getIdUtilisateur(), nomAffiche(b), b.getEmail()))
                .sorted(Comparator.comparing(Destinataire::nom, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    /* ─── Envoi ────────────────────────────────────────────────────────────── */

    public EnvoiResultat envoyerAdmin(List<Long> ids, String sujet, String message) {
        Map<Long, Utilisateur> parId = new HashMap<>();
        for (Utilisateur u : userRepository.findAll()) {
            if (u.getRole() == Role.BENEVOLE || u.getRole() == Role.ASSOCIATION) {
                parId.put(u.getIdUtilisateur(), u);
            }
        }
        return envoyer(ids, parId::get, sujet, message);
    }

    public EnvoiResultat envoyerAssociation(String emailAssociation, List<Long> ids, String sujet, String message) {
        Map<Long, Benevole> parId = new HashMap<>();
        for (Benevole b : inscriptionRepository.findBenevolesInscritsByAssociation(emailAssociation)) {
            parId.put(b.getIdUtilisateur(), b);
        }
        // Sécurité : un bénévole non inscrit aux missions de l'association est ignoré.
        return envoyer(ids, parId::get, sujet, message);
    }

    private EnvoiResultat envoyer(List<Long> ids, Function<Long, ? extends Utilisateur> resolve,
                                  String sujet, String message) {
        if (ids == null || ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sélectionnez au moins un destinataire.");
        }
        if (sujet == null || sujet.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'objet est obligatoire.");
        }
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message est obligatoire.");
        }

        String objet = sujet.trim();
        String html = corpsHtml(message);
        Set<Long> uniques = new LinkedHashSet<>(ids);
        int envoyes = 0;
        List<String> erreurs = new ArrayList<>();

        for (Long id : uniques) {
            Utilisateur u = resolve.apply(id);
            if (u == null || u.getEmail() == null || u.getEmail().isBlank()) {
                erreurs.add("Destinataire #" + id + " introuvable.");
                continue;
            }
            if (emailService.trySendHtml(u.getEmail(), objet, html)) {
                envoyes++;
            } else {
                erreurs.add(u.getEmail());
            }
        }
        return new EnvoiResultat(envoyes, uniques.size() - envoyes, erreurs);
    }

    /* ─── Rédaction assistée par IA ────────────────────────────────────────── */

    public RedactionResponse redigerAdmin(String consigne) {
        return rediger(consigne, "Tu écris au nom de l'équipe d'administration de la plateforme CountMeIn. "
                + "Le public visé peut être des bénévoles ou des associations.");
    }

    public RedactionResponse redigerAssociation(String emailAssociation, String consigne) {
        Association a = associationRepository.findByEmail(emailAssociation)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable."));
        String ville = (a.getVille() == null || a.getVille().isBlank()) ? "non précisée" : a.getVille();
        return rediger(consigne, "Tu écris au nom de l'association « " + a.getNom() + " » (ville : " + ville
                + ") qui s'adresse à ses bénévoles inscrits à ses missions.");
    }

    private RedactionResponse rediger(String consigne, String contexte) {
        String systemPrompt = """
                Tu rédiges des emails professionnels en français pour la plateforme de bénévolat CountMeIn.
                %s

                Règles :
                - Commence par l'objet sur la première ligne au format exact « Objet : ... ».
                - Laisse une ligne vide, puis rédige le corps du message.
                - Ton courtois, clair et concis (150 mots maximum).
                - N'invente aucune information personnelle (nom, date, montant).
                - Termine par « L'équipe CountMeIn ».
                - Réponds uniquement par l'email, sans commentaire ni balise Markdown.
                """.formatted(contexte);

        List<Map<String, String>> messages = List.of(Map.of("role", "user", "content", consigne));
        LlmClient.LlmResponse resp = llmClient.chat(systemPrompt, messages, 900, 0.6);

        if (resp.fallback()) {
            return new RedactionResponse(null, null, true);
        }
        return parser(resp.content());
    }

    /** Extrait l'objet de la première ligne « Objet : ... » ; le reste devient le corps. */
    private static RedactionResponse parser(String texte) {
        if (texte == null || texte.isBlank()) {
            return new RedactionResponse(null, null, true);
        }
        String[] lignes = texte.strip().split("\n", -1);
        String sujet = "";
        int indexCorps = 0;
        String premiere = lignes[0].strip();
        String minuscule = premiere.toLowerCase(Locale.ROOT);
        if (minuscule.startsWith("objet") || minuscule.startsWith("subject")) {
            int sep = premiere.indexOf(':');
            sujet = (sep >= 0 ? premiere.substring(sep + 1) : "").strip();
            indexCorps = 1;
        }
        StringBuilder corps = new StringBuilder();
        for (int i = indexCorps; i < lignes.length; i++) {
            corps.append(lignes[i]);
            if (i < lignes.length - 1) corps.append('\n');
        }
        return new RedactionResponse(sujet, corps.toString().strip(), false);
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private static String nomAffiche(Utilisateur u) {
        if (u instanceof Benevole b) {
            String n = ((b.getPrenom() != null ? b.getPrenom() + " " : "")
                    + (b.getNom() != null ? b.getNom() : "")).trim();
            return n.isBlank() ? u.getEmail() : n;
        }
        if (u instanceof Association a) {
            return a.getNom();
        }
        return u.getEmail();
    }

    /** Enveloppe le message dans le gabarit HTML CountMeIn (contenu échappé). */
    private static String corpsHtml(String message) {
        String corps = echapper(message).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br>");
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:3px solid #1a1a1a;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
                    <tr><td style="background:#f7c948;border-bottom:3px solid #1a1a1a;padding:28px 40px;">
                      <h1 style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">CountMeIn</h1>
                      <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#1a1a1a;opacity:0.7;">La plateforme de bénévolat au Maroc</p>
                    </td></tr>
                    <tr><td style="padding:40px;font-size:15px;line-height:1.7;color:#333;">%s</td></tr>
                    <tr><td style="background:#1a1a1a;padding:20px 40px;">
                      <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
                        © %d CountMeIn — Plateforme de bénévolat au Maroc
                      </p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(corps, java.time.Year.now().getValue());
    }

    private static String echapper(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
