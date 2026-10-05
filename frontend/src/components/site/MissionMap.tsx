import { useEffect, useRef, useState } from "react";
import type { Mission } from "./data";

declare global {
  interface Window {
    google?: any;
    __cmiMapsReady?: () => void;
  }
}

let loader: Promise<void> | null = null;
function chargerGoogleMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__cmiMapsReady = () => resolve();
    const env = import.meta.env as Record<string, string | undefined>;
    const key = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] ?? "";
    const channel = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__cmiMapsReady&channel=${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps n'a pas pu être chargé"));
    document.head.appendChild(s);
  });
  return loader;
}

const MAROC = { lat: 32.6, lng: -6.8 };

type Props = {
  missions: Mission[];
  selectedId?: string | null | undefined;
  onSelect?: ((id: string) => void) | undefined;
  position?: { lat: number; lng: number } | null;
  className?: string;
  zoom?: number | undefined;
};

export function MissionMap({ missions, selectedId, onSelect, position, className = "", zoom }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let actif = true;
    chargerGoogleMaps()
      .then(() => {
        if (!actif || !el.current) return;
        map.current = new window.google.maps.Map(el.current, {
          center: MAROC,
          zoom: zoom ?? 5,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
        setPret(true);
      })
      .catch(() => actif && setErreur(true));
    return () => { actif = false; };
  }, [zoom]);

  useEffect(() => {
    if (!pret) return;
    const g = window.google.maps;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = missions.map((m) => {
      const actif = m.id === selectedId;
      const marker = new g.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: map.current,
        title: m.titre,
        zIndex: actif ? 10 : 1,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: actif ? 13 : 9,
          fillColor: m.placesRestantes === 0 ? "#e2457a" : "#1f8a5b",
          fillOpacity: 1,
          strokeColor: "#151515",
          strokeWeight: 2.5,
        },
      });
      marker.addListener("click", () => onSelectRef.current?.(m.id));
      return marker;
    });
    if (missions.length === 1) {
      map.current.setCenter({ lat: missions[0]!.lat, lng: missions[0]!.lng });
      map.current.setZoom(zoom ?? 13);
    } else if (missions.length > 1 && !position) {
      const b = new g.LatLngBounds();
      missions.forEach((m) => b.extend({ lat: m.lat, lng: m.lng }));
      map.current.fitBounds(b, 40);
    }
  }, [pret, missions, selectedId, position, zoom]);

  useEffect(() => {
    if (!pret || !selectedId) return;
    const m = missions.find((x) => x.id === selectedId);
    if (m) map.current.panTo({ lat: m.lat, lng: m.lng });
  }, [pret, selectedId, missions]);

  useEffect(() => {
    if (!pret) return;
    userMarker.current?.setMap(null);
    if (!position) return;
    const g = window.google.maps;
    userMarker.current = new g.Marker({
      position,
      map: map.current,
      title: "Ta position",
      zIndex: 20,
      icon: { path: g.SymbolPath.CIRCLE, scale: 8, fillColor: "#2f6fe4", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 },
    });
    map.current.setCenter(position);
    map.current.setZoom(9);
  }, [pret, position]);

  return (
    <div className={`relative overflow-hidden rounded-lg border-2 border-ink bg-muted ${className}`}>
      <div ref={el} className="absolute inset-0" />
      {!pret && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          {erreur ? "La carte n'a pas pu se charger." : "Chargement de la carte…"}
        </div>
      )}
    </div>
  );
}
