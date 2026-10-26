import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2, Calendar, CheckCircle2, ClipboardList, Loader2, Mail, MapPin, Phone, Search, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  adminApi, signalerChangementAdmin, type AssociationAdmin, type StatutValidation,
} from '@/services/adminApi';

export const Route = createFileRoute('/admin/associations')({
  component: AdminAssociations,
});

const ONGLETS: { value: StatutValidation | 'TOUTES'; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDE', label: 'Validées' },
  { value: 'REFUSE', label: 'Refusées' },
  { value: 'TOUTES', label: 'Toutes' },
];

const BADGE: Record<StatutValidation, string> = {
  EN_ATTENTE: 'bg-mustard text-ink',
  VALIDE: 'bg-emerald text-emerald-foreground',
  REFUSE: 'bg-red-500 text-white',
};
const LIBELLE: Record<StatutValidation, string> = { EN_ATTENTE: 'En attente', VALIDE: 'Validée', REFUSE: 'Refusée' };

function initiales(nom: string) {
  return nom.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function AssociationCard({ a, onValider, onRefuser, busy }: {
  a: AssociationAdmin; onValider: () => void; onRefuser: () => void; busy: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex items-start gap-3">
        {a.logoUrl ? (
          <img src={a.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-emerald font-display text-lg font-black text-emerald-foreground">
            {initiales(a.nom)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-black text-ink">{a.nom}</h3>
            <span className={`rounded-full border border-ink px-2 py-0.5 text-[11px] font-bold ${BADGE[a.statutValidation]}`}>
              {LIBELLE[a.statutValidation]}
            </span>
            {a.statutCompte !== 'ACTIF' && (
              <span className="rounded-full border border-ink bg-muted px-2 py-0.5 text-[11px] font-bold text-ink">
                Compte {a.statutCompte.toLowerCase()}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.ville || 'Ville non renseignée'}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
              Inscrite le {new Date(a.createdAt).toLocaleDateString('fr-FR')}
            </span>
            <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{a.nbMissions} mission(s)</span>
          </div>
        </div>
      </div>

      {a.description && <p className="mt-3 line-clamp-3 text-sm text-ink/80">{a.description}</p>}

      <div className="mt-3 space-y-1 text-sm">
        <p className="flex items-center gap-2 text-ink"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{a.email}</p>
        {a.contact && <p className="flex items-center gap-2 text-ink"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{a.contact}</p>}
      </div>

      {a.domaines.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {a.domaines.map((d) => (
            <span key={d} className="rounded-full border border-emerald/50 bg-emerald/10 px-2 py-0.5 text-xs font-semibold text-emerald">{d}</span>
          ))}
        </div>
      )}

      {a.statutValidation === 'REFUSE' && a.motifRefus && (
        <p className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 p-2.5 text-xs text-red-800">
          <span className="font-bold">Motif du refus :</span> {a.motifRefus}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {a.statutValidation !== 'VALIDE' && (
          <Button onClick={onValider} disabled={busy} size="sm"
            className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[2px_2px_0_var(--color-ink)] hover:bg-emerald/90">
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
            {a.statutValidation === 'REFUSE' ? 'Valider finalement' : 'Valider'}
          </Button>
        )}
        {a.statutValidation !== 'REFUSE' && (
          <Button onClick={onRefuser} disabled={busy} size="sm" variant="outline"
            className="rounded-xl border-2 border-ink font-bold text-red-600 shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-50">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            {a.statutValidation === 'VALIDE' ? 'Retirer la validation' : 'Refuser'}
          </Button>
        )}
      </div>
    </div>
  );
}

function AdminAssociations() {
  const [associations, setAssociations] = useState<AssociationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<StatutValidation | 'TOUTES'>('EN_ATTENTE');
  const [recherche, setRecherche] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [aRefuser, setARefuser] = useState<AssociationAdmin | null>(null);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    adminApi.associations()
      .then((data) => {
        setAssociations(data);
        if (!data.some((a) => a.statutValidation === 'EN_ATTENTE')) setOnglet('TOUTES');
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const compte = (s: StatutValidation | 'TOUTES') =>
    s === 'TOUTES' ? associations.length : associations.filter((a) => a.statutValidation === s).length;

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return associations
      .filter((a) => onglet === 'TOUTES' || a.statutValidation === onglet)
      .filter((a) => !q || a.nom.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
        || (a.ville ?? '').toLowerCase().includes(q));
  }, [associations, onglet, recherche]);

  function remplacer(maj: AssociationAdmin) {
    setAssociations((prev) => prev.map((a) => (a.id === maj.id ? maj : a)));
    signalerChangementAdmin();
  }

  async function valider(a: AssociationAdmin) {
    setBusyId(a.id);
    try {
      remplacer(await adminApi.validerAssociation(a.id));
      toast.success(`« ${a.nom} » est validée et a été prévenue.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmerRefus() {
    if (!aRefuser || !motif.trim()) return;
    setBusyId(aRefuser.id);
    try {
      remplacer(await adminApi.refuserAssociation(aRefuser.id, motif.trim()));
      toast.success(`« ${aRefuser.nom} » a été refusée et a reçu le motif.`);
      setARefuser(null);
      setMotif('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Associations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validez les nouvelles associations : tant qu'elles ne sont pas validées, elles ne peuvent pas publier de mission.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border-2 border-ink bg-muted p-1">
          {ONGLETS.map(({ value, label }) => (
            <button key={value} onClick={() => setOnglet(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                onglet === value ? 'bg-emerald font-bold text-emerald-foreground' : 'text-ink/70 hover:text-ink'
              }`}>
              {label} ({compte(value)})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, e-mail, ville…"
            className="rounded-xl border-2 border-ink pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald" /></div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-ink">
            {onglet === 'EN_ATTENTE' ? 'Aucune association en attente de validation' : 'Aucune association'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibles.map((a) => (
            <AssociationCard key={a.id} a={a} busy={busyId === a.id}
              onValider={() => valider(a)}
              onRefuser={() => { setARefuser(a); setMotif(''); }} />
          ))}
        </div>
      )}

      <Dialog open={!!aRefuser} onOpenChange={(v) => !v && setARefuser(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">
              {aRefuser?.statutValidation === 'VALIDE' ? 'Retirer la validation' : 'Refuser'} « {aRefuser?.nom} »
            </DialogTitle>
            <DialogDescription>
              L'association recevra ce motif par e-mail et ne pourra plus publier de mission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="motif-refus" className="text-sm font-bold text-ink">Motif *</Label>
            <Textarea id="motif-refus" rows={4} value={motif} onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex. : informations incomplètes, justificatif d'existence légale manquant…"
              className="rounded-xl border-2 border-ink" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setARefuser(null)} className="flex-1 rounded-xl border-2 border-ink font-bold">
              Annuler
            </Button>
            <Button onClick={confirmerRefus} disabled={!motif.trim() || busyId === aRefuser?.id}
              className="flex-1 rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[3px_3px_0_var(--color-ink)] hover:bg-red-600">
              Confirmer le refus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
