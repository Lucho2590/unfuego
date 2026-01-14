import { AnimatedSection } from "@/components/common/AnimatedSection";
import { ConceptCard } from "@/components/common/ConceptCard";

const concepts = [
  "Diseño honesto",
  "Funcionalidad real",
  "Pensado para usarse, no para quedarse quieto",
];

export function Concept() {
  return (
    <section className="px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {concepts.map((concept, index) => (
            <AnimatedSection
              key={concept}
              delay={index * 150}
              animation="fade-in-up"
            >
              <ConceptCard title={concept} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
