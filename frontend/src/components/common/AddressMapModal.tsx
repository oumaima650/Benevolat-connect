import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Check, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export interface AddressResult {
  latitude: number;
  longitude: number;
  adresse: string;
  ville: string;
}

interface Props {
  open: boolean;
  initial?: { latitude: number | null; longitude: number | null };
  onConfirm: (result: AddressResult) => void;
  onClose: () => void;
}

/* fix leaflet default marker icons in Vite/webpack */
function fixLeafletIcons(L: typeof import('leaflet')) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

async function nominatimReverse(lat: number, lng: number): Promise<{ adresse: string; ville: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
    { headers: { 'User-Agent': 'BenevolatConnect/1.0' } }
  );
  if (!res.ok) return { adresse: '', ville: '' };
  const data = await res.json();
  const ville =
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality ||
    data.address?.county ||
    '';
  return { adresse: data.display_name ?? '', ville };
}

export function AddressMapModal({ open, initial, onConfirm, onClose }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);

  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  /* ── initialise / reset on open ── */
  useEffect(() => {
    if (!open) return;
    const initLat = initial?.latitude ?? null;
    const initLng = initial?.longitude ?? null;
    setLat(initLat);
    setLng(initLng);
    setAdresse('');
    setVille('');
    // pré-résoudre l'adresse si des coordonnées existent déjà
    if (initLat !== null && initLng !== null) {
      setLoading(true);
      nominatimReverse(initLat, initLng).then((result) => {
        setAdresse(result.adresse);
        setVille(result.ville);
        setLoading(false);
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── build Leaflet map ── */
  useEffect(() => {
    if (!open || !mapElRef.current) return;
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapElRef.current) return;
      fixLeafletIcons(L);

      const centerLat = lat ?? 33.9716;
      const centerLng = lng ?? -6.8498;
      const zoom = lat !== null ? 14 : 6;

      const map = L.map(mapElRef.current, { zoomControl: true }).setView([centerLat, centerLng], zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      /* place initial marker */
      if (lat !== null && lng !== null) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current!.getLatLng();
          setLat(pos.lat);
          setLng(pos.lng);
          setLoading(true);
          const result = await nominatimReverse(pos.lat, pos.lng);
          setAdresse(result.adresse);
          setVille(result.ville);
          setLoading(false);
        });
      }

      /* click on map → place/move marker */
      map.on('click', async (e: import('leaflet').LeafletMouseEvent) => {
        const { lat: clat, lng: clng } = e.latlng;
        setLat(clat);
        setLng(clng);

        if (markerRef.current) {
          markerRef.current.setLatLng([clat, clng]);
        } else {
          markerRef.current = L.marker([clat, clng], { draggable: true }).addTo(map);
          markerRef.current.on('dragend', async () => {
            const pos = markerRef.current!.getLatLng();
            setLat(pos.lat);
            setLng(pos.lng);
            setLoading(true);
            const result = await nominatimReverse(pos.lat, pos.lng);
            setAdresse(result.adresse);
            setVille(result.ville);
            setLoading(false);
          });
        }

        setLoading(true);
        const result = await nominatimReverse(clat, clng);
        setAdresse(result.adresse);
        setVille(result.ville);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── geolocation button ── */
  async function handleGeolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const clat = Number(pos.coords.latitude.toFixed(6));
        const clng = Number(pos.coords.longitude.toFixed(6));
        setLat(clat);
        setLng(clng);

        import('leaflet').then((L) => {
          if (!mapRef.current) return;
          mapRef.current.setView([clat, clng], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([clat, clng]);
          } else {
            markerRef.current = L.marker([clat, clng], { draggable: true }).addTo(mapRef.current!);
          }
        });

        setLoading(true);
        const result = await nominatimReverse(clat, clng);
        setAdresse(result.adresse);
        setVille(result.ville);
        setLoading(false);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  function handleConfirm() {
    if (lat === null || lng === null) return;
    onConfirm({ latitude: lat, longitude: lng, adresse, ville });
  }

  if (!open) return null;

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* modal */}
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-ink bg-paper shadow-[8px_8px_0_var(--color-ink)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* header */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-mustard px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-ink" />
            <span className="font-display text-lg font-black text-ink">Choisir mon adresse</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-paper hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-ink" />
          </button>
        </div>

        {/* carte */}
        <div className="relative" style={{ height: '340px', flexShrink: 0 }}>
          <div ref={mapElRef} style={{ height: '100%', width: '100%' }} />
          {/* hint */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-paper/90 px-3 py-1 text-[11px] font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] whitespace-nowrap">
            Cliquez sur la carte ou glissez le marqueur pour choisir
          </div>
        </div>

        {/* contrôles — scrollable pour ne jamais couper les boutons */}
        <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1 min-h-0">

          {/* bouton géolocaliser */}
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={locating}
            className="press inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-emerald py-2.5 text-sm font-black text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none transition-all"
          >
            <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Localisation…' : 'Me géolocaliser'}
          </button>

          {/* champs adresse + ville */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Adresse complète</label>
              <div className={`flex items-start gap-2 rounded-xl border-2 border-ink px-3 py-2.5 text-sm shadow-[3px_3px_0_var(--color-ink)] min-h-[44px] ${
                loading ? 'bg-mustard/20 animate-pulse' : 'bg-paper'
              }`}>
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-ink/50" />
                <input
                  type="text"
                  value={loading ? '' : adresse}
                  onChange={e => setAdresse(e.target.value)}
                  placeholder={loading ? 'Chargement…' : (lat === null ? 'Cliquez sur la carte…' : 'Adresse')}
                  className="flex-1 bg-transparent outline-none text-ink placeholder:text-muted-foreground text-xs"
                  readOnly={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Ville</label>
              <input
                type="text"
                value={ville}
                onChange={e => setVille(e.target.value)}
                placeholder="Ville"
                className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-2.5 text-sm font-medium text-ink placeholder:text-muted-foreground shadow-[3px_3px_0_var(--color-ink)] focus:outline-none"
              />
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-ink bg-paper py-2.5 text-sm font-black text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={lat === null || lng === null}
              className="press flex-2 flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-pink px-6 py-2.5 text-sm font-black text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Check className="h-4 w-4" />
              Confirmer l'adresse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
