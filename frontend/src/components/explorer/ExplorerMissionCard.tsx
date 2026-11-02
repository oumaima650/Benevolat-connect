import { Check, Clock, CalendarDays, MapPin, Trophy, Users, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { cn } from '@/lib/utils';
import type { ExplorerMission } from '@/services/explorerApi';

/** Carte et fiche détail d'une mission dans l'espace bénévole (Explorer, Recommandations). */

export function formaterDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MissionCard({
  mission,
  onDetail,
  onInscrire,
  onAnnuler,
  onConfirmerRenfort,
  onVoirCertificat,
}: {
  mission: ExplorerMission;
  onDetail: () => void;
  onInscrire: () => void;
  onAnnuler: () => void;
  onConfirmerRenfort: () => void;
  onVoirCertificat: () => void;
}) {
  const isUrgent = mission.statut === 'RENFORT_URGENT';
  const isSaturee = mission.statut === 'SATUREE';
  const isPubliee = mission.statut === 'PUBLIEE';
  const isTerminee = mission.statut === 'TERMINEE';

  // Badge et bouton selon la situation du bénévole
  let badge: React.ReactNode;
  let bouton: React.ReactNode;
  let message: React.ReactNode = null;

  if (!mission.inscriptionStatut) {
    // Non inscrit
    if (isPubliee) {
      badge = (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-300 px-3 py-1 text-xs font-bold text-green-800">
          <Check className="h-3.5 w-3.5" />
          {mission.placesRestantes} place{mission.placesRestantes > 1 ? 's' : ''} disponible{mission.placesRestantes > 1 ? 's' : ''}
        </span>
      );
      bouton = (
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onInscrire(); }}
          disabled={mission.chevauche}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          {mission.chevauche ? 'Chevauche une de vos missions' : "S'inscrire"}
        </Button>
      );
    } else if (isSaturee) {
      badge = (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-300 px-3 py-1 text-xs font-bold text-orange-800">
          Saturée
        </span>
      );
      bouton = (
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onInscrire(); }}
          disabled={mission.chevauche}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-orange-100 text-orange-800 border-orange-300 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-orange-200"
        >
          {mission.chevauche ? 'Chevauche une de vos missions' : 'Rejoindre la liste d\'attente'}
        </Button>
      );
      message = (
        <p className="text-xs text-muted-foreground mt-2">
          {mission.listeAttenteCount} personne{mission.listeAttenteCount > 1 ? 's' : ''} en liste d'attente. Vous serez en position {mission.listeAttenteCount + 1}.
        </p>
      );
    } else if (isUrgent) {
      badge = (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-bold text-red-800">
          <Zap className="h-3.5 w-3.5" />
          🚨 Renfort urgent
        </span>
      );
      bouton = (
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onInscrire(); }}
          disabled={mission.chevauche}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-red-500 text-white font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-red-600"
        >
          {mission.chevauche ? 'Chevauche une de vos missions' : 'Je viens aider'}
        </Button>
      );
      message = (
        <p className="text-xs text-muted-foreground mt-2">
          {mission.nbRenfortDemande ?? 0} bénévole{(mission.nbRenfortDemande ?? 0) > 1 ? 's' : ''} recherché{(mission.nbRenfortDemande ?? 0) > 1 ? 's' : ''}
        </p>
      );
    }
  } else if (mission.inscriptionStatut === 'CONFIRMEE') {
    // Inscrit confirmé
    badge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-300 px-3 py-1 text-xs font-bold text-green-800">
        <Check className="h-3.5 w-3.5" />
        ✓ Inscrit
      </span>
    );
    if (isUrgent) {
      bouton = null; // Pas d'annulation pour RENFORT_URGENT
    } else {
      bouton = (
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onAnnuler(); }}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-gray-100 text-gray-800 border-gray-300 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-gray-200"
        >
          Annuler mon inscription
        </Button>
      );
    }
  } else if (mission.inscriptionStatut === 'EN_LISTE_ATTENTE') {
    // En liste d'attente
    badge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-300 px-3 py-1 text-xs font-bold text-orange-800">
        <Clock className="h-3.5 w-3.5" />
        En attente, rang {mission.rang}
      </span>
    );
    if (isUrgent) {
      bouton = (
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onConfirmerRenfort(); }}
            className="flex-1 rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
          >
            Confirmer ma venue
          </Button>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAnnuler(); }}
            className="flex-1 rounded-xl border-2 border-ink bg-gray-100 text-gray-800 border-gray-300 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-gray-200"
          >
            Quitter la liste
          </Button>
        </div>
      );
    } else {
      bouton = (
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onAnnuler(); }}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-gray-100 text-gray-800 border-gray-300 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-gray-200"
        >
          Quitter la liste d'attente
        </Button>
      );
      message = (
        <p className="text-xs text-muted-foreground mt-2">
          Vous serez prévenu par e-mail dès qu'une place se libère.
        </p>
      );
    }
  } else if (mission.inscriptionStatut === 'ANNULEE') {
    // Inscription annulée
    badge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs font-bold text-gray-800">
        <X className="h-3.5 w-3.5" />
        Inscription annulée
      </span>
    );
    bouton = (
      <Button
        size="sm"
        onClick={(e) => { e.stopPropagation(); onInscrire(); }}
        disabled={mission.chevauche}
        className="mt-4 w-full rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
      >
        {mission.chevauche ? 'Chevauche une de vos missions' : (isSaturee ? 'Rejoindre la liste d\'attente' : 'Se réinscrire')}
      </Button>
    );
  } else if (isTerminee && mission.inscriptionStatut === 'CONFIRMEE') {
    // Mission terminée avec inscription confirmée
    badge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-300 px-3 py-1 text-xs font-bold text-green-800">
        <Trophy className="h-3.5 w-3.5" />
        Mission terminée
      </span>
    );
    bouton = (
      <Button
        size="sm"
        onClick={(e) => { e.stopPropagation(); onVoirCertificat(); }}
        className="mt-4 w-full rounded-xl border-2 border-ink bg-mustard font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
      >
        Voir mon certificat
      </Button>
    );
  }

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-200 hover:-translate-y-1 cursor-pointer',
        isUrgent && 'border-red-400',
      )}
      onClick={onDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDetail()}
      aria-label={`Voir les détails de ${mission.titre}`}
    >
      {isUrgent && (
        <div className="flex items-center justify-center gap-1.5 bg-red-500 px-4 py-1 text-center text-xs font-bold text-white">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          Renfort urgent
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-muted-foreground">{mission.associationNom}</p>
            <h3 className="mt-1 text-base font-bold leading-tight text-ink">{mission.titre}</h3>
          </div>
          <StatusBadge statut={mission.statut} className="shrink-0" />
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {mission.aDistance ? 'À distance' : (mission.adresse || mission.associationVille)}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formaterDate(mission.dateDebut)}
            {mission.dateDebut !== mission.dateFin && <> → {formaterDate(mission.dateFin)}</>}
          </p>
        </div>

        {mission.domaine && (
          <span className="mt-3 inline-block w-fit rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
            {mission.domaine}
          </span>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs">
          <span
            className={cn(
              'flex items-center gap-1 font-semibold',
              mission.placesRestantes > 0 ? 'text-green-700' : 'text-orange-700',
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {mission.placesRestantes > 0
              ? `${mission.placesRestantes} place${mission.placesRestantes > 1 ? 's' : ''} restante${mission.placesRestantes > 1 ? 's' : ''}`
              : 'Complet'}
            <span className="text-muted-foreground font-normal">/ {mission.nbPlaces}</span>
          </span>
          {mission.listeAttenteCount > 0 && (
            <span className="text-muted-foreground">{mission.listeAttenteCount} en attente</span>
          )}
        </div>

        {badge}
        {bouton}
        {message}
      </div>
    </article>
  );
}

export function MissionDetailDialog({
  detail,
  loading,
  onClose,
}: {
  detail: ExplorerMission | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!detail || loading} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-black text-ink">
                {detail.titre}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge statut={detail.statut} />
                    {detail.domaine && (
                      <span className="rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {detail.domaine}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">{detail.associationNom}</p>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {detail.aDistance ? 'À distance' : (detail.adresse || detail.associationVille)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {formaterDate(detail.dateDebut)} — {formaterDate(detail.dateFin)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {detail.placesRestantes} places restantes / {detail.nbPlaces} total
                    </p>
                    {detail.listeAttenteCount > 0 && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {detail.listeAttenteCount} personne{detail.listeAttenteCount > 1 ? 's' : ''} en liste d'attente
                      </p>
                    )}
                  </div>
                  {detail.description && (
                    <p className="text-sm text-ink border-t border-ink/10 pt-3">
                      {detail.description}
                    </p>
                  )}
                  {detail.competences && detail.competences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-ink/10 pt-3">
                      {detail.competences.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-ink/20"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
