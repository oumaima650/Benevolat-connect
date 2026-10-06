import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Mail, MapPin, Phone, Users, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/context/AuthContext";
import { MissionMap } from "@/components/site/MissionMap";
import { formaterDate, trouverAssociation, trouverMission } from "@/components/site/data";
import { missionPresentation } from "@/components/site/mission-presentation";
import missionApi, { type MissionDetailBackend } from "@/services/missionApi";

export const Route = createFileRoute("/missions/$id")({
  loader: async ({ params }) => {
    try {
      const detail: MissionDetailBackend = await missionApi.getMissionDetail(params.id);
      return { detail };
    } catch {
      const mission = trouverMission(params.id);
      if (!mission) throw notFound();
      const association = trouverAssociation(mission.associationId);
      return { detail: null, mission, association };
    }
  },
  head: ({ loaderData }) => {
    const title = loaderData?.detail?.titre ?? (loaderData as any)?.mission?.titre ?? "Mission";
    const description = loaderData?.detail?.description ?? (loaderData as any)?.mission?.description ?? "";
    const t = `${title} — CountMeIn`;
    return {
      meta: [
        { title: t }, { name: "description", content: description },
        { property: "og:title", content: t }, { property: "og:description", content: description },
        { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: MissionIntrouvable,
  component: MissionDetail,
});

function MissionIntrouvable() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-4xl">Mission introuvable</h1>
        <Link to="/missions" className="mt-6 inline-block font-semibold underline">Retour aux missions</Link>
      </main>
      <Footer />
    </div>
  );
}

function MissionDetail() {
  const loaderData = Route.useLoaderData();
  const detail = loaderData.detail;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [engaged, setEngaged] = useState(false);

  const missionId = detail?.id ?? (loaderData as any).mission?.id ?? "";

  const handleEngagement = () => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/missions/${missionId}` } });
      return;
    }
    setEngaged(true);
  };

  // Use backend detail if available, otherwise fall back to static data
  const titre = detail?.titre ?? (loaderData as any).mission?.titre ?? "";
  const description = detail?.description ?? (loaderData as any).mission?.description ?? "";
  const domaine = detail?.domaine ?? (loaderData as any).mission?.domaine ?? "";
  const ville = detail?.ville ?? (loaderData as any).mission?.ville ?? "";
  const adresse = detail?.adresse ?? (loaderData as any).mission?.adresse ?? ville;
  const dateDebut = detail?.dateDebut ?? (loaderData as any).mission?.date ?? "";
  const dateFin = detail?.dateFin ?? (loaderData as any).mission?.dateFin ?? "";
  const nbPlaces = detail?.nbPlaces ?? detail?.nbBenevoles ?? (loaderData as any).mission?.placesDemandees ?? 0;
  const placesRestantes = detail?.placesRestantes ?? (loaderData as any).mission?.placesRestantes ?? 0;
  const listeAttente = detail?.listeAttenteCount ?? (loaderData as any).mission?.listeAttente ?? 0;

  // Coordinates for map
  const lat = (loaderData as any).mission?.lat ?? 48.8566;
  const lng = (loaderData as any).mission?.lng ?? 2.3522;

  const complet = placesRestantes === 0;
  const { Icon, background, color } = missionPresentation(domaine);
  const pris = Math.max(0, nbPlaces - placesRestantes);
  const pct = nbPlaces > 0 ? Math.round((pris / nbPlaces) * 100) : 0;

  // Association
  const assoNom = detail?.associationNom ?? (loaderData as any).association?.nom ?? "";
  const assoDescription = detail?.associationDescription ?? (loaderData as any).association?.description ?? "";
  const assoDomaine = detail?.associationDomaine ?? (loaderData as any).association?.domaine ?? "";
  const assoVille = detail?.associationVille ?? (loaderData as any).association?.ville ?? "";
  const assoEmail = detail?.associationEmail ?? (loaderData as any).association?.email ?? "";
  const assoContact = detail?.associationContact ?? (loaderData as any).association?.telephone ?? "";
  const assoPhoto = detail?.associationPhotoProfil;
  const assoInitiales = assoNom ? assoNom.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() : "A";
  const hasAsso = !!assoNom;

  // Previous editions (missions with same name, from backend)
  const editions = detail?.editionsPrecedentes ?? [];

  // Build a mission-like object for the map
  const missionForMap = { id: missionId, titre, adresse, lat, lng } as any;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main>
        <section className={`border-b-4 border-ink ${background} ${color}`}>
          <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
            <Link to="/missions" className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"><ArrowLeft className="h-4 w-4" /> Toutes les missions</Link>
            <div className="mt-6 flex items-center gap-3"><Icon className="h-9 w-9" strokeWidth={1.7} /><span className="text-xs font-bold uppercase">{domaine}</span></div>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">{titre}</h1>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl">La mission</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Info icon={<MapPin className="h-4 w-4" />} titre="Adresse" valeur={adresse} large />
                <Info icon={<CalendarDays className="h-4 w-4" />} titre="Date de début" valeur={formaterDate(dateDebut)} />
                <Info icon={<CalendarDays className="h-4 w-4" />} titre="Date de fin" valeur={formaterDate(dateFin)} />
                <Info icon={<Users className="h-4 w-4" />} titre="Places demandées" valeur={`${nbPlaces} bénévoles`} />
                <Info icon={<Clock3 className="h-4 w-4" />} titre="Places restantes" valeur={complet ? `Complet · ${listeAttente} en attente` : `${placesRestantes}`} />
              </dl>
            </section>

            <section>
              <h2 className="text-2xl">Où se déroule la mission</h2>
              <MissionMap missions={[missionForMap]} selectedId={missionId} zoom={14} className="mt-4 h-[320px]" />
              <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">Itinéraire <ArrowUpRight className="h-4 w-4" /></a>
            </section>

            {editions.length > 0 && (
              <section>
                <h2 className="text-2xl">Les éditions précédentes</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {editions.map((ed: any, i: number) => (
                    <figure key={ed.id} className={`overflow-hidden rounded-lg border-2 border-ink ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                      <img
                        src={ed.imageUrl || "/assets/hero-benevoles.jpg"}
                        alt={`Édition précédente ${ed.dateDebut ? formaterDate(String(ed.dateDebut)) : ""}`}
                        width={1024}
                        height={768}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--color-ink)]">
              <div className="flex items-baseline justify-between text-sm font-bold"><span>{pris} / {nbPlaces} inscrits</span><span>{pct}%</span></div>
              <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-muted"><div className={`h-full ${complet ? "bg-pink" : "bg-emerald"}`} style={{ width: `${pct}%` }} /></div>
              <p className="mt-3 text-xs text-muted-foreground">{complet ? "Rejoins la liste d'attente : tu seras prévenu dès qu'une place se libère." : "Premier arrivé, premier servi."}</p>
              {engaged ? (
                <div className="mt-5 rounded-lg border-2 border-ink bg-emerald/20 p-4 text-center font-bold text-ink">
                  🎉 Inscription confirmée ! Merci pour ton engagement.
                </div>
              ) : (
                <Button
                  onClick={handleEngagement}
                  className={`mt-5 h-auto w-full whitespace-normal rounded-lg border-2 border-ink px-4 py-3.5 font-bold ${complet ? "bg-pink text-ink hover:bg-pink" : "bg-emerald text-paper hover:bg-emerald"}`}
                >
                  {complet ? "Rejoindre la liste d'attente" : "Je m'engage"} <ArrowUpRight className="ml-1 inline h-4 w-4" />
                </Button>
              )}
            </div>

            {hasAsso && (
              <div className="rounded-lg border-2 border-ink bg-muted p-6">
                <p className="text-xs font-bold uppercase text-muted-foreground">Publiée par</p>
                <div className="mt-3 flex items-center gap-4">
                  {assoPhoto ? (
                    <img src={assoPhoto} alt={assoNom} className="h-16 w-16 shrink-0 rounded-full border-2 border-ink object-cover" />
                  ) : (
                    <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-xl ${background} ${color}`}>{assoInitiales}</div>
                  )}
                  <div>
                    <p className="font-display text-lg leading-tight">{assoNom}</p>
                    <p className="text-xs text-muted-foreground">{assoDomaine}</p>
                  </div>
                </div>
                {assoDescription && <p className="mt-4 text-sm leading-relaxed">{assoDescription}</p>}
                <ul className="mt-4 space-y-2 text-sm">
                  {assoVille && <li className="flex items-center gap-2"><Building2 className="h-4 w-4" />{assoVille}</li>}
                  {assoEmail && <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href={`mailto:${assoEmail}`} className="underline underline-offset-2">{assoEmail}</a></li>}
                  {assoContact && <li className="flex items-center gap-2"><Phone className="h-4 w-4" /><a href={`tel:${assoContact.replace(/\s/g, "")}`}>{assoContact}</a></li>}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Info({ icon, titre, valeur, large }: { icon: React.ReactNode; titre: string; valeur: string; large?: boolean }) {
  return (
    <div className={`rounded-lg border-2 border-ink p-4 ${large ? "sm:col-span-2" : ""}`}>
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {titre}</dt>
      <dd className="mt-1 font-semibold">{valeur}</dd>
    </div>
  );
}
