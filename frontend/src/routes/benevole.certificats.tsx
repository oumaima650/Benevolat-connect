import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Award, Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formaterDate } from '@/components/dashboard/data';
import { useAuth } from '@/context/AuthContext';
import { inscriptionApi, type BenevoleCertificat } from '@/services/missionApi';

export const Route = createFileRoute('/benevole/certificats')({
  component: MesCertificats,
});

function MesCertificats() {
  const { token } = useAuth();
  const [certificats, setCertificats] = useState<BenevoleCertificat[]>([]);
  const [loading, setLoading] = useState(true);
  // Aperçu PDF : blob généré par le backend (indépendant de Cloudinary)
  const [apercu, setApercu] = useState<{ url: string; cert: BenevoleCertificat } | null>(null);
  const [loadingApercu, setLoadingApercu] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    inscriptionApi.getMesCertificats(token)
      .then(setCertificats)
      .catch(() => toast.error('Erreur lors du chargement des certificats.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function ouvrirApercu(cert: BenevoleCertificat) {
    if (!token) return;
    setLoadingApercu(cert.certificatId);
    try {
      const url = await inscriptionApi.getCertificatApercuUrl(token, cert.certificatId);
      setApercu({ url, cert });
    } catch (err: any) {
      toast.error(err.message ?? "Impossible d'afficher l'aperçu.");
    } finally {
      setLoadingApercu(null);
    }
  }

  function fermerApercu() {
    if (apercu) URL.revokeObjectURL(apercu.url);
    setApercu(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Mes certificats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos attestations de participation, vérifiables par leur code unique.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : certificats.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Aucun certificat"
          description="Vous n'avez pas encore de certificats. Participez à des missions pour en obtenir !"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {certificats.length} certificat{certificats.length > 1 ? 's' : ''} — disponibles dans votre espace et par email.
          </p>
          <div className="overflow-x-auto rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
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
                {certificats.map((c, idx) => (
                  <tr key={c.certificatId} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                    <td className="max-w-[160px] truncate px-4 py-3 font-medium text-ink">
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => ouvrirApercu(c)}
                          disabled={loadingApercu === c.certificatId}
                          className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard/30"
                          aria-label={`Prévisualiser le certificat pour ${c.missionTitre}`}
                        >
                          {loadingApercu === c.certificatId
                            ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            : <Eye className="mr-1 h-3.5 w-3.5" />}
                          Aperçu
                        </Button>
                        {c.urlPdf && (
                          <a href={c.urlPdf} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm"
                              className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard/30"
                              aria-label={`Télécharger le certificat pour ${c.missionTitre}`}>
                              <Download className="mr-1 h-3.5 w-3.5" />PDF
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aperçu du certificat */}
      <Dialog open={!!apercu} onOpenChange={(v) => !v && fermerApercu()}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">
              Certificat — {apercu?.cert.missionTitre}
            </DialogTitle>
          </DialogHeader>
          {apercu && (
            <>
              <iframe src={apercu.url} title="Aperçu du certificat"
                className="h-[70vh] w-full rounded-xl border-2 border-ink bg-white" />
              <a href={apercu.url} download={`certificat-${apercu.cert.codeVerification}.pdf`}
                className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-2 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90">
                <Download className="h-4 w-4" /> Télécharger
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
