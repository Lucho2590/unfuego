import { AnimatedSection } from "@/components/common/AnimatedSection";

export function Essence() {
  return (
    <section className="px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
      <div className="max-w-2xl mx-auto text-center">
        <AnimatedSection>
          <div className="text-body-lg text-muted-foreground font-light leading-relaxed space-y-6">
            <p>El fuego reúne.</p>
            <p>
              No importa dónde estés ni hasta dónde vayas.
              <br />
              Mientras haya fuego, hay encuentro.
            </p>
            <p className="text-foreground">
              Creado para acompañarte y compartir.
              <br />
              Objetos simples, resistentes y pensados para moverse.
            </p>
            <p className="text-foreground/90 italic">
              Un fuego, en cualquier lugar.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
