import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { inscritsMission, type InscritMission } from '@/components/dashboard/data';
import { formaterDate } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/inscrits')({
  component: InscritsMission,
});

const MISSIONS_LIST = [
  { id: 'd1', titre: 'Distribution de repas solidaires' },
  { id: 'd2', titre: "Plantation d'arbres en forêt de Bouhachem" },
  { id: 'd4', titre: "Collecte de vêtements d'hiver" },
];

function NiveauBadge({ niveau }: { niveau: string }) {
  const colors: Record<string, string> = {
    Débutant: 'bg-gray-100 text-gray-700 border-gray-300',
    Engagé: 'bg-mustard/30 text-ink border-mustard',
    Expert: 'bg-blue-100 text-blue-700 border-blue-300',
    Champion: 'bg-green-100 text-green-700 border-green-300',
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[niveau] ?? colors['Débutant']}`}>
      {niveau}
    </span>
  );
}

function BenevoleProfil({ inscrit, onClose }: { inscrit: InscritMission; onClose: () => void }) {
  return (
    <SheetContent className="border-l-2 border-ink overflow-y-auto" aria-label={`Profil de ${inscrit.prenom} ${inscrit.nom}`}>
      <SheetHeader>
        <SheetTitle className="font-display text-xl font-black text-ink">
          {inscrit.prenom} {inscrit.nom}
        </SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-mustard text-xl font-black text-ink">
            {inscrit.prenom[0]}{inscrit.nom[0]}
          </div>
          <div>
            <NiveauBadge niveau={inscrit.niveau} />
            <p className="mt-1 text-sm text-muted-foreground">{inscrit.ville}</p>
          </div>
        </div>

        {/* Compétences */}
        {inscrit.competences.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Compétences</p>
            <div className="flex flex-wrap gap-1.5">
              {inscrit.competences.map((c) => (
                <span key={c} className="rounded-full border border-ink/20 bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {inscrit.badges.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Badges</p>
            <div className="flex flex-wrap gap-1.5">
              {inscrit.badges.map((b) => (
                <span key={b} className="flex items-center gap-1 rounded-full border-2 border-ink bg-paper px-3 py-0.5 text-xs font-semibold text-ink">
                  <Award className="h-3 w-3" aria-hidden="true" /> {b}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border-2 border-ink bg-muted p-3 text-xs text-muted-foreground">
          Inscrit(e) le {formaterDate(inscrit.dateInscription)}
        </div>
      </div>
    </SheetContent>
  );
}

function InscritsMission() {
  const [selectedMission, setSelectedMission] = useState(MISSIONS_LIST[0]?.id ?? '');
  const [selectedInscrit, setSelectedInscrit] = useState<InscritMission | null>(null);

  const confirmes = inscritsMission.filter((i) => i.statut === 'CONFIRMEE');
  const attente = inscritsMission
    .filter((i) => i.statut === 'EN_LISTE_ATTENTE')
    .sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Inscrits & liste d'attente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez les inscrits et la liste d'attente par mission.
        </p>
      </div>

      {/* Mission selector */}
      <Select value={selectedMission} onValueChange={setSelectedMission}>
        <SelectTrigger className="w-full max-w-sm rounded-xl border-2 border-ink">
          <SelectValue placeholder="Choisir une mission" />
        </SelectTrigger>
        <SelectContent>
          {MISSIONS_LIST.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.titre}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Inscrits confirmés */}
        <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
          <div className="border-b-2 border-ink bg-emerald px-4 py-3">
            <h2 className="font-bold text-emerald-foreground">
              Inscrits confirmés ({confirmes.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Nom</th>
                  <th className="hidden border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink sm:table-cell">Ville</th>
                  <th className="hidden border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink md:table-cell">Niveau</th>
                  <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Date</th>
                </tr>
              </thead>
              <tbody>
                {confirmes.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedInscrit(i)}
                    className="cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {i.prenom} {i.nom}
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{i.ville}</td>
                    <td className="hidden px-4 py-2.5 md:table-cell">
                      <NiveauBadge niveau={i.niveau} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {new Date(i.dateInscription).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Liste d'attente */}
        <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
          <div className="border-b-2 border-ink bg-orange-100 px-4 py-3">
            <h2 className="font-bold text-orange-800">
              Liste d'attente ({attente.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Rang</th>
                  <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Nom</th>
                  <th className="hidden border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink sm:table-cell">Ville</th>
                  <th className="border-b border-ink/20 px-4 py-2 text-left font-semibold text-ink">Date</th>
                </tr>
              </thead>
              <tbody>
                {attente.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedInscrit(i)}
                    className="cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className="rounded-full border-2 border-orange-400 bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                        {i.rang}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {i.prenom} {i.nom}
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{i.ville}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {new Date(i.dateInscription).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Profil side panel */}
      <Sheet open={!!selectedInscrit} onOpenChange={(v) => !v && setSelectedInscrit(null)}>
        {selectedInscrit && (
          <BenevoleProfil inscrit={selectedInscrit} onClose={() => setSelectedInscrit(null)} />
        )}
      </Sheet>
    </div>
  );
}
