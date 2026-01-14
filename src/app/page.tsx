import { Hero } from "@/components/sections/Hero";
import { Essence } from "@/components/sections/Essence";
import { Concept } from "@/components/sections/Concept";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Essence />
      {/* <Concept /> */}
      <CTA />
      <Footer />
    </main>
  );
}
