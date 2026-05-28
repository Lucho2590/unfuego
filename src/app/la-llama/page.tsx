import type { Metadata } from "next";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "La Llama | Un Fuego",
  description: "La historia detrás de Un Fuego. El fuego que reúne.",
};

export default function LaLlamaPage() {
  return (
    <>
      <div className="pt-24 pb-16">
        {/* Hero */}
        <section className="px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h1 className="text-display-lg font-light tracking-tight mb-6">
                La Llama
              </h1>
              <p className="text-display-md text-muted-foreground font-light">
                La historia de un fuego que se enciende.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* El origen */}
        <section className="px-[var(--section-padding-x)] py-16">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <div className="text-body-lg text-muted-foreground font-light leading-relaxed space-y-6">
                <p>
                  Todo empezó con una idea simple: que el fuego no debería tener
                  un lugar fijo. Que cocinar afuera, compartir, reunirse
                  alrededor de las brasas, debería ser posible en cualquier
                  lugar.
                </p>
                <p>
                  No importa si estás en la playa, en la montaña, en la terraza
                  de tu departamento o en el medio del campo. El fuego es el
                  mismo. Lo que cambia es dónde lo encendés.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Filosofía */}
        <section className="px-[var(--section-padding-x)] py-16 bg-muted/10">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <h2 className="text-display-md font-light tracking-tight mb-8 text-center">
                Lo que nos mueve
              </h2>
              <div className="text-body-lg text-muted-foreground font-light leading-relaxed space-y-6">
                <p>
                  Creemos en los objetos que se usan, no en los que se guardan.
                  En el diseño que resuelve, no en el que decora. En lo que
                  aguanta, no en lo que se rompe.
                </p>
                <p className="text-foreground">
                  Cada producto de Un Fuego está pensado para acompañarte.
                  Simple, resistente, portátil. Sin vueltas.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* El fuego */}
        <section className="px-[var(--section-padding-x)] py-16">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <h2 className="text-display-md font-light tracking-tight mb-8 text-center">
                El fuego
              </h2>
              <div className="text-body-lg text-muted-foreground font-light leading-relaxed space-y-6">
                <p>
                  El fuego es lo más primitivo y lo más actual que tenemos. Es
                  lo que nos juntó desde siempre. Alrededor de un fuego se
                  cocina, se charla, se comparte, se piensa.
                </p>
                <p>
                  Un Fuego nace de eso. De querer llevar ese momento a donde
                  vayas. De hacer que el encuentro sea posible, estés donde
                  estés.
                </p>
                <p className="text-foreground/90 italic text-center text-display-md">
                  Un fuego, en cualquier lugar.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
