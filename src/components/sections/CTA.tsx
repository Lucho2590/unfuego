import { AnimatedSection } from "@/components/common/AnimatedSection";

export function CTA() {
  return (
    <section className="px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
      <div className="max-w-xl mx-auto text-center">
        <AnimatedSection>
          <p className="text-display-md font-light text-muted-foreground">
            Estamos preparando el fuego.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
