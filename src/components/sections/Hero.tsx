import { Logo } from "@/components/common/Logo";
import { ArrowDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />

      {/* Subtle glow effect behind content */}
      {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-glow-pulse" /> */}

      <div className="relative z-9 text-center max-w-3xl mx-auto">
        {/* Logo */}
        <div className="mb-12 opacity-0 animate-fade-in">
          <Logo size="lg" className="mx-auto" />
        </div>

        {/* Headline */}
        <h1 className="text-display-lg font-light tracking-tight mb-8 animate-ignite animation-delay-200">
          ...se está encendiendo.
        </h1>

        {/* Subheadline */}
        <p className="text-display-md text-muted-foreground font-light opacity-0 animate-fade-in-up animation-delay-600">
          Diseño para cualquier lugar
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-fade-in animation-delay-1000">
        <ArrowDown className="w-5 h-5 text-muted-foreground animate-float" />
      </div>
    </section>
  );
}
