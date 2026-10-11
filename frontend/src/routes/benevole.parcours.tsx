import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { inscriptionsBenevole, certificats, formaterDate } from '@/components/dashboard/data';
import type { InscriptionBenevole } from '@/components/dashboard/data';

export const Route = createFileRoute('/benevole/parcours')({
  component: MonParcours,
});

function MonParcours() {
  const [inscriptions, setInscriptions] = useState<InscriptionBenevole[]>(inscriptionsBenevole);
  const [filtreStatut, setFiltreStatut] = useState<string>('Tous');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filteredInscriptions =
    filtreStatut === 'Tous' ? inscriptions : inscriptions.filter((i) => i.statut === filtreStatut);

  function annulerInscription(id: string) {
    setInscriptions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, statut: 'ANNULEE' as const } : i)),
    );
    toast.success('Inscription annulée');
    setConfirmId(null);
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

          {filteredInscriptions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune inscription"
              description="Aucune inscription ne correspond à ce filtre."
            />
          ) : (
            <div className="space-y-3">
              {filteredInscriptions.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <h3 className="font-bold text-ink">{i.missionTitre}</h3>
                      <StatusBadge
                        statut={
                          i.statut === 'CONFIRMEE'
                            ? 'EN_COURS'
                            : i.statut === 'ANNULEE'
                              ? 'ANNULEE'
                              : 'PUBLIEE'
                        }
                      />
                      {i.statut === 'EN_LISTE_ATTENTE' && i.rang != null && (
                        <span className="rounded-full border-2 border-orange-400 bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                          Rang {i.rang}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {i.association} — {i.ville}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" aria-hidden="true" />
                      {formaterDate(i.dateDebut)} → {formaterDate(i.dateFin)}
                    </p>
                  </div>

                  {/* Cancel button only for non-ANNULEE and before mission start */}
                  {i.statut !== 'ANNULEE' && new Date(i.dateDebut) > new Date() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmId(i.id)}
                      className="shrink-0 rounded-xl border-2 border-ink text-red-600 shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-50"
                    >
                      Annuler mon inscription
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Certificats */}
        <TabsContent value="certificats" className="mt-4 space-y-4">
          {certificats.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun certificat"
              description="Vous n'avez pas encore de certificats. Réalisez des missions pour en obtenir !"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
              <table className="w-full text-sm">
                <thead className="bg-mustard">
                  <tr>
                    <th className="border-b-2 border-ink px-4 py-3 text-left font-bold text-ink">
                      Mission
                    </th>
                    <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold text-ink sm:table-cell">
                      Association
                    </th>
                    <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold text-ink md:table-cell">
                      Date
                    </th>
                    <th className="border-b-2 border-ink px-4 py-3 text-left font-bold text-ink">
                      Code
                    </th>
                    <th className="border-b-2 border-ink px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {certificats.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                      <td className="px-4 py-3 font-medium text-ink">{c.missionTitre}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {c.association}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info('📄 Téléchargement en cours…')}
                          className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
                          aria-label={`Télécharger le certificat pour ${c.missionTitre}`}
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
