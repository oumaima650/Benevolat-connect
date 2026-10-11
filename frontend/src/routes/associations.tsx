import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPin, Search, X, Phone, Building2, LayoutGrid, Map } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { missionPresentation } from "@/components/site/mission-presentation";
import associationApi, { type AssociationBackend } from "@/services/associationApi";
import { Skeleton } from "@/components/ui/skeleton";

const AssociationMap = lazy(() =>
  import("@/components/site/AssociationMap").then((m) => ({ default: m.AssociationMap }))
);

export const Route = createFileRoute("/associations")({
  head: () => ({
    meta: [
      { title: "Associations — CountMeIn" },
      { name: "description", content: "Découvrez toutes les associations partenaires de CountMeIn au Maroc." },
    ],
  }),
  component: AssociationsPage,
});

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

/* ── Carte association ── */
function CarteAssociation({ association }: { association: AssociationBackend }) {
  const nom       = association.nom || "";
  const domaine   = association.domaine || "Solidarité";
  const ville     = association.ville || "";
  const desc      = association.description || "";
  const contact   = association.contact || "";
  const photo     = isValidUrl(association.photoProfil) ? association.photoProfil : null;
  const initiales = nom
    ? nom.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "A";

  const { Icon, color, background } = missionPresentation(domaine);

  return (
    <article className="group mission-card flex h-full flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-ink)]">

      {/* Bandeau domaine */}
      <div className={`flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-3 ${background} ${color}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-wide truncate">{domaine}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 gap-3">

        {/* Avatar + nom + ville */}
        <div className="flex items-center gap-3">
          {photo ? (
            <img src={photo} alt={nom}
              className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover shadow-[2px_2px_0_var(--color-ink)]" />
          ) : (
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-ink bg-ink font-display text-lg font-black text-paper shadow-[2px_2px_0_var(--color-ink)]"
              aria-hidden="true"
            >
              {initiales}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-black text-base text-ink leading-tight" title={nom}>
              {nom}
            </h3>
            {ville && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{ville}</span>
              </p>
            )}
          </div>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-border" />

        {/* Description */}
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground flex-1 min-h-[4rem]">
          {desc || <span className="italic text-muted-foreground/60">Aucune description renseignée.</span>}
        </p>

        {/* Contact */}
        {contact && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground truncate">{contact}</span>
          </div>
        )}

        {/* CTA */}
        <Link
          to="/missions"
          className="mt-auto flex items-center justify-between rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard transition-colors group-hover:bg-mustard"
        >
          Voir ses missions
          <ArrowUpRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </article>
  );
}

/* ── Chip filtre domaine ── */
function DomainChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const { Icon, background, color } = missionPresentation(label);
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all
        ${active
          ? `border-ink ${background} ${color} shadow-[2px_2px_0_var(--color-ink)]`
          : "border-border bg-paper text-muted-foreground hover:border-ink hover:text-ink"
        }`}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label}
    </button>
  );
}

/* ── Page ── */
function AssociationsPage() {
  const [all, setAll]         = useState<AssociationBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [domaine, setDomaine] = useState("");
  const [vue, setVue]         = useState<"liste" | "carte">("liste");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    associationApi.getFeaturedAssociations()
      .then(setAll)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const domaines = Array.from(new Set(all.map((a) => a.domaine).filter(Boolean))).sort();

  const filtered = all.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch  = !q
      || a.nom.toLowerCase().includes(q)
      || (a.ville || "").toLowerCase().includes(q)
      || (a.description || "").toLowerCase().includes(q);
    const matchDomaine = !domaine || a.domaine === domaine;
    return matchSearch && matchDomaine;
  });

  const hasFilters = !!search || !!domaine;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="border-b-4 border-ink bg-ink">
          <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-paper/20 bg-paper/10 px-3 py-1.5 text-xs font-semibold text-paper/80 hover:bg-paper/20 transition-colors mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'accueil
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-mustard mb-2">
                  Annuaire
                </p>
                <h1 className="font-display text-4xl font-black text-paper sm:text-5xl lg:text-6xl">
                  Nos associations
                </h1>
                <p className="mt-3 text-base text-paper/60 max-w-lg">
                  {loading
                    ? "Chargement des associations…"
                    : `${all.length} association${all.length > 1 ? "s" : ""} partenaire${all.length > 1 ? "s" : ""} engagée${all.length > 1 ? "s" : ""} au Maroc`
                  }
                </p>
              </div>
              {/* Stats rapides */}
              {!loading && all.length > 0 && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="font-display text-3xl font-black text-mustard">{all.length}</p>
                    <p className="text-xs text-paper/50">Associations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-black text-mustard">{domaines.length}</p>
                    <p className="text-xs text-paper/50">Domaines</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-black text-mustard">
                      {Array.from(new Set(all.map(a => a.ville).filter(Boolean))).length}
                    </p>
                    <p className="text-xs text-paper/50">Villes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Barre de recherche + filtres ── */}
        <section className="border-b-2 border-ink bg-paper sticky top-0 z-20 shadow-[0_2px_0_var(--color-border)]">
          <div className="mx-auto max-w-6xl px-5 py-4">
            {/* Ligne 1 : recherche + toggle vue + compteur */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, ville, description…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border-2 border-ink bg-muted pl-10 pr-10 py-2.5 text-sm font-medium outline-none transition-shadow focus:shadow-[3px_3px_0_var(--color-ink)] placeholder:text-muted-foreground/60"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-ink transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Toggle liste / carte */}
              <div className="flex rounded-xl border-2 border-ink overflow-hidden shadow-[2px_2px_0_var(--color-ink)]">
                <button
                  onClick={() => setVue("liste")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
                    vue === "liste" ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-muted"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Liste
                </button>
                <button
                  onClick={() => setVue("carte")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-l-2 border-ink transition-colors ${
                    vue === "carte" ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-muted"
                  }`}
                >
                  <Map className="h-3.5 w-3.5" /> Carte
                </button>
              </div>

              <span className="shrink-0 rounded-full border-2 border-ink bg-muted px-3 py-1.5 text-xs font-bold text-ink">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </span>

              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setDomaine(""); }}
                  className="shrink-0 text-xs font-bold text-muted-foreground underline underline-offset-2 hover:text-ink"
                >
                  Tout effacer
                </button>
              )}
            </div>

            {/* Ligne 2 : chips domaine */}
            {domaines.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setDomaine("")}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all
                    ${!domaine
                      ? "border-ink bg-ink text-paper shadow-[2px_2px_0_var(--color-ink)]"
                      : "border-border bg-paper text-muted-foreground hover:border-ink hover:text-ink"
                    }`}
                >
                  <Building2 className="h-3 w-3" /> Tous
                </button>
                {domaines.map((d) => (
                  <DomainChip
                    key={d}
                    label={d}
                    active={domaine === d}
                    onClick={() => setDomaine(domaine === d ? "" : d)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Contenu : liste ou carte ── */}
        {vue === "carte" ? (
          /* ── Vue carte ── */
          <section className="mx-auto max-w-6xl px-5 py-6 lg:py-10">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]" style={{ height: "calc(100vh - 16rem)" }}>
              {/* Carte Leaflet */}
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
                <AssociationMap
                  associations={filtered}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                  className="h-full"
                />
              </Suspense>

              {/* Panneau latéral liste */}
              <div className="flex flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-ink bg-muted p-3 shadow-[4px_4px_0_var(--color-ink)]">
                <p className="text-xs font-bold text-muted-foreground px-1">
                  {filtered.length} association{filtered.length > 1 ? "s" : ""}
                </p>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune association.</p>
                ) : (
                  filtered.map((asso) => {
                    const isActive = asso.id === selectedId;
                    const initiales = asso.nom
                      ? asso.nom.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                      : "A";
                    const photo = isValidUrl(asso.photoProfil) ? asso.photoProfil : null;
                    const { background, color } = missionPresentation(asso.domaine || "");
                    return (
                      <button
                        key={asso.id}
                        onClick={() => setSelectedId(asso.id === selectedId ? null : asso.id)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          isActive
                            ? "border-ink bg-paper shadow-[3px_3px_0_var(--color-ink)]"
                            : "border-border bg-paper hover:border-ink hover:shadow-[2px_2px_0_var(--color-ink)]"
                        }`}
                      >
                        {photo ? (
                          <img src={photo} alt={asso.nom}
                            className="h-10 w-10 shrink-0 rounded-lg border-2 border-ink object-cover" />
                        ) : (
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink text-xs font-black ${background} ${color}`}>
                            {initiales}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink truncate">{asso.nom}</p>
                          {asso.ville && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" /> {asso.ville}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <span className="shrink-0 h-2 w-2 rounded-full bg-mustard border border-ink" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        ) : (
          /* ── Vue liste ── */
          <section className="mx-auto max-w-6xl px-5 py-10 lg:py-14">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl border-2 border-ink bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-display text-2xl font-black text-ink">Aucune association trouvée</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Aucun résultat pour ces critères. Essayez avec d'autres mots-clés ou un autre domaine.
                </p>
                <button
                  onClick={() => { setSearch(""); setDomaine(""); }}
                  className="press rounded-xl border-2 border-ink bg-mustard px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_var(--color-ink)]"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <p className="mb-6 text-sm text-muted-foreground">
                  {hasFilters
                    ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} pour votre recherche`
                    : `Toutes les associations (${all.length})`
                  }
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((asso) => (
                    <CarteAssociation key={asso.id} association={asso} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
