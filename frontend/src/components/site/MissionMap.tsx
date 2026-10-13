/**
 * MissionMap — carte interactive Leaflet + OpenStreetMap.
 * Remplace l'ancienne implémentation Google Maps (qui nécessitait une clé API).
 * Aucune clé requise — OpenStreetMap est gratuit et open-source.
 */
import { useEffect, useRef, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import type { Mission } from "./data";

/* ── types ── */
type Props = {
  missions: Mission[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  position?: { lat: number; lng: number } | null;
  className?: string;
  zoom?: number;
};

/* ── centre par défaut : Maroc ── */
const MAROC: [number, number] = [31.8, -6.2];
const ZOOM_DEFAULT = 5;

/* ─────────────────────────────────────────────────────────────────────────
   Chargement dynamique de Leaflet (CDN) sans dépendance SSR.
   react-leaflet est déjà installé et utilisé dans les dashboards,
   mais MissionSearch / missions.$id sont côté landing — on injecte
   leaflet via import() pour ne pas casser le bundle SSR potentiel.
───────────────────────────────────────────────────────────────────────── */
let leafletPromise: Promise<typeof import("leaflet")> | null = null;

function chargerLeaflet() {
  if (leafletPromise) return leafletPromise;
  leafletPromise = import("leaflet").then((L) => {
    // Injecter la feuille de style Leaflet si absente
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Corriger les icônes par défaut (problème connu webpack/vite)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    return L;
  });
  return leafletPromise;
}

/* ── icône SVG pin goutte (style localisation) ── */
function creerIcone(L: any, complet: boolean, actif: boolean) {
  // Couleurs
  const fill    = complet ? "#e2457a" : actif ? "#f59e0b" : "#1f8a5b";
  const stroke  = "#151515";
  const w = actif ? 28 : 22;
  const h = actif ? 38 : 30;

  // Pin goutte SVG : cercle en haut + pointe en bas
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 38">
    <path d="M14 0 C6.268 0 0 6.268 0 14 C0 24.5 14 38 14 38 C14 38 28 24.5 28 14 C28 6.268 21.732 0 14 0 Z"
      fill="${fill}" stroke="${stroke}" stroke-width="2.2"/>
    <circle cx="14" cy="13" r="${actif ? 6 : 5}" fill="white" opacity="0.92"/>
    ${actif ? `<circle cx="14" cy="13" r="3" fill="${fill}"/>` : ""}
  </svg>`;

  const blob = `data:image/svg+xml;base64,${btoa(svg)}`;
  return new L.Icon({
    iconUrl:    blob,
    iconSize:   [w, h],
    iconAnchor: [w / 2, h],          // pointe en bas au centre
    popupAnchor:[0, -(h + 4)],       // popup au-dessus de la pointe
  });
}

/* ─────────────────────────────────────────────────────────────────────── */
export function MissionMap({ missions, selectedId, onSelect, position, className = "", zoom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /* ── Initialisation de la carte ── */
  useEffect(() => {
    let annule = false;
    chargerLeaflet()
      .then((L) => {
        if (annule || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          center: MAROC,
          zoom: zoom ?? ZOOM_DEFAULT,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setPret(true);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });

    return () => {
      annule = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
        leafletPromise = null; // reset pour permettre re-init si besoin
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Mise à jour des marqueurs de missions ── */
  useEffect(() => {
    if (!pret || !mapRef.current) return;

    chargerLeaflet().then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Supprimer les anciens marqueurs
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // Ajouter les nouveaux
      missions.forEach((m) => {
        if (!m.lat || !m.lng) return;
        const actif = m.id === selectedId;
        const complet = m.placesRestantes === 0;
        const icone = creerIcone(L, complet, actif);

        // Popup neo-brutaliste avec infos complètes
        const dateStr = new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        const placesColor  = complet ? "#e2457a" : "#1f8a5b";
        const placesLabel  = complet
          ? `Complet · ${m.listeAttente} en liste d'attente`
          : `${m.placesRestantes} / ${m.placesDemandees} places restantes`;
        const statutBg     = complet ? "#fce7f3" : "#d1fae5";
        const statutBorder = complet ? "#e2457a" : "#1f8a5b";

        const popupHtml = `
          <div style="
            font-family: 'DM Sans', system-ui, sans-serif;
            width: 240px;
            background: #ffffff;
          ">
            <!-- Badge domaine -->
            <div style="
              background: #fef9c3;
              border-bottom: 2px solid #151515;
              padding: 6px 12px;
              border-radius: 10px 10px 0 0;
            ">
              <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#151515;">
                ${m.domaine}
              </span>
            </div>

            <!-- Corps -->
            <div style="padding: 10px 12px 12px;">

              <!-- Titre -->
              <p style="
                font-weight: 800;
                font-size: 13px;
                line-height: 1.35;
                margin: 0 0 8px;
                color: #151515;
              ">${m.titre}</p>

              <!-- Association -->
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                background: #f9fafb;
                border: 1.5px solid #e5e7eb;
                border-radius: 8px;
                padding: 5px 8px;
                margin-bottom: 8px;
              ">
                <div style="
                  width: 24px; height: 24px;
                  background: #151515;
                  border-radius: 50%;
                  display: flex; align-items: center; justify-content: center;
                  flex-shrink: 0;
                ">
                  <span style="color:#fff;font-size:9px;font-weight:800;">
                    ${(m.association || "A").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                </div>
                <span style="font-size:11px;font-weight:600;color:#374151;line-height:1.2;">${m.association ?? "Association"}</span>
              </div>

              <!-- Adresse -->
              <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:5px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                  style="flex-shrink:0;margin-top:1px;">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span style="font-size:11px;color:#6b7280;line-height:1.4;">${m.adresse ?? m.ville}</span>
              </div>

              <!-- Date -->
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                  style="flex-shrink:0;">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span style="font-size:11px;color:#6b7280;">${dateStr}</span>
              </div>

              <!-- Badge places -->
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: ${statutBg};
                border: 1.5px solid ${statutBorder};
                border-radius: 999px;
                padding: 3px 10px;
                margin-bottom: 10px;
              ">
                <span style="width:7px;height:7px;border-radius:50%;background:${placesColor};flex-shrink:0;"></span>
                <span style="font-size:11px;font-weight:700;color:${placesColor};">${placesLabel}</span>
              </div>

              <!-- Bouton -->
              <a href="/missions/${m.id}" style="
                display: block;
                text-align: center;
                background: #151515;
                color: #ffffff;
                border: 2px solid #151515;
                border-radius: 10px;
                padding: 7px 14px;
                font-size: 12px;
                font-weight: 800;
                text-decoration: none;
                box-shadow: 3px 3px 0 #f59e0b;
              ">
                Voir la mission &#8594;
              </a>
            </div>
          </div>`;

        const marker = L.marker([m.lat, m.lng], { icon: icone, zIndexOffset: actif ? 1000 : 0 })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 240, className: "cmi-popup" });

        marker.on("click", () => {
          onSelectRef.current?.(m.id);
        });

        markersRef.current.set(m.id, marker);
      });

      // Adapter la vue
      if (missions.length === 1 && missions[0]) {
        map.setView([missions[0].lat, missions[0].lng], zoom ?? 13);
      } else if (missions.length > 1 && !position) {
        const valid = missions.filter((m) => m.lat && m.lng);
        if (valid.length > 0) {
          const bounds = L.latLngBounds(valid.map((m) => [m.lat, m.lng]));
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    });
  }, [pret, missions, selectedId, position, zoom]);

  /* ── Pan vers la mission sélectionnée ── */
  useEffect(() => {
    if (!pret || !selectedId || !mapRef.current) return;
    const mission = missions.find((m) => m.id === selectedId);
    if (mission?.lat && mission?.lng) {
      mapRef.current.panTo([mission.lat, mission.lng]);
      markersRef.current.get(selectedId)?.openPopup();
    }
  }, [pret, selectedId, missions]);

  /* ── Marqueur de position utilisateur ── */
  useEffect(() => {
    if (!pret || !mapRef.current) return;
    chargerLeaflet().then((L) => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (!position) return;

      // Pin bleu pour la position utilisateur
      const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 28 38">
        <path d="M14 0 C6.268 0 0 6.268 0 14 C0 24.5 14 38 14 38 C14 38 28 24.5 28 14 C28 6.268 21.732 0 14 0 Z"
          fill="#2f6fe4" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="14" cy="13" r="5" fill="white" opacity="0.95"/>
        <circle cx="14" cy="13" r="3" fill="#2f6fe4"/>
      </svg>`;
      const blueIcon = new L.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(pinSvg)}`,
        iconSize:    [24, 32],
        iconAnchor:  [12, 32],
        popupAnchor: [0, -36],
      });

      userMarkerRef.current = L.marker([position.lat, position.lng], { icon: blueIcon, zIndexOffset: 2000 })
        .addTo(mapRef.current)
        .bindPopup(`<div style="font-family:'DM Sans',system-ui,sans-serif;font-size:12px;font-weight:700;color:#151515;display:flex;align-items:center;gap:6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="#2f6fe4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Votre position
        </div>`);

      mapRef.current.setView([position.lat, position.lng], 9);
    });
  }, [pret, position]);

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 border-ink bg-muted shadow-[4px_4px_0_var(--color-ink)] ${className}`}>
      {/* Conteneur Leaflet */}
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* États de chargement / erreur */}
      {!pret && !erreur && (
        <div className="absolute inset-0 flex items-center justify-center gap-3 text-sm text-muted-foreground bg-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          Chargement de la carte…
        </div>
      )}
      {erreur && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground bg-muted p-4 text-center">
          <MapIcon className="h-8 w-8" />
          <p className="font-semibold text-ink">Impossible de charger la carte</p>
          <p>Vérifiez votre connexion internet.</p>
        </div>
      )}

      {/* Styles popup Leaflet neo-brutaliste */}
      <style>{`
        .cmi-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border: 2px solid #151515;
          border-radius: 12px;
          box-shadow: 4px 4px 0 #151515;
          overflow: hidden;
          background: transparent;
        }
        .cmi-popup .leaflet-popup-content {
          margin: 0;
          width: 240px !important;
        }
        .cmi-popup .leaflet-popup-tip-container {
          display: none;
        }
        .cmi-popup .leaflet-popup-close-button {
          top: 6px !important;
          right: 8px !important;
          font-size: 16px !important;
          color: #151515 !important;
          font-weight: 900 !important;
          z-index: 10;
        }
        .cmi-popup .leaflet-popup-close-button:hover {
          color: #e2457a !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
