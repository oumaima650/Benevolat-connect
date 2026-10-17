import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Download, Loader2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  getMyMissions, getInscrits, getCertificats, delivrerCertificats, getPdfUrl,
  type MissionDashboard, type InscritDashboard, type CertificatResult,
} from '@/services/associationApi';
import { formaterDate } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/certificats')({
  component: Certificats,
});

function Certificats() {
  const [missions, setMissions] = useState<MissionDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // inscrits par missionId
  const [inscritsByMission, setInscritsByMission] = useState<Record<number, InscritDashboard[]>>({});
  const [certsByMission, setCertsByMission] = useState<Record<number, CertificatResult[]>>({});
  const [loadingMission, setLoadingMission] = useState<number | null>(null);

  // sélections par missionId : Set des inscriptionIds
  const [selections, setSelections] = useState<Record<number, Set<number>>>({});
  const [delivering, setDelivering] = useState<number | null>(null);

  useEffect(() => {
    getMyMissions()
      .then((data) => {
        const terminees = data.filter(m => ['TERMINEE', 'CLOTUREE'].includes(m.statut));
        setMissions(terminees);
      })
      .catch(() => toast.error('Impossible de charger les missions.'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleExpand(missionId: number) {
    if (expandedId === missionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(missionId);
    if (inscritsByMission[missionId]) return; // déjà chargé

    setLoadingMission(missionId);
    try {
      const [inscrits, certs] = await Promise.all([
        getInscrits(missionId),
        getCertificats(missionId),
      ]);
      const confirmes = inscrits.filter(i => i.statut === 'CONFIRMEE');
      setInscritsByMission(prev => ({ ...prev, [missionId]: confirmes }));
      setCertsByMission(prev => ({ ...prev, [missionId]: certs }));
      // Initialiser sélection
      setSelections(prev => ({ ...prev, [missionId]: new Set() }));
    } catch {
      toast.error('Impossible de charger les inscrits.');
    } finally {
      setLoadingMission(null);
    }
  }

  function toggleSelection(missionId: number, inscriptionId: number) {
    setSelections(prev => {
      const s = new Set(prev[missionId] ?? []);
      if (s.has(inscriptionId)) s.delete(inscriptionId); else s.add(inscriptionId);
      return { ...prev, [missionId]: s };
    });
  }

  async function handleDelivrer(missionId: number) {
    const sel = Array.from(selections[missionId] ?? []);
    if (sel.length === 0) { toast.error('Sélectionnez au moins un bénévole.'); return; }
    setDelivering(missionId);
    try {
      const results = await delivrerCertificats(missionId, sel);
      setCertsByMission(prev => {
        const existing = prev[missionId] ?? [];
        const existingIds = new Set(existing.map(c => c.certificatId));
        const newOnes = results.filter(r => !existingIds.has(r.certificatId));
        return { ...prev, [missionId]: [...existing, ...newOnes] };
      });
      setSelections(prev => ({ ...prev, [missionId]: new Set() }));
      toast.success(`${results.length} certificat(s) délivré(s) !`);
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de la délivrance.');
    } finally {
      setDelivering(null);
    }
  }

  function hasCertificat(missionId: number, inscriptionId: number) {
    return (certsByMission[missionId] ?? []).some(c => c.inscriptionId === inscriptionId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Certificats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Délivrez des certificats PDF personnalisés aux bénévoles pour les missions terminées.
        </p>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-12 text-center">
          <p className="text-2xl mb-2">📄</p>
          <p className="font-bold text-ink">Aucune mission terminée</p>
          <p className="text-sm text-muted-foreground mt-1">Les certificats sont disponibles pour les missions TERMINÉE ou CLÔTURÉE.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => {
            const isExpanded = expandedId === mission.id;
            const inscrits = inscritsByMission[mission.id] ?? [];
            const certs = certsByMission[mission.id] ?? [];
            const sel = selections[mission.id] ?? new Set();
            const isLoadingThis = loadingMission === mission.id;
            const isDelivering = delivering === mission.id;

            return (
              <div key={mission.id}
                className="overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]">
                {/* Header accordion */}
                <button type="button" onClick={() => toggleExpand(mission.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  aria-expanded={isExpanded}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-bold text-ink">{mission.titre}</p>
                      <p className="text-sm text-muted-foreground">
                        {formaterDate(mission.dateDebut)} •{' '}
                        <span className={`font-semibold ${mission.statut === 'CLOTUREE' ? 'text-emerald' : 'text-orange-600'}`}>
                          {mission.statut}
                        </span>
                        {certs.length > 0 && (
                          <span className="ml-2 text-xs font-semibold text-emerald">
                            {certs.length} certificat(s) délivré(s)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Contenu expandé */}
                {isExpanded && (
                  <div className="border-t-2 border-ink p-5 space-y-5">
                    {isLoadingThis ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : inscrits.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun bénévole confirmé pour cette mission.
                      </p>
                    ) : (
                      <>
                        {/* Liste des bénévoles */}
                        <div>
                          <p className="text-sm font-bold text-ink mb-3">
                            Sélectionnez les bénévoles pour lesquels délivrer un certificat :
                          </p>
                          <div className="space-y-2">
                            {inscrits.map((inscrit) => {
                              const alreadyHas = hasCertificat(mission.id, inscrit.inscriptionId);
                              return (
                                <div key={inscrit.inscriptionId}
                                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                                    alreadyHas
                                      ? 'border-emerald/40 bg-emerald/5'
                                      : 'border-ink/20 bg-muted hover:bg-muted/80'
                                  }`}>
                                  {alreadyHas ? (
                                    <Award className="h-4 w-4 text-emerald shrink-0" />
                                  ) : (
                                    <Checkbox
                                      id={`${mission.id}-${inscrit.inscriptionId}`}
                                      checked={sel.has(inscrit.inscriptionId)}
                                      onCheckedChange={() => toggleSelection(mission.id, inscrit.inscriptionId)}
                                    />
                                  )}
                                  <Label
                                    htmlFor={`${mission.id}-${inscrit.inscriptionId}`}
                                    className={`flex-1 ${alreadyHas ? 'cursor-default' : 'cursor-pointer'} font-medium text-ink`}
                                  >
                                    {inscrit.prenom} {inscrit.nom}
                                    <span className="ml-2 text-xs text-muted-foreground">{inscrit.ville}</span>
                                    {alreadyHas && (
                                      <span className="ml-2 text-xs font-semibold text-emerald">✓ Certificat délivré</span>
                                    )}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bouton délivrer */}
                        {inscrits.some(i => !hasCertificat(mission.id, i.inscriptionId)) && (
                          <Button onClick={() => handleDelivrer(mission.id)}
                            disabled={sel.size === 0 || isDelivering}
                            className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-40">
                            {isDelivering
                              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Génération PDF…</>
                              : <><Award className="mr-2 h-4 w-4" />Délivrer {sel.size > 0 ? `(${sel.size})` : ''} certificat{sel.size > 1 ? 's' : ''}</>
                            }
                          </Button>
                        )}

                        {/* Certificats délivrés pour cette mission */}
                        {certs.length > 0 && (
                          <div>
                            <p className="text-sm font-bold text-ink mb-2 border-t-2 border-ink/10 pt-4">
                              Certificats délivrés ({certs.length})
                            </p>
                            <div className="overflow-hidden rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
                              <table className="w-full text-xs">
                                <thead className="bg-emerald text-emerald-foreground">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-bold">Bénévole</th>
                                    <th className="hidden px-3 py-2 text-left font-bold sm:table-cell">Code</th>
                                    <th className="px-3 py-2 text-left font-bold">Date</th>
                                    <th className="px-3 py-2" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {certs.map((c, idx) => (
                                    <tr key={c.certificatId} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                                      <td className="px-3 py-2 font-medium text-ink">
                                        {c.benevolePrenom} {c.benevoleNom}
                                      </td>
                                      <td className="hidden px-3 py-2 sm:table-cell">
                                        <code className="rounded border border-ink/20 bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                                          {c.codeVerification}
                                        </code>
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {new Date(c.dateDelivrance).toLocaleDateString('fr-FR')}
                                      </td>
                                      <td className="px-3 py-2">
                                        {c.urlPdf ? (
                                          <a href={c.urlPdf} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm"
                                              className="rounded-lg border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] h-7 px-2">
                                              <Download className="h-3 w-3 mr-1" />PDF
                                            </Button>
                                          </a>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">En cours…</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
