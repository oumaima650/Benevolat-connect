import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, CalendarDays } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { MissionStatut } from './data';

// Fix default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapMarker {
  id: number;
  titre: string;
  lat: number;
  lng: number;
  lieu: string;
  date: string;
  places: number;
  statut: MissionStatut;
  /** Couleur du marqueur (selon le statut). Si absente, le pin Leaflet par défaut est utilisé. */
  color?: string;
  /** Statut d'inscription du bénévole sur cette mission */
  inscriptionStatut?: 'CONFIRMEE' | 'EN_LISTE_ATTENTE' | 'ANNULEE' | null;
}

/** Marqueur rond coloré (aucune image externe requise). */
function marqueurColore(color: string) {
  return L.divIcon({
    className: '',
    html:
      `<span style="display:block;width:18px;height:18px;border-radius:50%;` +
      `background:${color};border:2px solid #1a1a1a;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

interface MapComponentProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onViewDetail?: (marker: MapMarker) => void;
  onVoirCertificat?: (marker: MapMarker) => void;
}

export default function MapComponent({
  markers,
  center = [35.5785, -5.3684],
  zoom = 8,
  height = 'calc(100vh - 12rem)',
  onViewDetail,
  onVoirCertificat,
}: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={m.color ? marqueurColore(m.color) : undefined}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 6 }}>{m.titre}</p>
              <StatusBadge statut={m.statut} />
              <p style={{ fontSize: 12, color: '#555', marginTop: 4 }} className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.lieu}</p>
              <p style={{ fontSize: 12, color: '#555', marginTop: 2 }} className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {m.date}</p>
              <p style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                {m.places > 0 ? `${m.places} place(s) restante(s)` : 'Complet'}
              </p>
              {onViewDetail && (
                <button
                  onClick={() => onViewDetail(m)}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    border: '2px solid #1a1a1a',
                    background: '#fde047',
                    padding: '4px 8px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Voir le détail
                </button>
              )}
              {onVoirCertificat && m.statut === 'TERMINEE' && m.inscriptionStatut === 'CONFIRMEE' && (
                <button
                  onClick={() => onVoirCertificat(m)}
                  style={{
                    marginTop: 4,
                    width: '100%',
                    border: '2px solid #1a1a1a',
                    background: '#fde047',
                    padding: '4px 8px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Voir certificat
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
