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
            log.info("✅ Email envoyé avec succès à {} : {}", to, subject);
        } catch (MessagingException e) {
            log.error("❌ Erreur MessagingException envoi email à {} : {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Erreur inattendue envoi email à {} : {}", to, e.getMessage(), e);
        }
    }

    /** Email de bienvenue après inscription. */
    public void sendWelcome(String to, String prenom, String role) {
        String nom = (prenom != null && !prenom.isBlank()) ? prenom : "cher utilisateur";
        String roleLabel = "ASSOCIATION".equals(role) ? "association" : "bénévole";
        String dashboardUrl = "ASSOCIATION".equals(role)
                ? frontendUrl + "/association"
                : frontendUrl + "/benevole";

        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border:3px solid #1a1a1a;border-radius:16px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
                    <!-- Header -->
                    <tr>
                      <td style="background:#f7c948;border-bottom:3px solid #1a1a1a;padding:28px 40px;">
                        <h1 style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px;">CountMeIn</h1>
                        <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#1a1a1a;opacity:0.7;">La plateforme de bénévolat au Maroc</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1a1a;">Bienvenue, %s ! 🎉</h2>
                        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444;">
                          Ton compte <strong>%s</strong> a bien été créé sur CountMeIn.<br>
                          Tu fais maintenant partie d'une communauté qui agit pour un monde meilleur.
                        </p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#f72b7f;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                              <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:800;color:#fff;text-decoration:none;">
                                Accéder à mon espace →
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:28px 0 0;font-size:13px;color:#888;">
                          Si tu n'as pas créé ce compte, tu peux ignorer cet email.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
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
            """.formatted(nom, roleLabel, dashboardUrl, java.time.Year.now().getValue());

        sendHtml(to, "Bienvenue sur CountMeIn ! 🎉", html);
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
                          Ce code est valable <strong>%d minute(s)</strong>.<br>
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
                        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1a1a;">Réinitialisation de mot de passe 🔐</h2>
                        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
                          Tu as demandé à réinitialiser ton mot de passe CountMeIn.<br>
                          Clique sur le bouton ci-dessous pour en choisir un nouveau.<br>
                          Ce lien est valable <strong>24 heures</strong>.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:#f72b7f;border:2px solid #1a1a1a;border-radius:10px;box-shadow:3px 3px 0 #1a1a1a;">
                              <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:800;color:#fff;text-decoration:none;">
                                Réinitialiser mon mot de passe →
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
