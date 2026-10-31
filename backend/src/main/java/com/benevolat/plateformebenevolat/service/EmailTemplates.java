package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.Map;

/**
 * Templates HTML des e-mails de notification (même charte que les e-mails de bienvenue / certificat).
 * Chaque catégorie a sa couleur, son badge et son bouton d'action ; un encadré optionnel
 * récapitule les informations utiles (mission, date, lieu, rang…).
 */
@Component
public class EmailTemplates {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /** Couleur d'accent, libellé du badge, texte du bouton. */
    private record Style(String couleur, String texteBadge, String badge, String bouton) {}

    private static final String VERT = "#00864A", JAUNE = "#EEC22A", ROSE = "#E96FA3",
            ROUGE = "#EF4444", BLEU = "#3B82F6", ENCRE = "#1a1a1a";

    private static Style style(CategorieNotif c) {
        return switch (c) {
            case INSCRIPTION -> new Style(VERT, "#fff", "Inscription confirmée", "Voir la mission");
            case LISTE_ATTENTE -> new Style(JAUNE, ENCRE, "Liste d'attente", "Voir la mission");
            case PROMOTION -> new Style(VERT, "#fff", "Place confirmée", "Voir ma mission");
            case ANNULATION -> new Style(ROUGE, "#fff", "Désistement", "Voir les inscrits");
            case MISSION_MODIFIEE -> new Style(BLEU, "#fff", "Mission modifiée", "Voir les nouvelles informations");
            case MISSION_ANNULEE -> new Style(ROUGE, "#fff", "Mission annulée", "Découvrir d'autres missions");
            case RENFORT -> new Style(ROSE, ENCRE, "Renfort", "Voir mes renforts");
            case RAPPEL -> new Style(JAUNE, ENCRE, "Rappel", "Voir la mission");
            case CERTIFICAT -> new Style(VERT, "#fff", "Certificat", "Voir mes certificats");
            case VALIDATION -> new Style(BLEU, "#fff", "Validation", "Accéder à mon espace");
            case COMPTE -> new Style(ENCRE, "#fff", "Mon compte", "Aller sur CountMeIn");
            case MODERATION -> new Style(ROUGE, "#fff", "Modération", "Voir mes missions");
            case SYSTEME -> new Style(ENCRE, "#fff", "Information", "Aller sur CountMeIn");
        };
    }

    /**
     * @param details lignes de l'encadré récapitulatif (libellé → valeur), peut être null ou vide
     */
    public String render(CategorieNotif categorie, String nom, String titre, String message,
                         String lien, Map<String, String> details) {
        Style s = style(categorie);
        // Une mission annulée renvoie vers les autres missions, pas vers la mission annulée
        String url = categorie == CategorieNotif.MISSION_ANNULEE ? frontendUrl + "/missions"
                : lien != null ? frontendUrl + lien : null;

        String bouton = url == null ? "" : """
                <table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
                  <tr><td style="background:%s;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                    <a href="%s" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:800;color:%s;text-decoration:none;">%s →</a>
                  </td></tr>
                </table>
                """.formatted(s.couleur(), esc(url), s.texteBadge(), esc(s.bouton()));

        StringBuilder lignes = new StringBuilder();
        if (details != null) {
            details.forEach((libelle, valeur) -> {
                if (valeur == null || valeur.isBlank()) return;
                lignes.append("""
                        <tr>
                          <td style="padding:7px 0;font-size:13px;color:#777;width:110px;vertical-align:top;">%s</td>
                          <td style="padding:7px 0;font-size:14px;font-weight:700;color:#1a1a1a;">%s</td>
                        </tr>
                        """.formatted(esc(libelle), esc(valeur)));
            });
        }
        String encadre = lignes.isEmpty() ? "" : """
                <table cellpadding="0" cellspacing="0" style="width:100%%;margin-top:20px;border:2px solid #1a1a1a;border-left:8px solid %s;border-radius:10px;">
                  <tr><td style="padding:12px 18px;">
                    <table cellpadding="0" cellspacing="0" style="width:100%%;">%s</table>
                  </td></tr>
                </table>
                """.formatted(s.couleur(), lignes);

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:3px solid #1a1a1a;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
                        <tr><td style="background:#f7c948;border-bottom:3px solid #1a1a1a;padding:22px 40px;">
                          <h1 style="margin:0;font-size:26px;font-weight:900;color:#1a1a1a;">CountMeIn</h1>
                          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#1a1a1a;opacity:0.7;">Connecter · Soutenir · Agir</p>
                        </td></tr>
                        <tr><td style="padding:34px 40px 30px;">
                          <span style="display:inline-block;padding:5px 12px;background:%s;color:%s;border:2px solid #1a1a1a;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">%s</span>
                          <p style="margin:20px 0 6px;font-size:14px;color:#777;">Bonjour %s,</p>
                          <h2 style="margin:0 0 14px;font-size:23px;font-weight:900;color:#1a1a1a;line-height:1.25;">%s</h2>
                          <p style="margin:0;font-size:15px;line-height:1.7;color:#444;">%s</p>
                          %s
                          %s
                        </td></tr>
                        <tr><td style="background:#1a1a1a;padding:18px 40px;">
                          <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
                            © %d CountMeIn — Plateforme de bénévolat au Maroc<br>
                            Vous pouvez désactiver ces e-mails depuis la page Notifications de votre espace.
                          </p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(s.couleur(), s.texteBadge(), esc(s.badge()), esc(nom), esc(titre),
                esc(message).replace("\n", "<br>"), encadre, bouton, Year.now().getValue());
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
