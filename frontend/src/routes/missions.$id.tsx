import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Mail, MapPin, Phone, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MissionMap } from "@/components/site/MissionMap";
import { formaterDate, trouverAssociation, trouverMission } from "@/components/site/data";
import { missionPresentation } from "@/components/site/mission-presentation";
import missionApi from "@/services/missionApi";

export const Route = createFileRoute("/missions/$id")({
  loader: async ({ params }) => {
    try {
      const mission = await missionApi.getMissionById(params.id);
      return { mission, association: trouverAssociation(mission.associationId) };
    } catch {
      const mission = trouverMission(params.id);
      if (!mission) throw notFound();
      return { mission, association: trouverAssociation(mission.associationId) };
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Mission introuvable — CountMeIn" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.mission.titre} — CountMeIn`;
    const d = loaderData.mission.description;
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
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
  const { mission, association } = Route.useLoaderData();
  const complet = mission.placesRestantes === 0;
  const { Icon, background, color, label } = missionPresentation(mission.domaine);
  const pris = mission.placesDemandees - mission.placesRestantes;
  const pct = Math.round((pris / mission.placesDemandees) * 100);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main>
        <section className={`border-b-4 border-ink ${background} ${color}`}>
          <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
            <Link to="/missions" className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"><ArrowLeft className="h-4 w-4" /> Toutes les missions</Link>
            <div className="mt-6 flex items-center gap-3"><Icon className="h-9 w-9" strokeWidth={1.7} /><span className="text-xs font-bold uppercase">{mission.domaine}</span></div>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">{mission.titre}</h1>
            <p className="mt-3 font-medium">{label}</p>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl">La mission</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{mission.description}</p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Info icon={<MapPin className="h-4 w-4" />} titre="Adresse" valeur={mission.adresse} large />
                <Info icon={<CalendarDays className="h-4 w-4" />} titre="Date de début" valeur={formaterDate(mission.date)} />
                <Info icon={<CalendarDays className="h-4 w-4" />} titre="Date de fin" valeur={formaterDate(mission.dateFin)} />
                <Info icon={<Users className="h-4 w-4" />} titre="Places demandées" valeur={`${mission.placesDemandees} bénévoles`} />
                <Info icon={<Clock3 className="h-4 w-4" />} titre="Places restantes" valeur={complet ? `Complet · ${mission.listeAttente} en attente` : `${mission.placesRestantes}`} />
              </dl>
            </section>

            <section>
              <h2 className="text-2xl">Où se déroule la mission</h2>
              <MissionMap missions={[mission]} selectedId={mission.id} zoom={14} className="mt-4 h-[320px]" />
              <a href={`https://www.google.com/maps/search/?api=1&query=${mission.lat},${mission.lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">Itinéraire <ArrowUpRight className="h-4 w-4" /></a>
            </section>

            {association && (
              <section>
                <h2 className="text-2xl">Les éditions précédentes</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {association.galerie.map((img, i) => (
                    <figure key={i} className={`overflow-hidden rounded-lg border-2 border-ink ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                      <img src={img.src} alt={img.legende} width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--color-ink)]">
              <div className="flex items-baseline justify-between text-sm font-bold"><span>{pris} / {mission.placesDemandees} inscrits</span><span>{pct}%</span></div>
              <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-muted"><div className={`h-full ${complet ? "bg-pink" : "bg-emerald"}`} style={{ width: `${pct}%` }} /></div>
              <p className="mt-3 text-xs text-muted-foreground">{complet ? "Rejoins la liste d’attente : tu seras prévenu dès qu’une place se libère." : "Premier arrivé, premier servi."}</p>
              <Button asChild className={`mt-5 h-auto w-full whitespace-normal rounded-lg border-2 border-ink px-4 py-3.5 font-bold ${complet ? "bg-pink text-ink hover:bg-pink" : "bg-emerald text-paper hover:bg-emerald"}`}>
                <Link to="/inscription" search={{ profil: "benevole" }}>{complet ? "Rejoindre la liste d’attente" : "Je m’engage"} <ArrowUpRight /></Link>
              </Button>
            </div>

            {association && (
              <div className="rounded-lg border-2 border-ink bg-muted p-6">
                <p className="text-xs font-bold uppercase text-muted-foreground">Publiée par</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-xl ${background} ${color}`}>{association.initiales}</div>
                  <div><p className="font-display text-lg leading-tight">{association.nom}</p><p className="text-xs text-muted-foreground">{association.domaine}</p></div>
                </div>
                <p className="mt-4 text-sm leading-relaxed">{association.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Building2 className="h-4 w-4" />{association.ville}</li>
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href={`mailto:${association.email}`} className="underline underline-offset-2">{association.email}</a></li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /><a href={`tel:${association.telephone.replace(/\s/g, "")}`}>{association.telephone}</a></li>
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
