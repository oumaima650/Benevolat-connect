import { useEffect, useMemo, useState } from 'react';
import { Mail, Sparkles, Send, Search, Loader2, Users, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { adminApi } from '@/services/adminApi';
import {
  getDestinatairesEmail, redigerEmail, envoyerEmails,
  type DestinataireEmail, type EnvoiResultatEmail,
} from '@/services/associationApi';

type Mode = 'admin' | 'association';
type Cible = 'BENEVOLE' | 'ASSOCIATION';

interface EmailComposerProps {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailComposer({ mode, open, onOpenChange }: EmailComposerProps) {
  const estAdmin = mode === 'admin';

  const [cible, setCible] = useState<Cible>('BENEVOLE');
  const [destinataires, setDestinataires] = useState<DestinataireEmail[]>([]);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [recherche, setRecherche] = useState('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [consigne, setConsigne] = useState('');

  const [chargementListe, setChargementListe] = useState(false);
  const [iaEnCours, setIaEnCours] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [resultat, setResultat] = useState<EnvoiResultatEmail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerDestinataires = (c: Cible) => {
    setChargementListe(true);
    setErreur(null);
    const promesse = estAdmin ? adminApi.destinatairesEmails(c) : getDestinatairesEmail();
    promesse
      .then((liste) => setDestinataires(liste))
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Chargement impossible.'))
      .finally(() => setChargementListe(false));
  };

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (!open) return;
    setCible('BENEVOLE');
    setSelection(new Set());
    setRecherche('');
    setSujet('');
    setMessage('');
    setConsigne('');
    setResultat(null);
    setErreur(null);
    chargerDestinataires('BENEVOLE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const changeCible = (c: Cible) => {
    if (c === cible) return;
    setCible(c);
    setSelection(new Set());
    setResultat(null);
    chargerDestinataires(c);
  };

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return destinataires;
    return destinataires.filter(
      (d) => (d.nom ?? '').toLowerCase().includes(terme) || d.email.toLowerCase().includes(terme),
    );
  }, [destinataires, recherche]);

  const tousSelectionnes = filtres.length > 0 && filtres.every((d) => selection.has(d.id));

  const basculer = (id: number) =>
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const basculerTous = () =>
    setSelection((prev) => {
      const next = new Set(prev);
      if (tousSelectionnes) filtres.forEach((d) => next.delete(d.id));
      else filtres.forEach((d) => next.add(d.id));
      return next;
    });

  const redigerAvecIa = async () => {
    const texte = consigne.trim();
    if (!texte || iaEnCours) return;
    setIaEnCours(true);
    setErreur(null);
    try {
      const res = estAdmin ? await adminApi.redigerEmail(texte) : await redigerEmail(texte);
      if (res.fallback || (!res.sujet && !res.contenu)) {
        setErreur("L'assistant IA est momentanément indisponible. Rédigez l'email manuellement.");
      } else {
        if (res.sujet) setSujet(res.sujet);
        if (res.contenu) setMessage(res.contenu);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'La rédaction IA a échoué.');
    } finally {
      setIaEnCours(false);
    }
  };

  const envoyer = async () => {
    if (envoiEnCours) return;
    if (selection.size === 0) { setErreur('Sélectionnez au moins un destinataire.'); return; }
    if (!sujet.trim()) { setErreur("L'objet est obligatoire."); return; }
    if (!message.trim()) { setErreur('Le message est obligatoire.'); return; }
    setEnvoiEnCours(true);
    setErreur(null);
    setResultat(null);
    try {
      const ids = Array.from(selection);
      const res = estAdmin
        ? await adminApi.envoyerEmails(ids, sujet.trim(), message.trim())
        : await envoyerEmails(ids, sujet.trim(), message.trim());
      setResultat(res);
      if (res.echecs === 0) {
        setSelection(new Set());
        setSujet('');
        setMessage('');
        setConsigne('');
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'envoi a échoué.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-ink bg-paper shadow-[8px_8px_0_var(--color-ink)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-black text-ink">
            <Mail className="h-5 w-5" /> Envoyer un email
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/60">
            {estAdmin
              ? 'Choisissez des bénévoles ou des associations, puis rédigez votre message.'
              : 'Écrivez aux bénévoles inscrits à au moins une de vos missions.'}
          </DialogDescription>
        </DialogHeader>

        {/* Cible (admin uniquement) */}
        {estAdmin && (
          <div className="flex gap-2">
            {(['BENEVOLE', 'ASSOCIATION'] as Cible[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => changeCible(c)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink px-3 py-2 text-sm font-bold shadow-[3px_3px_0_var(--color-ink)] transition-colors',
                  cible === c ? 'bg-mustard text-ink' : 'bg-paper text-ink/60 hover:bg-muted',
                )}
              >
                {c === 'BENEVOLE' ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {c === 'BENEVOLE' ? 'Bénévoles' : 'Associations'}
              </button>
            ))}
          </div>
        )}

        {/* Destinataires */}
        <div className="rounded-xl border-2 border-ink bg-paper shadow-[3px_3px_0_var(--color-ink)]">
          <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-3 py-2">
            <span className="text-xs font-bold text-ink">
              Destinataires{selection.size > 0 && ` · ${selection.size} sélectionné(s)`}
            </span>
            {filtres.length > 0 && (
              <button
                type="button"
                onClick={basculerTous}
                className="text-xs font-bold text-ink underline decoration-2 underline-offset-2 hover:text-pink"
              >
                {tousSelectionnes ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 border-b-2 border-ink px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-ink/50" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un nom ou un email…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5">
            {chargementListe ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
              </div>
            ) : filtres.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/50">
                {destinataires.length === 0 ? 'Aucun destinataire disponible.' : 'Aucun résultat.'}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filtres.map((d) => {
                  const coche = selection.has(d.id);
                  return (
                    <li key={d.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                          coche ? 'bg-mustard/30' : 'hover:bg-muted',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() => basculer(d.id)}
                          className="h-4 w-4 accent-ink"
                        />
                        <span className="font-semibold text-ink">{d.nom ?? '—'}</span>
                        <span className="truncate text-xs text-ink/50">{d.email}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Rédaction assistée par IA */}
        <div className="rounded-xl border-2 border-dashed border-ink bg-mustard/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-ink">
            <Sparkles className="h-4 w-4" /> Rédaction assistée par IA (facultative)
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={consigne}
              onChange={(e) => setConsigne(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); redigerAvecIa(); } }}
              placeholder="Ex. rappeler la mission de samedi et remercier les bénévoles"
              className="flex-1 rounded-lg border-2 border-ink bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={redigerAvecIa}
              disabled={iaEnCours || !consigne.trim()}
              className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-ink bg-ink px-3 py-2 text-sm font-bold text-paper shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-40"
            >
              {iaEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Rédiger
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink/50">
            L'IA remplit l'objet et le message ci-dessous — vous pouvez les modifier avant l'envoi.
          </p>
        </div>

        {/* Objet + message */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-ink">Objet</label>
            <input
              type="text"
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              maxLength={200}
              placeholder="Objet de l'email…"
              className="w-full rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-foreground shadow-[2px_2px_0_var(--color-ink)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ink">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              maxLength={5000}
              placeholder="Rédigez votre message…"
              className="w-full resize-y rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-foreground shadow-[2px_2px_0_var(--color-ink)]"
            />
          </div>
        </div>

        {/* Résultat / erreur */}
        {erreur && (
          <div className="flex items-start gap-2 rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {erreur}
          </div>
        )}
        {resultat && (
          <div className="flex items-start gap-2 rounded-xl border-2 border-green-400 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {resultat.envoyes} email(s) envoyé(s)
              {resultat.echecs > 0 && ` · ${resultat.echecs} échec(s)`}
              {resultat.erreurs.length > 0 && (
                <span className="mt-1 block text-xs font-normal">{resultat.erreurs.join(' · ')}</span>
              )}
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 border-ink bg-paper px-4 py-2 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={envoyer}
            disabled={envoiEnCours}
            className="flex items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-2 text-sm font-bold text-emerald-foreground shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-40"
          >
            {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
