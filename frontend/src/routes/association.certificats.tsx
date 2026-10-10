import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formaterDate, inscritsMission } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/certificats')({
  component: Certificats,
});

interface MissionTerminee {
  id: string;
  titre: string;
  dateDebut: string;
  dateDelivered: boolean;
}

const MISSIONS_TERMINEES: MissionTerminee[] = [
  { id: 'mt1', titre: 'Marathon caritatif de Casablanca', dateDebut: '2026-05-10', dateDelivered: false },
  { id: 'mt2', titre: 'Journée portes ouvertes culturelle', dateDebut: '2026-04-15', dateDelivered: false },
  { id: 'mt3', titre: 'Campagne de sensibilisation santé', dateDebut: '2026-08-05', dateDelivered: false },
];

interface CertificatDelivered {
  id: string;
  benevoleNom: string;
  missionTitre: string;
  code: string;
  date: string;
}

const INIT_DELIVERED: CertificatDelivered[] = [
  { id: 'cd1', benevoleNom: 'Karim Benjelloun', missionTitre: 'Nettoyage plage 2025', code: 'CMI-2025-0042', date: '2025-11-15' },
  { id: 'cd2', benevoleNom: 'Nadia Alami', missionTitre: 'Nettoyage plage 2025', code: 'CMI-2025-0043', date: '2025-11-15' },
  { id: 'cd3', benevoleNom: 'Yasmine El Idrissi', missionTitre: 'Distribution repas 2025', code: 'CMI-2025-0118', date: '2025-12-10' },
];

const CONFIRMES = inscritsMission.filter((i) => i.statut === 'CONFIRMEE');

function Certificats() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [delivered, setDelivered] = useState<CertificatDelivered[]>(INIT_DELIVERED);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    if (!selections[id]) {
      setSelections((prev) => ({ ...prev, [id]: [] }));
    }
  }

  function toggleSelection(missionId: string, inscritId: string) {
    setSelections((prev) => {
      const current = prev[missionId] ?? [];
      return {
        ...prev,
        [missionId]: current.includes(inscritId)
          ? current.filter((x) => x !== inscritId)
          : [...current, inscritId],
      };
    });
  }

  function deliverCertificats(mission: MissionTerminee) {
    const selected = selections[mission.id] ?? [];
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins un bénévole.');
      return;
    }

    const newCerts = selected.map((id) => {
      const inscrit = CONFIRMES.find((c) => c.id === id);
      const code = `CMI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      return {
        id: `cert-${Date.now()}-${id}`,
        benevoleNom: inscrit ? `${inscrit.prenom} ${inscrit.nom}` : id,
        missionTitre: mission.titre,
        code,
        date: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
      };
    });

    setDelivered((prev) => [...prev, ...newCerts]);
    setSelections((prev) => ({ ...prev, [mission.id]: [] }));
    toast.success(`✅ ${newCerts.length} certificat(s) délivré(s) !`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Certificats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Délivrez des certificats aux bénévoles pour les missions terminées.
        </p>
      </div>

      {/* Missions terminées */}
      <div>
        <h2 className="font-display mb-3 font-bold text-ink">Missions terminées</h2>
        <div className="space-y-3">
          {MISSIONS_TERMINEES.map((mission) => {
            const isExpanded = expandedId === mission.id;
            const selected = selections[mission.id] ?? [];

            return (
              <div
                key={mission.id}
                className="overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(mission.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                  aria-expanded={isExpanded}
                >
                  <div>
                    <p className="font-bold text-ink">{mission.titre}</p>
                    <p className="text-sm text-muted-foreground">
                      {formaterDate(mission.dateDebut)}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t-2 border-ink p-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      Sélectionnez les bénévoles pour lesquels vous souhaitez délivrer un certificat.
                    </p>
                    <div className="space-y-2">
                      {CONFIRMES.map((inscrit) => (
                        <div key={inscrit.id} className="flex items-center gap-3 rounded-xl border border-ink/20 bg-muted p-3">
                          <Checkbox
                            id={`${mission.id}-${inscrit.id}`}
                            checked={selected.includes(inscrit.id)}
                            onCheckedChange={() => toggleSelection(mission.id, inscrit.id)}
                          />
                          <Label
                            htmlFor={`${mission.id}-${inscrit.id}`}
                            className="flex-1 cursor-pointer font-medium text-ink"
                          >
                            {inscrit.prenom} {inscrit.nom}
                            <span className="ml-2 text-xs text-muted-foreground">{inscrit.ville}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => deliverCertificats(mission)}
                      disabled={selected.length === 0}
                      className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-40"
                    >
                      Délivrer {selected.length > 0 ? `(${selected.length})` : ''} certificat
                      {selected.length > 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificats délivrés */}
      <div>
        <h2 className="font-display mb-3 font-bold text-ink">
          Certificats délivrés ({delivered.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          <table className="w-full text-sm">
            <thead className="bg-emerald text-emerald-foreground">
              <tr>
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Bénévole</th>
                <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold sm:table-cell">Mission</th>
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Code</th>
                <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold md:table-cell">Date</th>
                <th className="border-b-2 border-ink px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {delivered.map((c, idx) => (
                <tr key={c.id} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                  <td className="px-4 py-3 font-medium text-ink">{c.benevoleNom}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{c.missionTitre}</td>
                  <td className="px-4 py-3">
                    <code className="rounded border border-ink/20 bg-muted px-2 py-0.5 font-mono text-xs">
                      {c.code}
                    </code>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formaterDate(c.date)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('📄 Téléchargement en cours…')}
                      className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
                      aria-label={`Télécharger le certificat de ${c.benevoleNom}`}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
