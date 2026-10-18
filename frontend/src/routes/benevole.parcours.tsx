import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, CalendarDays, Building2, Sparkles, Hourglass, CheckCircle2, XCircle, ArrowRight, MapPin, Award, Loader2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formaterDate } from '@/components/dashboard/data';
import type { InscriptionBenevole } from '@/components/dashboard/data';
import { useAuth } from '@/context/AuthContext';
import { inscriptionApi, type BenevoleInscription, type BenevoleCertificat } from '@/services/missionApi';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/benevole/parcours')({
  component: MonParcours,
});

function mapApiToInscription(b: BenevoleInscription): InscriptionBenevole {
  const base = {
    id: String(b.idInscription),
    missionId: String(b.missionId),
    missionTitre: b.missionTitre,
    association: b.association ?? 'Association',
    domaine: b.domaine ?? '',
    dateDebut: b.dateDebut,
    dateFin: b.dateFin,
    ville: b.ville ?? '',
    statut: b.statut,
    dateInscription: b.dateInscription,
  };
  return b.rang != null ? { ...base, rang: b.rang } : base;
}

function MonParcours() {
  const { user, token } = useAuth();
  const [inscriptions, setInscriptions] = useState<InscriptionBenevole[]>([]);
  const [certificatsList, setCertificatsList] = useState<BenevoleCertificat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState<string>('Tous');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) { setLoading(false); return; }
    inscriptionApi
      .getMesInscriptions(token)
      .then((data) => setInscriptions(data.map(mapApiToInscription)))
      .catch(() => toast.error('Erreur lors du chargement des inscriptions.'))
      .finally(() => setLoading(false));
  }, [user, token]);

  function loadCertificats() {
    if (!token || certificatsList.length > 0) return;
    setLoadingCerts(true);
    inscriptionApi.getMesCertificats(token)
      .then(setCertificatsList)
      .catch(() => toast.error('Erreur lors du chargement des certificats.'))
      .finally(() => setLoadingCerts(false));
  }

  const filteredInscriptions =
    filtreStatut === 'Tous' ? inscriptions : inscriptions.filter((i) => i.statut === filtreStatut);

  async function annulerInscription(id: string) {
    const item = inscriptions.find((i) => i.id === id);
    if (!item || !token) return;
    try {
      await inscriptionApi.annuler(token, item.missionId);
      setInscriptions((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          const { rang, ...rest } = i;
          return { ...rest, statut: 'ANNULEE' as const };
        }),
      );
      toast.success('Inscription annulée.');
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'annulation.");
    } finally {
      setConfirmId(null);
    }
  }

  const confirmItem = inscriptions.find((i) => i.id === confirmId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Mon parcours</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez vos inscriptions et vos certificats.
        </p>
      </div>

      <Tabs defaultValue="inscriptions">
        <TabsList className="h-auto gap-1 rounded-xl border-2 border-ink bg-muted p-1">
          <TabsTrigger
            value="inscriptions"
            className="rounded-lg data-[state=active]:bg-mustard data-[state=active]:font-bold data-[state=active]:text-ink"
          >
            Mes inscriptions
          </TabsTrigger>
          <TabsTrigger
            value="certificats"
            className="rounded-lg data-[state=active]:bg-mustard data-[state=active]:font-bold data-[state=active]:text-ink"
            onClick={loadCertificats}
          >
            Mes certificats
          </TabsTrigger>
        </TabsList>

        {/* Inscriptions */}
        <TabsContent value="inscriptions" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="w-52 rounded-xl border-2 border-ink">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous">Tous les statuts</SelectItem>
                <SelectItem value="CONFIRMEE">Confirmée</SelectItem>
                <SelectItem value="EN_LISTE_ATTENTE">En liste d'attente</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredInscriptions.length} résultat{filteredInscriptions.length > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement de vos inscriptions…</p>
          ) : filteredInscriptions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune inscription"
              description="Aucune inscription ne correspond à ce filtre."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredInscriptions.map((i) => {
                const isConfirmed = i.statut === 'CONFIRMEE';
                const isWaiting = i.statut === 'EN_LISTE_ATTENTE';
                const isCancelled = i.statut === 'ANNULEE';
                return (
                  <div
                    key={i.id}
                    className={cn(
                      'flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_var(--color-ink)] transition-transform hover:-translate-y-0.5',
                      isCancelled && 'opacity-60',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold leading-tight text-ink truncate">{i.missionTitre}</h3>
                        {i.association && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <Building2 className="h-3.5 w-3.5 shrink-0" /> {i.association}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[11px] font-bold',
                          isConfirmed && 'border-emerald-600 bg-emerald-100 text-emerald-700',
                          isWaiting && 'border-amber-500 bg-amber-100 text-amber-700',
                          isCancelled && 'border-gray-400 bg-gray-100 text-gray-600',
                        )}
                      >
                        {isConfirmed && <CheckCircle2 className="h-3 w-3" />}
                        {isWaiting && <Hourglass className="h-3 w-3" />}
                        {isCancelled && <XCircle className="h-3 w-3" />}
                        {isConfirmed ? 'Confirmée' : isWaiting ? "Liste d'attente" : 'Annulée'}
                      </span>
                    </div>

                    {isWaiting && i.rang != null && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                        <Hourglass className="h-3.5 w-3.5" />
                        Vous êtes n°{i.rang} dans la liste d'attente
                      </div>
                    )}

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {i.domaine && (
                        <p className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 shrink-0" /> {i.domaine}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formaterDate(i.dateDebut)}
                        {i.dateFin && i.dateFin !== i.dateDebut && <> → {formaterDate(i.dateFin)}</>}
                      </p>
                      {i.ville && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> {i.ville}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/missions/${i.missionId}`}
                        className="press inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard/20"
                      >
                        Voir la mission <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {i.statut !== 'ANNULEE' && new Date(i.dateDebut) > new Date() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmId(i.id)}
                          className="shrink-0 rounded-lg border-2 border-ink text-red-600 shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-50"
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Certificats */}
        <TabsContent value="certificats" className="mt-4 space-y-4">
          {loadingCerts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : certificatsList.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Aucun certificat"
              description="Vous n'avez pas encore de certificats. Participez à des missions pour en obtenir !"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {certificatsList.length} certificat{certificatsList.length > 1 ? 's' : ''} — disponibles dans votre espace et par email.
              </p>
              <div className="overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
                <table className="w-full text-sm">
                  <thead className="bg-mustard">
                    <tr>
                      <th className="border-b-2 border-ink px-4 py-3 text-left font-bold text-ink">Mission</th>
                      <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold text-ink sm:table-cell">Association</th>
                      <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold text-ink md:table-cell">Date</th>
                      <th className="border-b-2 border-ink px-4 py-3 text-left font-bold text-ink">Code</th>
                      <th className="border-b-2 border-ink px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {certificatsList.map((c, idx) => (
                      <tr key={c.certificatId} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                        <td className="px-4 py-3 font-medium text-ink max-w-[160px] truncate">
                          {c.missionTitre ?? '—'}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {c.associationNom ?? '—'}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {formaterDate(c.dateDelivrance)}
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded border border-ink/20 bg-muted px-2 py-0.5 font-mono text-xs">
                            {c.codeVerification}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          {c.urlPdf ? (
                            <a href={c.urlPdf} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm"
                                className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard/30"
                                aria-label={`Télécharger le certificat pour ${c.missionTitre}`}>
                                <Download className="mr-1 h-3.5 w-3.5" />PDF
                              </Button>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">En cours…</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        title="Annuler l'inscription"
        description={`Êtes-vous sûr(e) de vouloir annuler votre inscription à "${confirmItem?.missionTitre ?? ''}" ? Cette action est irréversible.`}
        confirmLabel="Annuler l'inscription"
        variant="destructive"
        onConfirm={() => {
          if (confirmId) annulerInscription(confirmId);
        }}
      />
    </div>
  );
}
