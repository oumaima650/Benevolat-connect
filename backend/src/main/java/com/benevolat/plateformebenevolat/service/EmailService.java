package com.benevolat.plateformebenevolat.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service centralisé pour l'envoi d'emails HTML (bienvenue, OTP, reset mot de passe).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /** Vérifie si l'email est configuré (non vide). */
    public boolean isConfigured() {
        return mailFrom != null && !mailFrom.isBlank();
    }

    /** Envoie un email HTML (synchrone pour capturer les erreurs). */
    public void sendHtml(String to, String subject, String htmlBody) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.info("==== EMAIL DEV MODE ==== À: {} | Sujet: {}", to, subject);
            return;
        }
        try {
            log.info("Tentative d'envoi email à {} depuis {} via {}:{}",
                    to, mailFrom,
                    System.getProperty("mail.smtp.host", "smtp configuré"),
                    587);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email envoyé avec succès à {} : {}", to, subject);
        } catch (MessagingException e) {
            log.error("Erreur MessagingException envoi email à {} : {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erreur inattendue envoi email à {} : {}", to, e.getMessage(), e);
        }
    }

    /** Email de bienvenue — dispatche selon le rôle. */
    public void sendWelcome(String to, String prenom, String role) {
        if ("ASSOCIATION".equals(role)) {
            sendWelcomeAssociation(to, prenom);
        } else {
            sendWelcomeBenevole(to, prenom);
        }
    }

    /** Email de bienvenue pour un bénévole : l'invite à explorer les missions. */
    private void sendWelcomeBenevole(String to, String prenom) {
        String nom = (prenom != null && !prenom.isBlank()) ? prenom : "cher bénévole";
        String exploreUrl = frontendUrl + "/benevole/explorer";
        String profileUrl = frontendUrl + "/benevole/profil";

        String html = """
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
                    <tr><td style="padding:40px;">
                      <h2 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#1a1a1a;">Bienvenue, %s !</h2>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#444;">
                        Ton inscription en tant que <strong>bénévole</strong> est confirmée.<br>
                        Tu peux dès maintenant explorer les missions disponibles près de chez toi,
                        t'inscrire et rejoindre des associations qui ont besoin de toi.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr>
                          <td style="background:#22c55e;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                            <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:800;color:#fff;text-decoration:none;">
                              Explorer les missions
                            </a>
                          </td>
                        </tr>
                      </table>
                      <table cellpadding="0" cellspacing="0" style="border:2px solid #e5e7eb;border-radius:10px;width:100%%;margin-bottom:24px;">
                        <tr><td style="padding:16px 20px;">
                          <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:#1a1a1a;">Ce que tu peux faire maintenant :</p>
                          <table cellpadding="0" cellspacing="0" style="width:100%%;">
                            <tr><td style="padding:5px 0;font-size:14px;color:#555;">
                              Consulter et s'inscrire aux <a href="%s" style="color:#15803d;font-weight:700;">missions disponibles</a>
                            </td></tr>
                            <tr><td style="padding:5px 0;font-size:14px;color:#555;">
                              Compléter ton <a href="%s" style="color:#15803d;font-weight:700;">profil bénévole</a> pour de meilleures recommandations
                            </td></tr>
                            <tr><td style="padding:5px 0;font-size:14px;color:#555;">
                              Obtenir des badges et un certificat après chaque mission accomplie
                            </td></tr>
                          </table>
                        </td></tr>
                      </table>
                      <p style="margin:0;font-size:13px;color:#888;">Si tu n'as pas créé ce compte, ignore cet email.</p>
                    </td></tr>
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
            """.formatted(nom, exploreUrl, exploreUrl, profileUrl, java.time.Year.now().getValue());

        sendHtml(to, "Bienvenue sur CountMeIn — Découvre les missions !", html);
    }

    /** Email de bienvenue pour une association : validation en attente, profil modifiable. */
    private void sendWelcomeAssociation(String to, String nomAssociation) {
        String nom = (nomAssociation != null && !nomAssociation.isBlank()) ? nomAssociation : "votre association";
        String profileUrl = frontendUrl + "/association/profil";
        String notifUrl   = frontendUrl + "/association/notifications";

        String html = """
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
                    <tr><td style="padding:40px;">
                      <h2 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#1a1a1a;">Bienvenue, %s !</h2>
                      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;">
                        Votre demande d'inscription a bien été reçue.<br>
                        Notre équipe va examiner votre dossier dans les plus brefs délais.
                        Vous serez notifié(e) par email dès que votre association sera validée.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="border-left:4px solid #f59e0b;background:#fffbeb;width:100%%;margin-bottom:24px;">
                        <tr><td style="padding:14px 20px;">
                          <p style="margin:0;font-size:14px;font-weight:800;color:#78350f;">Validation en attente</p>
                          <p style="margin:6px 0 0;font-size:13px;color:#92400e;line-height:1.5;">
                            Les fonctionnalités (missions, inscrits, certificats) seront débloquées après validation par notre équipe.
                          </p>
                        </td></tr>
                      </table>
                      <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1a1a1a;">En attendant, vous pouvez dès maintenant :</p>
                      <table cellpadding="0" cellspacing="0" style="width:100%%;margin-bottom:24px;">
                        <tr><td style="padding:6px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr><td style="background:#f5f0e8;border:2px solid #1a1a1a;border-radius:8px;box-shadow:2px 2px 0 #1a1a1a;">
                              <a href="%s" style="display:inline-block;padding:10px 20px;font-size:14px;font-weight:800;color:#1a1a1a;text-decoration:none;">
                                Compléter mon profil
                              </a>
                            </td></tr>
                          </table>
                          <p style="margin:4px 0 0;font-size:12px;color:#888;">Ajoutez logo, description et domaines d'activité.</p>
                        </td></tr>
                        <tr><td style="padding:6px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr><td style="background:#f5f0e8;border:2px solid #1a1a1a;border-radius:8px;box-shadow:2px 2px 0 #1a1a1a;">
                              <a href="%s" style="display:inline-block;padding:10px 20px;font-size:14px;font-weight:800;color:#1a1a1a;text-decoration:none;">
                                Suivre mon dossier
                              </a>
                            </td></tr>
                          </table>
                          <p style="margin:4px 0 0;font-size:12px;color:#888;">Consultez vos notifications pour toute mise à jour.</p>
                        </td></tr>
                      </table>
                      <p style="margin:0;font-size:13px;color:#888;">Si vous n'avez pas créé ce compte, ignorez cet email.</p>
                    </td></tr>
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
            """.formatted(nom, profileUrl, notifUrl, java.time.Year.now().getValue());

        sendHtml(to, "CountMeIn — Votre demande d'inscription est en cours d'examen", html);
    }

    /** Email OTP de vérification. */
    public void sendOtp(String to, String code, int expirationMinutes) {
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:3px solid #1a1a1a;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
                    <tr>
                      <td style="background:#f7c948;border-bottom:3px solid #1a1a1a;padding:28px 40px;">
                        <h1 style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">CountMeIn</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;text-align:center;">
                        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1a1a;">Vérification de ton adresse email</h2>
                        <p style="margin:0 0 32px;font-size:15px;color:#555;">Utilise ce code pour confirmer ton inscription :</p>
                        <div style="display:inline-block;background:#f5f0e8;border:3px solid #1a1a1a;border-radius:12px;box-shadow:4px 4px 0 #1a1a1a;padding:20px 40px;margin-bottom:24px;">
                          <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#1a1a1a;">%s</span>
                        </div>
                        <p style="margin:0;font-size:13px;color:#888;">
                          Ce code est valable <strong>%d minute</strong>.<br>
                          Si tu n'as pas créé de compte CountMeIn, ignore cet email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#1a1a1a;padding:20px 40px;">
                        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
                          © %d CountMeIn — Plateforme de bénévolat au Maroc
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(code, expirationMinutes, java.time.Year.now().getValue());

        sendHtml(to, "CountMeIn — Ton code de vérification : " + code, html);
    }

    /** Email de notification de certificat délivré au bénévole. */
    public void sendCertificatDelivre(String to, String prenom, String missionTitre,
                                       String associationNom, String code, String urlPdf) {
        String espaceUrl = frontendUrl + "/benevole";
        String verifyUrl = frontendUrl + "/certificat?code=" + code;

        String telechargerBtn = (urlPdf != null && !urlPdf.isBlank())
            ? """
              <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:#f72b7f;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                    <a href="%s" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:800;color:#fff;text-decoration:none;">
                      📄 Télécharger mon certificat PDF
                    </a>
                  </td>
                </tr>
              </table>
              """.formatted(urlPdf)
            : "";

        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:3px solid #1a1a1a;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
                    <tr>
                      <td style="background:#f7c948;border-bottom:3px solid #1a1a1a;padding:28px 40px;">
                        <h1 style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">CountMeIn</h1>
                        <p style="margin:4px 0 0;font-size:13px;color:#1a1a1a;opacity:0.7;">Votre certificat de bénévolat est prêt !</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1a1a;">
                          Félicitations, %s ! 🎉
                        </h2>
                        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
                          L'association <strong>%s</strong> vous a délivré un certificat de bénévolat
                          pour votre participation à la mission :
                        </p>
                        <div style="background:#f7c948;border:2px solid #1a1a1a;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                          <p style="margin:0;font-size:17px;font-weight:900;color:#1a1a1a;">%s</p>
                        </div>
                        %s
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                          <tr>
                            <td style="background:#f5f0e8;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                              <a href="%s" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:800;color:#1a1a1a;text-decoration:none;">
                                🏠 Accéder à mon espace bénévole
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:16px 0 8px;font-size:13px;color:#555;">
                          Votre certificat est également disponible dans votre espace bénévole,
                          rubrique <strong>Certificats</strong>, où vous pouvez le télécharger à tout moment.
                        </p>
                        <div style="background:#f5f0e8;border:2px solid #1a1a1a;border-radius:8px;padding:12px 16px;margin-top:16px;">
                          <p style="margin:0;font-size:12px;color:#555;">
                            Code de vérification :
                            <span style="font-family:monospace;font-weight:700;color:#1a1a1a;">%s</span>
                          </p>
                          <p style="margin:4px 0 0;font-size:11px;color:#888;">
                            Vérifiable sur : <a href="%s" style="color:#f72b7f;">%s</a>
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#1a1a1a;padding:20px 40px;">
                        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
                          © %d CountMeIn — Plateforme de bénévolat au Maroc
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                prenom != null ? prenom : "bénévole",
                associationNom,
                missionTitre,
                telechargerBtn,
                espaceUrl,
                code,
                verifyUrl, verifyUrl,
                java.time.Year.now().getValue()
            );

        sendHtml(to, "🏅 Votre certificat de bénévolat CountMeIn est prêt !", html);
    }

    /** Email de réinitialisation de mot de passe avec lien. */
    public void sendPasswordReset(String to, String resetToken) {
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;

        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:3px solid #1a1a1a;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
                    <tr>
                      <td style="background:#f7c948;border-bottom:3px solid #1a1a1a;padding:28px 40px;">
                        <h1 style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">CountMeIn</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1a1a;">Réinitialisation de mot de passe</h2>
                        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
                          Tu as demandé à réinitialiser ton mot de passe CountMeIn.<br>
                          Clique sur le bouton ci-dessous pour en choisir un nouveau.<br>
                          Ce lien est valable <strong>24 heures</strong>.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:#f72b7f;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                              <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:800;color:#fff;text-decoration:none;">
                                Réinitialiser mon mot de passe
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0 0 8px;font-size:13px;color:#888;">
                          Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :
                        </p>
                        <p style="margin:0;font-size:12px;color:#aaa;word-break:break-all;">%s</p>
                        <p style="margin:24px 0 0;font-size:13px;color:#888;">
                          Si tu n'as pas demandé cette réinitialisation, ignore cet email. Ton mot de passe reste inchangé.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#1a1a1a;padding:20px 40px;">
                        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
                          © %d CountMeIn — Plateforme de bénévolat au Maroc
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(resetUrl, resetUrl, java.time.Year.now().getValue());

        sendHtml(to, "CountMeIn — Réinitialisation de ton mot de passe", html);
    }
}
