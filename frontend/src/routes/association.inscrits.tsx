import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Loader2, Award, User } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BanniereBenevole, PastilleNiveau } from '@/components/gamification/BanniereBenevole';
import { getMyMissions, getInscrits, type MissionDashboard, type InscritDashboard } from '@/services/associationApi';

export const Route = createFileRoute('/association/inscrits')({
  component: InscritsMission,
});

function NiveauBadge({ inscrit }: { inscrit: InscritDashboard }) {
  const g = inscrit.gamification;
  if (!g) return null;
  return <PastilleNiveau theme={g.theme} niveau={g.niveau} nomNiveau={g.nomNiveau} />;
}

function ProfilSheet({ inscrit, onClose }: { inscrit: InscritDashboard; onClose: () => void }) {
  return (
    <SheetContent className="border-l-2 border-ink overflow-y-auto w-80">
      <SheetHeader>
        <SheetTitle className="font-display text-xl font-black text-ink">
          {inscrit.prenom} {inscrit.nom}
        </SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-5">
        {/* Bannière du bénévole (dernier badge palier) */}
        {inscrit.gamification && (
          <BanniereBenevole
            theme={inscrit.gamification.theme}
            niveau={inscrit.gamification.niveau}
            nomNiveau={inscrit.gamification.nomNiveau}
            taille="sm"
          >
            {inscrit.gamification.palier && (
              <p className="text-xs font-semibold">Badge {inscrit.gamification.palier}</p>
            )}
          </BanniereBenevole>
        )}
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mustard shadow-[2px_2px_0_var(--color-ink)] overflow-hidden">
            {inscrit.photoUrl
              ? <img src={inscrit.photoUrl} alt="" className="h-full w-full object-cover" />
              : <span className="text-xl font-black text-ink">
                  {(inscrit.prenom?.[0] ?? '') + (inscrit.nom?.[0] ?? '')}
                </span>
            }
          </div>
          <div>
            <p className="font-bold text-ink">{inscrit.prenom} {inscrit.nom}</p>
            {inscrit.ville && <p className="text-sm text-muted-foreground">{inscrit.ville}</p>}
            {inscrit.email && <p className="text-xs text-muted-foreground">{inscrit.email}</p>}
            <Link
              to="/benevoles/$id"
              params={{ id: String(inscrit.benevoleId) }}
              className="mt-1 inline-block text-xs font-bold text-pink underline underline-offset-2"
            >
              Voir le profil et les badges
            </Link>
          </div>
        </div>

        {/* Statut */}
        <div className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold ${
          inscrit.statut === 'CONFIRMEE'
            ? 'border-green-400 bg-green-50 text-green-700'
            : 'border-orange-400 bg-orange-50 text-orange-700'
        }`}>
          {inscrit.statut === 'CONFIRMEE' ? '✓ Inscrit(e) confirmé(e)' : `⏳ Liste d'attente — rang ${inscrit.rang}`}
        </div>

        {/* Compétences */}
        {inscrit.competences.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Compétences</p>
            <div className="flex flex-wrap gap-1.5">
              {inscrit.competences.map((c) => (
                <span key={c} className="rounded-full border border-ink/20 bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certificat */}
        {inscrit.certificatDelivre && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-emerald bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald">
            <Award className="h-4 w-4" /> Certificat délivré
          </div>
        )}

        <div className="rounded-xl border border-ink/20 bg-muted px-3 py-2 text-xs text-muted-foreground">
          Inscrit(e) le {new Date(inscrit.dateInscription).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </SheetContent>
  );
}

function InscritsMission() {
  const [missions, setMissions] = useState<MissionDashboard[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [inscrits, setInscrits] = useState<InscritDashboard[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [loadingInscrits, setLoadingInscrits] = useState(false);
  const [selectedInscrit, setSelectedInscrit] = useState<InscritDashboard | null>(null);

  useEffect(() => {
    getMyMissions()
      .then((data) => {
        // Afficher toutes les missions sauf brouillons
        const filtrees = data.filter(m => m.statut !== 'BROUILLON');
        setMissions(filtrees);
        if (filtrees.length > 0) {
          setSelectedMissionId(String(filtrees[0]!.id));
        }
      })
      .catch(() => toast.error('Impossible de charger les missions.'))
      .finally(() => setLoadingMissions(false));
  }, []);

  useEffect(() => {
    if (!selectedMissionId) return;
    setLoadingInscrits(true);
    getInscrits(Number(selectedMissionId))
      .then(setInscrits)
      .catch(() => toast.error('Impossible de charger les inscrits.'))
      .finally(() => setLoadingInscrits(false));
  }, [selectedMissionId]);

  const confirmes = inscrits.filter(i => i.statut === 'CONFIRMEE');
  const attente = inscrits.filter(i => i.statut === 'EN_LISTE_ATTENTE')
    .sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Inscrits & liste d'attente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez les inscrits et la liste d'attente par mission.
        </p>
      </div>

      {/* Sélecteur de mission */}
      {loadingMissions ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement des missions…
        </div>
      ) : (
        <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
          <SelectTrigger className="w-full max-w-lg rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
            <SelectValue placeholder="Choisir une mission" />
          </SelectTrigger>
          <SelectContent>
            {missions.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.titre} — {m.statut}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Stats rapides */}
      {!loadingInscrits && inscrits.length > 0 && (
        <div className="flex gap-4">
          <div className="rounded-xl border-2 border-ink bg-emerald/10 px-4 py-2 text-sm font-semibold text-emerald">
            ✓ {confirmes.length} confirmé(s)
          </div>
          <div className="rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
            ⏳ {attente.length} en attente
          </div>
        </div>
      )}

      {loadingInscrits ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Inscrits confirmés */}
          <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
            <div className="border-b-2 border-ink bg-emerald px-4 py-3">
              <h2 className="font-bold text-emerald-foreground">Inscrits confirmés ({confirmes.length})</h2>
            </div>
            {confirmes.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Aucun inscrit confirmé.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Nom</th>
                    <th className="hidden border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink sm:table-cell">Ville</th>
                    <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmes.map((i, idx) => (
                    <tr key={i.inscriptionId}
                      className={`cursor-pointer transition-colors hover:bg-emerald/10 ${idx % 2 === 0 ? 'bg-paper' : 'bg-muted/30'}`}
                      onClick={() => setSelectedInscrit(i)}>
                      <td className="px-4 py-2.5 font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {i.prenom} {i.nom}
                          <NiveauBadge inscrit={i} />
                          {i.certificatDelivre && <Award className="h-3.5 w-3.5 text-emerald" title="Certificat délivré" />}
                        </div>
                      </td>
                      <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{i.ville}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(i.dateInscription).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Liste d'attente */}
          <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
            <div className="border-b-2 border-ink bg-orange-100 px-4 py-3">
              <h2 className="font-bold text-orange-800">Liste d'attente ({attente.length})</h2>
            </div>
            {attente.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Liste d'attente vide.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border-b border-ink/20 px-3 py-2 text-left font-semibold text-ink">Rang</th>
                    <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Nom</th>
                    <th className="hidden border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink sm:table-cell">Ville</th>
                  </tr>
                </thead>
                <tbody>
                  {attente.map((i, idx) => (
                    <tr key={i.inscriptionId}
                      className={`cursor-pointer transition-colors hover:bg-orange-50 ${idx % 2 === 0 ? 'bg-paper' : 'bg-muted/30'}`}
                      onClick={() => setSelectedInscrit(i)}>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full border-2 border-orange-400 bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                          {i.rang}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-ink">
                        <div className="flex flex-wrap items-center gap-2">{i.prenom} {i.nom} <NiveauBadge inscrit={i} /></div>
                      </td>
                      <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{i.ville}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Profil side panel */}
      <Sheet open={!!selectedInscrit} onOpenChange={(v) => !v && setSelectedInscrit(null)}>
        {selectedInscrit && <ProfilSheet inscrit={selectedInscrit} onClose={() => setSelectedInscrit(null)} />}
      </Sheet>
    </div>
  );
}
