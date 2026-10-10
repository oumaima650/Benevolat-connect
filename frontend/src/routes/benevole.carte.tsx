import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { MapMarker } from '@/components/dashboard/MapComponent';

export const Route = createFileRoute('/benevole/carte')({
  component: CarteMissions,
});

const MapComponent = lazy(() => import('@/components/dashboard/MapComponent'));

const ALL_MARKERS: MapMarker[] = [
  { id: 1, titre: 'Distribution alimentaire', lat: 35.5785, lng: -5.3684, lieu: 'Tétouan', date: '15 Nov', places: 3, statut: 'PUBLIEE' },
  { id: 2, titre: 'Atelier lecture', lat: 35.7767, lng: -5.8039, lieu: 'Tanger', date: '22 Nov', places: 5, statut: 'PUBLIEE' },
  { id: 3, titre: 'Nettoyage plage Cap Spartel', lat: 35.7882, lng: -5.9226, lieu: 'Cap Spartel', date: '25 Nov', places: 0, statut: 'COMPLETE' },
  { id: 4, titre: 'Cours soutien scolaire', lat: 34.0209, lng: -6.8416, lieu: 'Rabat', date: '18 Nov', places: 8, statut: 'PUBLIEE' },
  { id: 5, titre: 'Collecte vêtements', lat: 33.9716, lng: -6.8498, lieu: 'Salé', date: '28 Nov', places: 2, statut: 'RENFORT_URGENT' },
  { id: 6, titre: 'Jardinage collectif', lat: 34.0331, lng: -5.0003, lieu: 'Fès', date: '1 Déc', places: 12, statut: 'PUBLIEE' },
  { id: 7, titre: 'Aide aux devoirs', lat: 35.6111, lng: -5.3666, lieu: 'Tétouan', date: '16 Nov', places: 4, statut: 'EN_COURS' },
  { id: 8, titre: 'Animation jeunesse', lat: 35.5893, lng: -5.3763, lieu: 'Tétouan', date: '30 Nov', places: 6, statut: 'PUBLIEE' },
];

const DOMAINES = ['Tous', 'Solidarité', 'Environnement', 'Éducation', 'Sport', 'Santé', 'Culture', 'Social'];

function CarteMissions() {
  const [domaine, setDomaine] = useState('Tous');
  const [dateFilter, setDateFilter] = useState('');

  // Markers are shown as-is for demo (no domaine field on MapMarker)
  const markers = ALL_MARKERS;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Carte des missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualisez les missions près de chez vous.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <Select value={domaine} onValueChange={setDomaine}>
          <SelectTrigger className="w-44 border-2 border-ink rounded-xl">
            <SelectValue placeholder="Domaine" />
          </SelectTrigger>
          <SelectContent>
            {DOMAINES.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44 border-2 border-ink rounded-xl"
          aria-label="Filtrer par date"
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-green-500 border border-ink inline-block" aria-hidden="true" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-orange-400 border border-ink inline-block" aria-hidden="true" />
            Complet
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500 border border-ink inline-block" aria-hidden="true" />
            Urgent
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]"
        style={{ height: 'calc(100vh - 14rem)' }}
      >
        <Suspense fallback={<Skeleton className="w-full h-full" />}>
          <MapComponent markers={markers} height="100%" />
        </Suspense>
      </div>
    </div>
  );
}
