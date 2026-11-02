import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  ArrowUpRight, Building2, CalendarDays, Camera, ImageOff, Loader2, Lock, MapPin, Sparkles, Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/common/ImageUpload';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formaterDate, type MissionStatut } from '@/components/dashboard/data';
import { useAuth } from '@/context/AuthContext';
import { inscriptionApi, type ApercuInscription, type PhotoMission } from '@/services/missionApi';

/**
 * Aperçu d'une mission depuis « Mes inscriptions » : infos, photos publiées par l'association
 * et photos de participation du bénévole (ajout possible une fois le certificat reçu).
 */
export function ApercuMissionDialog({ inscriptionId, onClose }: { inscriptionId: string | null; onClose: () => void }) {
  const { token } = useAuth();
  const [apercu, setApercu] = useState<ApercuInscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [agrandie, setAgrandie] = useState<PhotoMission | null>(null);

  useEffect(() => {
    if (!inscriptionId || !token) return;
    setApercu(null);
    setLoading(true);
    inscriptionApi.getApercu(token, inscriptionId)
      .then(setApercu)
      .catch((e: Error) => { toast.error(e.message); onClose(); })
      .finally(() => setLoading(false));
  }, [inscriptionId, token]);

  return (
    <>
      <Dialog open={!!inscriptionId} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-3xl">
          {loading || !apercu ? (
            <>
              <DialogTitle className="sr-only">Chargement de la mission</DialogTitle>
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </>
          ) : (
            <ContenuApercu
              apercu={apercu}
              onAgrandir={setAgrandie}
              onPhotosChange={(mesPhotos) => setApercu({ ...apercu, mesPhotos })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Photo en grand */}
      <Dialog open={!!agrandie} onOpenChange={(v) => !v && setAgrandie(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper p-3 shadow-[6px_6px_0_var(--color-ink)] sm:max-w-4xl">
          <DialogTitle className="sr-only">{agrandie?.titre || 'Photo'}</DialogTitle>
          {agrandie && (
            <figure>
              <img src={agrandie.url} alt={agrandie.titre ?? ''} className="max-h-[75vh] w-full rounded-xl object-contain" />
              {(agrandie.titre || agrandie.description) && (
                <figcaption className="mt-2 px-1 text-sm text-ink">
                  {agrandie.titre && <span className="font-bold">{agrandie.titre}</span>}
                  {agrandie.titre && agrandie.description && ' — '}
                  {agrandie.description && <span className="text-muted-foreground">{agrandie.description}</span>}
                </figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContenuApercu({ apercu, onAgrandir, onPhotosChange }: {
  apercu: ApercuInscription;
  onAgrandir: (p: PhotoMission) => void;
  onPhotosChange: (photos: PhotoMission[]) => void;
}) {
  const lieu = apercu.adresse || apercu.ville;
  return (
    <div className="space-y-6">
      <DialogHeader className="space-y-2 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge statut={apercu.statut as MissionStatut} />
          {apercu.domaine && (
            <span className="rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
              {apercu.domaine}
            </span>
          )}
        </div>
        <DialogTitle className="font-display text-2xl font-black text-ink">{apercu.titre}</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {apercu.associationNom && (
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {apercu.associationId ? (
                  <Link
                    to="/associations/$id"
                    params={{ id: String(apercu.associationId) }}
                    className="font-semibold text-ink underline underline-offset-2 hover:text-pink"
                  >
                    {apercu.associationNom}
                  </Link>
                ) : apercu.associationNom}
              </p>
            )}
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              {formaterDate(apercu.dateDebut)}
              {apercu.dateFin && apercu.dateFin !== apercu.dateDebut && <> → {formaterDate(apercu.dateFin)}</>}
            </p>
            {lieu && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {lieu}
              </p>
            )}
          </div>
        </DialogDescription>
      </DialogHeader>

      {apercu.description && (
        <p className="whitespace-pre-line border-t border-ink/10 pt-4 text-sm leading-relaxed text-ink">
          {apercu.description}
        </p>
      )}

      {apercu.competences.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {apercu.competences.map((c) => (
            <span key={c} className="rounded-full border border-ink/20 bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Photos publiées par l'association */}
      <section className="space-y-3 border-t-2 border-ink pt-4">
        <h3 className="font-display text-lg font-black text-ink">Photos de l'événement</h3>
        {apercu.photosAssociation.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageOff className="h-4 w-4" aria-hidden="true" />
            L'association n'a pas encore publié de photos pour cette mission.
          </p>
        ) : (
          <GaleriePhotos photos={apercu.photosAssociation} onAgrandir={onAgrandir} />
        )}
      </section>

      <MesPhotos apercu={apercu} onAgrandir={onAgrandir} onPhotosChange={onPhotosChange} />

      <Link
        to="/missions/$id"
        params={{ id: String(apercu.missionId) }}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-ink underline underline-offset-4 hover:text-pink"
      >
        Ouvrir la page complète de la mission <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** Photos de participation du bénévole : ajout et suppression réservés aux missions certifiées. */
function MesPhotos({ apercu, onAgrandir, onPhotosChange }: {
  apercu: ApercuInscription;
  onAgrandir: (p: PhotoMission) => void;
  onPhotosChange: (photos: PhotoMission[]) => void;
}) {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [suppression, setSuppression] = useState<number | null>(null);
  // Remonte ImageUpload après un ajout pour vider son aperçu local
  const [cleUpload, setCleUpload] = useState(0);

  async function ajouter() {
    if (!token || !url) return;
    setEnvoi(true);
    try {
      const photo = await inscriptionApi.ajouterPhoto(token, apercu.inscriptionId, url, description);
      onPhotosChange([photo, ...apercu.mesPhotos]);
      setUrl('');
      setDescription('');
      setCleUpload((k) => k + 1);
      toast.success('Photo ajoutée !');
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de l'ajout.");
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(photo: PhotoMission) {
    if (!token) return;
    setSuppression(photo.id);
    try {
      await inscriptionApi.supprimerPhoto(token, apercu.inscriptionId, photo.id);
      onPhotosChange(apercu.mesPhotos.filter((p) => p.id !== photo.id));
      toast.success('Photo supprimée.');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur lors de la suppression.');
    } finally {
      setSuppression(null);
    }
  }

  return (
    <section className="space-y-3 border-t-2 border-ink pt-4">
      <h3 className="font-display text-lg font-black text-ink">Mes photos de participation</h3>

      {!apercu.certifiee ? (
        <p className="flex items-start gap-2 rounded-xl border-2 border-dashed border-ink/30 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Vous pourrez partager vos photos de cette mission une fois votre certificat de participation reçu.
        </p>
      ) : (
        <div className="space-y-3 rounded-xl border-2 border-ink bg-muted/30 p-4">
          <ImageUpload key={cleUpload} id="photo-participation" label="Ajouter une photo" value={url} onChange={setUrl} />
          {url && (
            <>
              <Textarea
                placeholder="Un mot sur ce moment (optionnel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="min-h-[60px] resize-none rounded-xl border-2 border-ink"
              />
              <Button
                onClick={ajouter}
                disabled={envoi}
                className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
              >
                {envoi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Publier la photo
              </Button>
            </>
          )}
        </div>
      )}

      {apercu.mesPhotos.length > 0 && (
        <GaleriePhotos
          photos={apercu.mesPhotos}
          onAgrandir={onAgrandir}
          action={(p) => (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); supprimer(p); }}
              disabled={suppression === p.id}
              className="absolute right-1.5 top-1.5 rounded-lg border-2 border-ink bg-paper p-1 text-red-600 shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-50"
              aria-label="Supprimer la photo"
            >
              {suppression === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        />
      )}
    </section>
  );
}

export function GaleriePhotos({ photos, onAgrandir, action }: {
  photos: PhotoMission[];
  onAgrandir: (p: PhotoMission) => void;
  action?: (p: PhotoMission) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <div key={p.id} className="relative overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[2px_2px_0_var(--color-ink)]">
          <button type="button" onClick={() => onAgrandir(p)} className="block w-full" aria-label={`Agrandir ${p.titre || 'la photo'}`}>
            <img src={p.url} alt={p.titre ?? ''} loading="lazy" className="h-32 w-full object-cover transition-transform hover:scale-105" />
          </button>
          {(p.titre || p.description) && (
            <p className="truncate px-2 py-1 text-xs font-semibold text-ink" title={p.description ?? undefined}>
              {p.titre || p.description}
            </p>
          )}
          {action?.(p)}
        </div>
      ))}
    </div>
  );
}
