import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";

export function CTA() {
  return (
    <section className="px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
      <div className="max-w-xl mx-auto text-center">
        <AnimatedSection>
          <p className="text-display-md font-light text-muted-foreground mb-8">
            El fuego ya está encendido.
          </p>
          <Link
            href="/tienda"
            className="inline-flex items-center px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Ver productos
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}
