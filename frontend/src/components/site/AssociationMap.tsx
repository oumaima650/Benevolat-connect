/**
 * AssociationMap — carte Leaflet des associations.
 * Géocode automatiquement les associations sans coordonnées via Nominatim.
 */
import { useEffect, useRef, useState } from "react";
import type { AssociationBackend } from "@/services/associationApi";
import { missionPresentation } from "./mission-presentation";

type Props = {
  associations: AssociationBackend[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  className?: string;
};

/* coordonnées par défaut des villes marocaines (fallback Nominatim) */
const COORDS_VILLES: Record<string, [number, number]> = {
  "casablanca": [33.5928, -7.6192],
  "rabat":      [34.0209, -6.8416],
  "tanger":     [35.7767, -5.8039],
  "fès":        [34.0181, -5.0078],
  "fes":        [34.0181, -5.0078],
  "marrakech":  [31.6295, -7.9811],
  "agadir":     [30.4278, -9.5981],
  "meknès":     [33.8935, -5.5473],
  "meknes":     [33.8935, -5.5473],
  "oujda":      [34.6867, -1.9114],
  "kenitra":    [34.2610, -6.5802],
  "tétouan":    [35.5785, -5.3684],
  "tetouan":    [35.5785, -5.3684],
  "salé":       [34.0531, -6.7985],
  "sale":       [34.0531, -6.7985],
  "martil":     [35.6162, -5.2712],
  "fnideq":     [35.8500, -5.3500],
};

const MAROC: [number, number] = [31.8, -6.2];

async function geocodeVille(ville: string): Promise<[number, number] | null> {
  const key = ville.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const exact = COORDS_VILLES[ville.toLowerCase()];
  if (exact) return exact;
  const normalized = COORDS_VILLES[key];
  if (normalized) return normalized;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ville + ", Maroc")}&format=json&limit=1`,
      { headers: { "Accept-Language": "fr" } }
    );
    const data = await res.json();
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

let leafletPromise: Promise<typeof import("leaflet")> | null = null;
function loadLeaflet() {
  if (leafletPromise) return leafletPromise;
  leafletPromise = import("leaflet").then((L) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
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

function makePin(L: any, color: string, active: boolean) {
  const w = active ? 28 : 22;
  const h = active ? 38 : 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 38">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z"
      fill="${color}" stroke="#151515" stroke-width="2.2"/>
    <circle cx="14" cy="13" r="${active ? 6 : 5}" fill="white" opacity="0.92"/>
    ${active ? `<circle cx="14" cy="13" r="3" fill="${color}"/>` : ""}
  </svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -(h + 4)],
  });
}

function isValidUrl(url: string | null | undefined) {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

export function AssociationMap({ associations, selectedId, onSelect, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markersRef   = useRef<Map<number, any>>(new Map());
  const [pret, setPret]     = useState(false);
  const [erreur, setErreur] = useState(false);
  const onSelectRef  = useRef(onSelect);
  onSelectRef.current = onSelect;

  /* Init carte */
  useEffect(() => {
    let annule = false;
    loadLeaflet().then((L) => {
      if (annule || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { center: MAROC, zoom: 5, scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setPret(true);
    }).catch(() => { if (!annule) setErreur(true); });
    return () => {
      annule = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; leafletPromise = null; }
    };
  }, []);

  /* Marqueurs */
  useEffect(() => {
    if (!pret || !mapRef.current) return;
    loadLeaflet().then(async (L) => {
      const map = mapRef.current;
      if (!map) return;

      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      const withCoords: Array<{ asso: AssociationBackend; coords: [number, number] }> = [];

      await Promise.all(associations.map(async (asso) => {
        let coords: [number, number] | null = null;
        if (asso.latitude && asso.longitude) {
          coords = [asso.latitude, asso.longitude];
        } else if (asso.ville) {
          coords = await geocodeVille(asso.ville);
        }
        if (coords) withCoords.push({ asso, coords });
      }));

      withCoords.forEach(({ asso, coords }) => {
        const active  = asso.id === selectedId;
        const { background } = missionPresentation(asso.domaine || "");
        const colorMap: Record<string, string> = {
          "bg-emerald": "#1f8a5b",
          "bg-pink":    "#e2457a",
          "bg-mustard": "#d97706",
        };
        const pinColor = colorMap[background] ?? "#151515";

        const initiales = asso.nom
          ? asso.nom.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
          : "A";
        const photo = isValidUrl(asso.photoProfil) ? asso.photoProfil : null;

        const popupHtml = `
          <div style="font-family:'DM Sans',system-ui,sans-serif;width:220px;background:#fff;">
            <div style="background:#fef9c3;border-bottom:2px solid #151515;padding:5px 10px;border-radius:10px 10px 0 0;">
              <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#151515;">
                ${asso.domaine || "Association"}
              </span>
            </div>
            <div style="padding:10px 12px 12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                ${photo
                  ? `<img src="${photo}" style="width:36px;height:36px;border-radius:8px;border:2px solid #151515;object-fit:cover;flex-shrink:0;" />`
                  : `<div style="width:36px;height:36px;border-radius:8px;border:2px solid #151515;background:#151515;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span style="color:#fff;font-size:11px;font-weight:800;">${initiales}</span>
                    </div>`
                }
                <div style="min-width:0;">
                  <p style="font-weight:800;font-size:13px;margin:0;color:#151515;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${asso.nom}</p>
                  ${asso.ville ? `<p style="font-size:11px;color:#9ca3af;margin:2px 0 0;display:flex;align-items:center;gap:3px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${asso.ville}
                  </p>` : ""}
                </div>
              </div>
              ${asso.description ? `<p style="font-size:11px;color:#6b7280;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${asso.description}</p>` : ""}
              ${asso.contact ? `<p style="font-size:11px;color:#6b7280;margin:0 0 8px;display:flex;align-items:center;gap:4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${asso.contact}
              </p>` : ""}
              <a href="/missions" style="display:block;text-align:center;background:#151515;color:#fff;border:2px solid #151515;border-radius:10px;padding:6px 12px;font-size:11px;font-weight:800;text-decoration:none;box-shadow:3px 3px 0 #f59e0b;">
                Voir ses missions &#8594;
              </a>
            </div>
          </div>`;

        const marker = L.marker(coords, {
          icon: makePin(L, pinColor, active),
          zIndexOffset: active ? 1000 : 0,
        }).addTo(map).bindPopup(popupHtml, { maxWidth: 240, className: "cmi-popup" });

        marker.on("click", () => onSelectRef.current?.(asso.id));
        if (active) setTimeout(() => marker.openPopup(), 100);

        markersRef.current.set(asso.id, marker);
      });

      /* fitBounds */
      if (withCoords.length > 0) {
        const bounds = L.latLngBounds(withCoords.map(({ coords }) => coords));
        map.fitBounds(bounds, { padding: [48, 48] });
      }
    });
  }, [pret, associations, selectedId]);

  /* Pan vers sélection */
  useEffect(() => {
    if (!pret || !selectedId || !mapRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) { mapRef.current.panTo(marker.getLatLng()); marker.openPopup(); }
  }, [pret, selectedId]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)] ${className}`}>
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {!pret && !erreur && (
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-muted text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          Chargement de la carte…
        </div>
      )}
      {erreur && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted p-4 text-center">
          <p className="font-semibold text-ink">Impossible de charger la carte</p>
          <p className="text-xs text-muted-foreground">Vérifiez votre connexion internet.</p>
        </div>
      )}

      <style>{`
        .cmi-popup .leaflet-popup-content-wrapper {
          padding:0;border:2px solid #151515;border-radius:12px;
          box-shadow:4px 4px 0 #151515;overflow:hidden;background:transparent;
        }
        .cmi-popup .leaflet-popup-content { margin:0;width:220px !important; }
        .cmi-popup .leaflet-popup-tip-container { display:none; }
        .cmi-popup .leaflet-popup-close-button {
          top:6px !important;right:8px !important;font-size:16px !important;
          color:#151515 !important;font-weight:900 !important;z-index:10;
        }
      `}</style>
    </div>
  );
}
