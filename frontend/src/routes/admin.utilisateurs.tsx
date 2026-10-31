import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Ban, Loader2, RotateCcw, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminApi, signalerChangementAdmin, type UtilisateurAdmin } from '@/services/adminApi';

export const Route = createFileRoute('/admin/utilisateurs')({
  component: AdminUtilisateurs,
});

const ROLES = [
  { value: '', label: 'Tous' },
  { value: 'BENEVOLE', label: 'Bénévoles' },
  { value: 'ASSOCIATION', label: 'Associations' },
  { value: 'ADMIN', label: 'Admins' },
] as const;

const ROLE_BADGE: Record<UtilisateurAdmin['role'], { label: string; classe: string }> = {
  BENEVOLE: { label: 'Bénévole', classe: 'bg-emerald/15 text-emerald' },
  ASSOCIATION: { label: 'Association', classe: 'bg-blue-100 text-blue-700' },
  ADMIN: { label: 'Admin', classe: 'bg-mustard text-ink' },
};

const STATUT_BADGE: Record<UtilisateurAdmin['statut'], { label: string; classe: string }> = {
  ACTIF: { label: 'Actif', classe: 'bg-emerald text-emerald-foreground' },
  SUSPENDUE: { label: 'Suspendu', classe: 'bg-red-500 text-white' },
  DESACTIVE: { label: 'Désactivé', classe: 'bg-muted text-ink' },
};

function Avatar({ u }: { u: UtilisateurAdmin }) {
  const lettre = (u.nom || u.email).charAt(0).toUpperCase();
  return u.photoUrl ? (
    <img src={u.photoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full border-2 border-ink object-cover" />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mustard text-sm font-black text-ink">
      {lettre}
    </div>
  );
}

function AdminUtilisateurs() {
  const [users, setUsers] = useState<UtilisateurAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [statut, setStatut] = useState<'' | 'ACTIF' | 'INACTIF'>('');
  const [recherche, setRecherche] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [aSuspendre, setASuspendre] = useState<UtilisateurAdmin | null>(null);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    adminApi.utilisateurs()
      .then(setUsers)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return users
      .filter((u) => !role || u.role === role)
      .filter((u) => !statut || (statut === 'ACTIF' ? u.statut === 'ACTIF' : u.statut !== 'ACTIF'))
      .filter((u) => !q || u.email.toLowerCase().includes(q) || (u.nom ?? '').toLowerCase().includes(q)
        || (u.ville ?? '').toLowerCase().includes(q));
  }, [users, role, statut, recherche]);

  function remplacer(maj: UtilisateurAdmin) {
    setUsers((prev) => prev.map((u) => (u.id === maj.id ? maj : u)));
    signalerChangementAdmin();
  }

  async function confirmerSuspension() {
    if (!aSuspendre) return;
    setBusyId(aSuspendre.id);
    try {
      remplacer(await adminApi.suspendre(aSuspendre.id, motif.trim()));
      toast.success(`Le compte ${aSuspendre.email} est suspendu.`);
      setASuspendre(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reactiver(u: UtilisateurAdmin) {
    setBusyId(u.id);
    try {
      remplacer(await adminApi.reactiver(u.id));
      toast.success(`Le compte ${u.email} est réactivé.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Utilisateurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un compte suspendu ne peut plus se connecter ; son historique est conservé.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border-2 border-ink bg-muted p-1">
          {ROLES.map(({ value, label }) => (
            <button key={value} onClick={() => setRole(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                role === value ? 'bg-emerald font-bold text-emerald-foreground' : 'text-ink/70 hover:text-ink'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <select value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)}
          className="h-10 rounded-xl border-2 border-ink bg-paper px-3 text-sm font-semibold">
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="INACTIF">Suspendus / désactivés</option>
        </select>
        <div className="relative w-full sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, e-mail, ville…"
            className="rounded-xl border-2 border-ink pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald" /></div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-ink">Aucun utilisateur ne correspond.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-emerald text-emerald-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Utilisateur</th>
                <th className="px-4 py-3 text-left font-bold">Rôle</th>
                <th className="px-4 py-3 text-left font-bold">Ville</th>
                <th className="px-4 py-3 text-left font-bold">Inscrit le</th>
                <th className="px-4 py-3 text-left font-bold">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visibles.map((u, idx) => (
                <tr key={u.id} className={`border-t border-ink/10 ${idx % 2 === 0 ? 'bg-paper' : 'bg-muted/50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar u={u} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{u.nom || '—'}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border border-ink/40 px-2 py-0.5 text-xs font-bold ${ROLE_BADGE[u.role].classe}`}>
                      {ROLE_BADGE[u.role].label}
                    </span>
                    {u.statutValidation === 'EN_ATTENTE' && (
                      <span className="ml-1 text-[11px] font-semibold text-mustard-foreground">(non validée)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.ville || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border border-ink px-2 py-0.5 text-xs font-bold ${STATUT_BADGE[u.statut].classe}`}>
                      {STATUT_BADGE[u.statut].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'ADMIN' && (u.statut === 'ACTIF' ? (
                      <Button size="sm" variant="outline" disabled={busyId === u.id}
                        onClick={() => { setASuspendre(u); setMotif(''); }}
                        className="h-8 rounded-lg border-2 border-ink text-red-600 shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-50">
                        <Ban className="mr-1 h-3.5 w-3.5" /> Suspendre
                      </Button>
                    ) : (
                      <Button size="sm" disabled={busyId === u.id} onClick={() => reactiver(u)}
                        className="h-8 rounded-lg border-2 border-ink bg-emerald text-emerald-foreground shadow-[2px_2px_0_var(--color-ink)] hover:bg-emerald/90">
                        {busyId === u.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1 h-3.5 w-3.5" />}
                        Réactiver
                      </Button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{visibles.length} utilisateur(s) affiché(s) sur {users.length}.</p>

      <Dialog open={!!aSuspendre} onOpenChange={(v) => !v && setASuspendre(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">Suspendre {aSuspendre?.nom || aSuspendre?.email}</DialogTitle>
            <DialogDescription>
              L'utilisateur sera déconnecté et ne pourra plus se connecter. Il recevra un e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="motif-suspension" className="text-sm font-bold text-ink">Motif (facultatif, envoyé à l'utilisateur)</Label>
            <Textarea id="motif-suspension" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)}
              className="rounded-xl border-2 border-ink" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setASuspendre(null)} className="flex-1 rounded-xl border-2 border-ink font-bold">
              Annuler
            </Button>
            <Button onClick={confirmerSuspension} disabled={busyId === aSuspendre?.id}
              className="flex-1 rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[3px_3px_0_var(--color-ink)] hover:bg-red-600">
              Suspendre le compte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
