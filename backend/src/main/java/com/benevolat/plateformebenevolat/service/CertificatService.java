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

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

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
                results.add(toCertificatResultDto(existing.get()));
                continue;
            }

            // Générer code unique
            String code = genererCode(inscription);

            // Créer certificat en base (urlPdf null pour l'instant)
            Certificat certificat = new Certificat(inscription, code, null);
            certificat = certificatRepository.save(certificat);

            // Générer PDF et uploader sur Cloudinary
            try {
                byte[] pdfBytes = genererPdfBytes(certificat, asso);
                String urlPdf = uploaderSurCloudinary(pdfBytes, code);
                certificat.setUrlPdf(urlPdf);
                certificatRepository.save(certificat);
            } catch (Exception e) {
                log.error("Erreur génération/upload PDF pour certificat {} : {}", certificat.getIdCertificat(), e.getMessage());
                // Le certificat existe en base même sans PDF
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

    /* ─── Génération du PDF (HTML → PDF via Flying Saucer) ─────────────────── */

    private byte[] genererPdfBytes(Certificat certificat, Association asso) throws Exception {
        Inscription inscription = certificat.getInscription();
        Benevole benevole = inscription.getBenevole();
        Mission mission = inscription.getMission();

        String logoHtml = (asso.getPhotoProfil() != null && !asso.getPhotoProfil().isBlank())
                ? "<img src='" + asso.getPhotoProfil() + "' alt='Logo' style='height:70px;max-width:200px;object-fit:contain;'/>"
                : "<div style='font-size:28px;font-weight:900;color:#1a1a1a;'>" + escHtml(asso.getNom()) + "</div>";

        String dateDebutFmt = mission.getDateDebut() != null ? mission.getDateDebut().format(DATE_FMT) : "";
        String dateFinFmt = mission.getDateFin() != null ? mission.getDateFin().format(DATE_FMT) : "";
        String periodeStr = dateDebutFmt.equals(dateFinFmt)
                ? "le " + dateDebutFmt
                : "du " + dateDebutFmt + " au " + dateFinFmt;

        String verifyUrl = frontendUrl + "/certificat?code=" + certificat.getCodeVerification();

        String html = """
            <?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
              "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
              <title>Certificat de bénévolat</title>
              <style type="text/css">
                @page { size: A4 landscape; margin: 0; }
                body {
                  margin: 0; padding: 0;
                  font-family: Arial, sans-serif;
                  background: #f5f0e8;
                  width: 297mm; height: 210mm;
                }
                .page {
                  width: 297mm; height: 210mm;
                  background: #f5f0e8;
                  display: flex; flex-direction: column;
                  align-items: center; justify-content: center;
                  padding: 20mm;
                  box-sizing: border-box;
                }
                .card {
                  width: 100%%;
                  border: 4px solid #1a1a1a;
                  border-radius: 12px;
                  background: #ffffff;
                  padding: 20px 30px;
                  box-shadow: 6px 6px 0 #1a1a1a;
                  text-align: center;
                }
                .header { border-bottom: 3px solid #f7c948; padding-bottom: 14px; margin-bottom: 14px; }
                .logo-area { margin-bottom: 6px; }
                .cert-title {
                  font-size: 11pt; font-weight: 900; letter-spacing: 4px;
                  color: #888888; text-transform: uppercase; margin: 0;
                }
                .cert-sub {
                  font-size: 20pt; font-weight: 900; color: #1a1a1a; margin: 6px 0 0;
                }
                .body { padding: 10px 0; }
                .certifie { font-size: 10pt; color: #555; margin-bottom: 4px; }
                .benevole-name {
                  font-size: 26pt; font-weight: 900; color: #f72b7f;
                  margin: 4px 0;
                }
                .mission-label { font-size: 10pt; color: #555; margin-top: 10px; }
                .mission-name {
                  font-size: 15pt; font-weight: 700; color: #1a1a1a;
                  margin: 4px 0;
                }
                .period { font-size: 10pt; color: #555; margin: 4px 0 10px; }
                .asso-name { font-size: 11pt; font-weight: 700; color: #1a1a1a; }
                .footer {
                  border-top: 2px solid #e5e7eb; margin-top: 12px;
                  padding-top: 8px; font-size: 8pt; color: #888;
                }
                .code { font-family: 'Courier New', monospace; font-weight: 700; color: #1a1a1a; }
                .verify-url { color: #6b7280; font-size: 7pt; margin-top: 2px; }
                .divider {
                  width: 60px; height: 4px; background: #f7c948;
                  border: 1px solid #1a1a1a; margin: 8px auto;
                  border-radius: 2px;
                }
              </style>
            </head>
            <body>
              <div class="page">
                <div class="card">
                  <div class="header">
                    <div class="logo-area">%s</div>
                    <p class="cert-title">Certificat de bénévolat</p>
                    <p class="cert-sub">%s</p>
                  </div>
                  <div class="body">
                    <p class="certifie">Certifie que</p>
                    <p class="benevole-name">%s %s</p>
                    <div class="divider"/>
                    <p class="mission-label">a participé à la mission</p>
                    <p class="mission-name">%s</p>
                    <p class="period">%s</p>
                  </div>
                  <div class="footer">
                    <p>Code de vérification : <span class="code">%s</span></p>
                    <p class="verify-url">Vérifiable sur : %s</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                logoHtml,
                escHtml(asso.getNom()),
                escHtml(benevole.getPrenom() != null ? benevole.getPrenom() : ""),
                escHtml(benevole.getNom() != null ? benevole.getNom() : ""),
                escHtml(mission.getTitre()),
                periodeStr,
                certificat.getCodeVerification(),
                verifyUrl
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
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            log.warn("Cloudinary non configuré — PDF non uploadé.");
            return null;
        }

        long timestamp = System.currentTimeMillis() / 1000L;
        String publicId = "certificats/" + code;
        String toSign = "public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
        String signature = sha1Hex(toSign);

        // Build multipart form data
        String boundary = "----CertificatBoundary" + timestamp;
        ByteArrayOutputStream body = new ByteArrayOutputStream();

        appendPart(body, boundary, "file", pdfBytes, "certificat.pdf");
        appendField(body, boundary, "public_id", publicId);
        appendField(body, boundary, "timestamp", String.valueOf(timestamp));
        appendField(body, boundary, "api_key", apiKey);
        appendField(body, boundary, "signature", signature);
        appendField(body, boundary, "resource_type", "raw");
        body.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/raw/upload"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Cloudinary upload failed {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Cloudinary upload failed: " + response.statusCode());
        }

        // Parse secure_url sans Jackson — extraction simple par regex sur le JSON
        String responseBody = response.body();
        String secureUrl = extractJsonStringField(responseBody, "secure_url");
        if (secureUrl == null) {
            throw new RuntimeException("secure_url absent de la réponse Cloudinary");
        }
        return secureUrl;
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
