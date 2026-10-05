import { Link } from "@tanstack/react-router";
import { ArrowUpRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-benevoles.jpg";

export function Hero() {
  return (
    <section className="volunteer-hero relative isolate flex items-center overflow-hidden border-b-4 border-ink bg-ink">
      <img src={heroImage} alt="Des bénévoles préparent ensemble des colis solidaires" className="absolute inset-0 h-full w-full object-cover object-[center_42%] grayscale" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
        <div className="max-w-2xl">
          <span className="animate-rise inline-flex items-center gap-2 text-xs font-bold uppercase text-paper"><HeartHandshake className="h-5 w-5 text-mustard" /> Bénévoles & associations · Ensemble, on agit</span>
          <h1 className="animate-rise mt-5 text-5xl leading-[1.04] text-mustard sm:text-6xl lg:text-7xl">CountMeIn<span className="mt-4 block text-4xl leading-[1.1] text-paper sm:text-5xl">Ton temps.<br /><span className="text-pink">Leur sourire.</span><br />Notre impact.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-paper">Une heure de ton temps peut changer leur journée. Trouve une mission près de chez toi et donne vie aux projets des associations.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="press h-auto rounded-lg border-2 border-ink bg-mustard px-5 py-3.5 font-bold text-ink hover:bg-mustard"><Link to="/missions">Je passe à l’action <ArrowUpRight /></Link></Button>
            <Button asChild variant="outline" className="press h-auto rounded-lg border-2 border-paper bg-transparent px-5 py-3.5 font-bold text-paper hover:bg-paper hover:text-ink"><Link to="/inscription" search={{ profil: "association" }}>Mobiliser des bénévoles <ArrowUpRight /></Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
