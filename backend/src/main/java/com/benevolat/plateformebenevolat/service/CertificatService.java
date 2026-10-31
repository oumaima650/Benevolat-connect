package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.CertificatResultDto;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.CertificatRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de génération et livraison des certificats PDF.
 * Génère un PDF HTML (via Flying Saucer / xhtmlrenderer),
 * l'uploade sur Cloudinary (resource_type=raw), sauvegarde l'URL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CertificatService {

    private final CertificatRepository certificatRepository;
    private final InscriptionRepository inscriptionRepository;
    private final AssociationRepository associationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    /** Preset non signé (même que le frontend) — utilisé si la clé API n'a pas le droit d'upload. */
    @Value("${cloudinary.upload-preset:}")
    private String uploadPreset;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);

    /* ─── Délivrer les certificats ─────────────────────────────────────────── */

    @Transactional
    public List<CertificatResultDto> delivrerCertificats(String emailAssociation,
                                                          Long missionId,
                                                          List<Long> inscriptionIds) {
        Association asso = associationRepository.findByEmail(emailAssociation)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable."));

        List<CertificatResultDto> results = new ArrayList<>();

        for (Long inscriptionId : inscriptionIds) {
            Inscription inscription = inscriptionRepository.findById(inscriptionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Inscription introuvable : " + inscriptionId));

            // Vérifier ownership
            if (!inscription.getMission().getAssociation().getIdUtilisateur()
                    .equals(asso.getIdUtilisateur())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette inscription.");
            }

            // Vérifier statut CONFIRMEE
            if (inscription.getStatut() != StatutInscription.CONFIRMEE) {
                log.warn("Inscription {} n'est pas CONFIRMEE, ignorée.", inscriptionId);
                continue;
            }

            // Un seul certificat par inscription
            Optional<Certificat> existing = certificatRepository
                    .findByInscription_IdInscription(inscriptionId);
            if (existing.isPresent()) {
                Certificat c = existing.get();
                // PDF manquant (upload précédent échoué) → nouvelle tentative
                if (c.getUrlPdf() == null || c.getUrlPdf().isBlank()) {
                    genererEtUploader(c, asso);
                }
                results.add(toCertificatResultDto(c));
                continue;
            }

            // Générer code unique
            String code = genererCode(inscription);

            // Créer certificat en base (urlPdf null pour l'instant)
            Certificat certificat = new Certificat(inscription, code, null);
            certificat = certificatRepository.save(certificat);

            // Générer PDF et uploader sur Cloudinary (le certificat existe en base même sans PDF)
            genererEtUploader(certificat, asso);

            // Notification dans l'application (l'e-mail dédié est envoyé ci-dessous)
            notificationService.notifier(inscription.getBenevole(), CategorieNotif.CERTIFICAT,
                    "Nouveau certificat de bénévolat",
                    asso.getNom() + " vous a délivré un certificat pour la mission « "
                            + inscription.getMission().getTitre() + " ».",
                    "/benevole/parcours", false);

            // Envoyer email de notification au bénévole
            try {
                emailService.sendCertificatDelivre(
                    inscription.getBenevole().getEmail(),
                    inscription.getBenevole().getPrenom(),
                    inscription.getMission().getTitre(),
                    asso.getNom(),
                    certificat.getCodeVerification(),
                    certificat.getUrlPdf()
                );
            } catch (Exception e) {
                log.warn("Impossible d'envoyer l'email certificat à {} : {}",
                    inscription.getBenevole().getEmail(), e.getMessage());
            }

            results.add(toCertificatResultDto(certificat));
        }

        return results;
    }

    /* ─── Liste des certificats d'une mission ──────────────────────────────── */

    @Transactional(readOnly = true)
    public List<CertificatResultDto> getCertificats(String emailAssociation, Long missionId) {
        Association asso = associationRepository.findByEmail(emailAssociation)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable."));

        return certificatRepository.findByInscription_Mission_IdMission(missionId)
                .stream()
                .filter(c -> c.getInscription().getMission().getAssociation()
                        .getIdUtilisateur().equals(asso.getIdUtilisateur()))
                .map(this::toCertificatResultDto)
                .collect(Collectors.toList());
    }

    /* ─── URL PDF d'un certificat ──────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public String getPdfUrl(String emailAssociation, Long certificatId) {
        Certificat cert = certificatRepository.findById(certificatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificat introuvable."));

        Association asso = associationRepository.findByEmail(emailAssociation)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable."));

        if (!cert.getInscription().getMission().getAssociation()
                .getIdUtilisateur().equals(asso.getIdUtilisateur())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        if (cert.getUrlPdf() == null || cert.getUrlPdf().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PDF non encore généré.");
        }

        return cert.getUrlPdf();
    }

    /* ─── PDF généré à la volée (prévisualisation / téléchargement) ────────── */

    /** Génère le PDF d'un certificat de l'association, sans passer par Cloudinary. */
    @Transactional(readOnly = true)
    public byte[] getPdfBytes(String emailAssociation, Long certificatId) {
        Certificat cert = certificatRepository.findById(certificatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificat introuvable."));
        Association asso = associationRepository.findByEmail(emailAssociation)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable."));
        if (!cert.getInscription().getMission().getAssociation()
                .getIdUtilisateur().equals(asso.getIdUtilisateur())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }
        try {
            return genererPdfBytes(cert, asso);
        } catch (Exception e) {
            log.error("Erreur génération PDF certificat {} : {}", certificatId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Génération du PDF impossible.");
        }
    }

    private void genererEtUploader(Certificat certificat, Association asso) {
        try {
            byte[] pdfBytes = genererPdfBytes(certificat, asso);
            String urlPdf = uploaderSurCloudinary(pdfBytes, certificat.getCodeVerification());
            if (urlPdf != null) {
                certificat.setUrlPdf(urlPdf);
                certificatRepository.save(certificat);
            }
        } catch (Exception e) {
            log.error("Erreur génération/upload PDF pour certificat {} : {}", certificat.getIdCertificat(), e.getMessage());
        }
    }

    /* ─── Génération du PDF (HTML → PDF via Flying Saucer) ─────────────────── */

    /** Logo CountMeIn embarqué (base64) — chargé une seule fois depuis le classpath. */
    private static String countMeInLogoDataUri;

    private static synchronized String getCountMeInLogo() {
        if (countMeInLogoDataUri == null) {
            try (var in = CertificatService.class.getResourceAsStream("/certificat/countmein-logo.png")) {
                countMeInLogoDataUri = in == null ? ""
                        : "data:image/png;base64," + Base64.getEncoder().encodeToString(in.readAllBytes());
            } catch (Exception e) {
                countMeInLogoDataUri = "";
            }
        }
        return countMeInLogoDataUri;
    }

    private byte[] genererPdfBytes(Certificat certificat, Association asso) throws Exception {
        Inscription inscription = certificat.getInscription();
        Benevole benevole = inscription.getBenevole();
        Mission mission = inscription.getMission();

        String nomAsso = escHtml(asso.getNom());

        // Logo CountMeIn (fallback texte si la ressource est absente)
        String cmiLogo = getCountMeInLogo();
        String cmiLogoHtml = cmiLogo.isEmpty()
                ? "<span class='brand'>CountMeIn</span>"
                : "<img src='" + cmiLogo + "' alt='CountMeIn' class='cmi-logo'/>";

        // Logo association (fallback : initiales dans une pastille)
        String assoLogoHtml;
        if (asso.getPhotoProfil() != null && !asso.getPhotoProfil().isBlank()) {
            assoLogoHtml = "<img src='" + escHtml(asso.getPhotoProfil()) + "' alt='Logo' class='asso-logo'/>";
        } else {
            String initiales = Arrays.stream((asso.getNom() != null ? asso.getNom() : "A").trim().split("\\s+"))
                    .filter(w -> !w.isEmpty()).limit(2)
                    .map(w -> w.substring(0, 1).toUpperCase())
                    .collect(Collectors.joining());
            assoLogoHtml = "<div class='asso-initiales'>" + escHtml(initiales) + "</div>";
        }

        String dateDebutFmt = mission.getDateDebut() != null ? mission.getDateDebut().format(DATE_FMT) : "";
        String dateFinFmt = mission.getDateFin() != null ? mission.getDateFin().format(DATE_FMT) : "";
        String periodeStr = dateDebutFmt.equals(dateFinFmt)
                ? "le " + dateDebutFmt
                : "du " + dateDebutFmt + " au " + dateFinFmt;
        String dateDelivrance = (certificat.getDateDelivrance() != null
                ? certificat.getDateDelivrance() : LocalDateTime.now()).format(DATE_FMT);

        String verifyUrl = frontendUrl + "/certificat?code=" + certificat.getCodeVerification();

        // Charte CountMeIn : ink #0D0D0D, mustard #EEC22A, pink #E96FA3, emerald #00864A,
        // bordures épaisses + ombre décalée (néobrutalisme). Flying Saucer = CSS 2.1 :
        // pas de flex ni de box-shadow → tableaux + blocs en position absolue.
        String html = """
            <?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
              "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
              <title>Certificat de bénévolat</title>
              <style type="text/css">
                @page { size: 297mm 210mm; margin: 0; }
                body { margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; color: #0D0D0D;
                       background: #FFF6DC; }
                .page { position: relative; width: 297mm; height: 210mm; overflow: hidden; }

                /* Formes décoratives derrière la carte */
                .blob-pink    { position: absolute; width: 70mm; height: 70mm; right: -18mm; top: -22mm; z-index: 0;
                                background: #E96FA3; border: 0.8mm solid #0D0D0D; border-radius: 35mm; }
                .blob-emerald { position: absolute; width: 56mm; height: 56mm; left: -24mm; bottom: -26mm; z-index: 0;
                                background: #00864A; border: 0.8mm solid #0D0D0D; border-radius: 28mm; }
                .blob-mustard { position: absolute; width: 22mm; height: 22mm; left: 8mm; top: 6mm; z-index: 0;
                                background: #EEC22A; border: 0.8mm solid #0D0D0D; border-radius: 4mm; }

                /* Carte néobrutaliste : bordure ink + ombre décalée */
                .shadow { position: absolute; left: 21mm; top: 20mm; width: 259mm; height: 174mm;
                          background: #0D0D0D; border-radius: 7mm; z-index: 1; }
                .card   { position: absolute; left: 16mm; top: 15mm; width: 257mm; height: 172mm;
                          background: #FFFFFF; border: 1mm solid #0D0D0D; border-radius: 7mm; z-index: 2; }

                .header { position: absolute; left: 12mm; right: 12mm; top: 9mm; }
                .header table { width: 100%%; border-collapse: collapse; }
                .header td { vertical-align: middle; }
                .cmi-logo { height: 15mm; }
                .brand { font-size: 20pt; font-weight: bold; }
                .asso-box { text-align: right; }
                .asso-logo { height: 15mm; max-width: 45mm; }
                .asso-initiales { display: inline-block; width: 15mm; height: 15mm; line-height: 15mm;
                                  text-align: center; font-size: 15pt; font-weight: bold; color: #FFFFFF;
                                  background: #00864A; border: 0.6mm solid #0D0D0D; border-radius: 7.5mm; }
                .asso-caption { font-size: 7pt; color: #57554F; text-transform: uppercase; letter-spacing: 1px;
                                margin-top: 1.5mm; }
                .sep { position: absolute; left: 12mm; right: 12mm; top: 30mm; border-top: 0.5mm solid #0D0D0D; }

                .content { position: absolute; left: 12mm; right: 12mm; top: 42mm; text-align: center; }
                .pill { display: inline-block; padding: 2mm 7mm; background: #EEC22A; border: 0.6mm solid #0D0D0D;
                        border-radius: 6mm; font-size: 10pt; font-weight: bold; letter-spacing: 3px; }
                .atteste { margin: 10mm 0 3mm; font-size: 12pt; color: #57554F; }
                .nom { margin: 0; font-size: 38pt; font-weight: bold; line-height: 1.15; }
                .nom-trait { width: 60mm; height: 2.2mm; margin: 2.5mm auto 0; background: #E96FA3;
                             border: 0.5mm solid #0D0D0D; border-radius: 1.5mm; }
                .participe { margin: 8mm 0 2mm; font-size: 12pt; color: #57554F; }
                .mission { margin: 0; font-size: 21pt; font-weight: bold; color: #00864A; }
                .details { margin: 3mm 0 0; font-size: 11pt; color: #0D0D0D; }

                .footer { position: absolute; left: 12mm; right: 12mm; bottom: 12mm; }
                .footer table { width: 100%%; border-collapse: collapse; }
                .footer td { vertical-align: bottom; width: 33%%; }
                .label { font-size: 7pt; color: #57554F; text-transform: uppercase; letter-spacing: 1px; }
                .valeur { font-size: 11pt; font-weight: bold; margin-top: 1mm; }
                .signature { text-align: center; }
                .signature-line { width: 55mm; margin: 0 auto 1.5mm; border-top: 0.5mm solid #0D0D0D; }
                .code-cell { text-align: right; }
                .code { display: inline-block; padding: 1.8mm 4mm; background: #0D0D0D; color: #FFFFFF;
                        font-family: Courier, monospace; font-size: 11pt; font-weight: bold;
                        border-radius: 2mm; margin-top: 1mm; }
                .verify { font-size: 6.5pt; color: #57554F; margin-top: 1.5mm; }

                .stripe { position: absolute; left: 12mm; right: 12mm; bottom: 5mm; height: 2.5mm; }
                .stripe table { width: 100%%; height: 2.5mm; border-collapse: separate; border-spacing: 1.5mm 0; }
                .stripe td { height: 2.5mm; border: 0.4mm solid #0D0D0D; border-radius: 1.2mm; }
              </style>
            </head>
            <body>
              <div class="page">
                <div class="blob-pink"></div>
                <div class="blob-emerald"></div>
                <div class="blob-mustard"></div>
                <div class="shadow"></div>
                <div class="card">
                  <div class="header">
                    <table><tr>
                      <td>%s</td>
                      <td class="asso-box">%s<div class="asso-caption">%s</div></td>
                    </tr></table>
                  </div>
                  <div class="sep"></div>

                  <div class="content">
                    <div class="pill">CERTIFICAT DE BÉNÉVOLAT</div>
                    <p class="atteste">Ce certificat atteste que</p>
                    <p class="nom">%s %s</p>
                    <div class="nom-trait"></div>
                    <p class="participe">a participé en tant que bénévole à la mission</p>
                    <p class="mission">%s</p>
                    <p class="details">organisée par <b>%s</b>, %s</p>
                  </div>

                  <div class="footer">
                    <table><tr>
                      <td>
                        <div class="label">Délivré le</div>
                        <div class="valeur">%s</div>
                      </td>
                      <td class="signature">
                        <div class="signature-line"></div>
                        <div class="label">Pour l'association</div>
                        <div class="valeur">%s</div>
                      </td>
                      <td class="code-cell">
                        <div class="label">Code de vérification</div>
                        <div class="code">%s</div>
                        <div class="verify">%s</div>
                      </td>
                    </tr></table>
                  </div>

                  <div class="stripe">
                    <table><tr>
                      <td style="background:#EEC22A;"></td>
                      <td style="background:#E96FA3;"></td>
                      <td style="background:#00864A;"></td>
                    </tr></table>
                  </div>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                cmiLogoHtml,
                assoLogoHtml,
                nomAsso,
                escHtml(benevole.getPrenom() != null ? benevole.getPrenom() : ""),
                escHtml(benevole.getNom() != null ? benevole.getNom() : ""),
                escHtml(mission.getTitre()),
                nomAsso,
                periodeStr,
                dateDelivrance,
                nomAsso,
                certificat.getCodeVerification(),
                escHtml(verifyUrl)
        );

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(html);
        renderer.layout();
        renderer.createPDF(baos);
        return baos.toByteArray();
    }

    /* ─── Upload Cloudinary (resource_type=raw) ─────────────────────────────── */

    private String uploaderSurCloudinary(byte[] pdfBytes, String code) throws Exception {
        if (cloudName.isBlank()) {
            log.warn("Cloudinary non configuré — PDF non uploadé.");
            return null;
        }
        // L'extension dans le public_id est indispensable pour un fichier raw :
        // sans elle Cloudinary le sert en application/octet-stream (pas de prévisualisation).
        String publicId = "certificats/" + code + ".pdf";

        HttpResponse<String> response = null;
        if (!apiKey.isBlank() && !apiSecret.isBlank()) {
            response = envoyerUpload(pdfBytes, publicId, true);
            if (response.statusCode() == 401 || response.statusCode() == 403) {
                log.warn("Upload signé refusé ({}) — la clé API Cloudinary n'a pas le droit d'upload. "
                        + "Nouvelle tentative avec le preset non signé.", response.statusCode());
                response = null;
            }
        }
        if (response == null) {
            if (uploadPreset.isBlank()) {
                throw new RuntimeException("Upload signé impossible et CLOUDINARY_UPLOAD_PRESET non défini.");
            }
            response = envoyerUpload(pdfBytes, publicId, false);
        }

        if (response.statusCode() != 200) {
            log.error("Cloudinary upload failed {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Cloudinary upload failed: " + response.statusCode());
        }

        // Parse secure_url sans Jackson — extraction simple par regex sur le JSON
        String secureUrl = extractJsonStringField(response.body(), "secure_url");
        if (secureUrl == null) {
            throw new RuntimeException("secure_url absent de la réponse Cloudinary");
        }
        return secureUrl.replace("\\/", "/");
    }

    private HttpResponse<String> envoyerUpload(byte[] pdfBytes, String publicId, boolean signe) throws Exception {
        long timestamp = System.currentTimeMillis() / 1000L;
        String boundary = "----CertificatBoundary" + timestamp;
        ByteArrayOutputStream body = new ByteArrayOutputStream();

        appendPart(body, boundary, "file", pdfBytes, "certificat.pdf");
        appendField(body, boundary, "public_id", publicId);
        if (signe) {
            // Paramètres signés triés par ordre alphabétique
            String signature = sha1Hex("public_id=" + publicId + "&timestamp=" + timestamp + apiSecret);
            appendField(body, boundary, "timestamp", String.valueOf(timestamp));
            appendField(body, boundary, "api_key", apiKey);
            appendField(body, boundary, "signature", signature);
        } else {
            appendField(body, boundary, "upload_preset", uploadPreset);
        }
        body.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/raw/upload"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                .build();

        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }

    /** Extrait la valeur d'un champ String d'un JSON simple sans dépendance externe. */
    private static String extractJsonStringField(String json, String field) {
        String key = "\"" + field + "\"";
        int idx = json.indexOf(key);
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx + key.length());
        if (colon < 0) return null;
        int start = json.indexOf('"', colon + 1);
        if (start < 0) return null;
        int end = json.indexOf('"', start + 1);
        if (end < 0) return null;
        return json.substring(start + 1, end);
    }

    /* ─── Helpers ───────────────────────────────────────────────────────────── */

    private String genererCode(Inscription inscription) {
        int year = LocalDateTime.now().getYear();
        String rand = String.format("%06d", new Random().nextInt(1_000_000));
        return "CMI-" + year + "-" + rand;
    }

    private CertificatResultDto toCertificatResultDto(Certificat c) {
        Benevole b = c.getInscription().getBenevole();
        return CertificatResultDto.builder()
                .certificatId(c.getIdCertificat())
                .inscriptionId(c.getInscription().getIdInscription())
                .benevoleId(b.getIdUtilisateur())
                .benevoleNom(b.getNom())
                .benevolePrenom(b.getPrenom())
                .codeVerification(c.getCodeVerification())
                .urlPdf(c.getUrlPdf())
                .dateDelivrance(c.getDateDelivrance())
                .build();
    }

    private static String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private static String sha1Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static void appendField(ByteArrayOutputStream out, String boundary,
                                     String name, String value) throws Exception {
        String header = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n";
        out.write(header.getBytes(StandardCharsets.UTF_8));
        out.write(value.getBytes(StandardCharsets.UTF_8));
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private static void appendPart(ByteArrayOutputStream out, String boundary,
                                    String name, byte[] data, String filename) throws Exception {
        String header = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n"
                + "Content-Type: application/pdf\r\n\r\n";
        out.write(header.getBytes(StandardCharsets.UTF_8));
        out.write(data);
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }
}
