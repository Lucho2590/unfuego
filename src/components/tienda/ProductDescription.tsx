import { Check } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "checks"; items: string[] };

// Una sección agrupa un encabezado con los bloques que lo siguen. La intro son
// los bloques que aparecen antes del primer encabezado.
interface Section {
  heading: string;
  blocks: Block[];
}

function parseDescription(description: string): Block[] {
  const lines = description.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      continue;
    }

    // Encabezado de sección: "## Especificaciones Técnicas"
    if (line.startsWith("##")) {
      flushParagraph();
      blocks.push({ type: "heading", text: line.replace(/^#+\s*/, "") });
      continue;
    }

    // Ítem de lista con viñeta: "• Medidas armadas..."
    if (line.startsWith("•") || line.startsWith("-")) {
      flushParagraph();
      const item = line.replace(/^[•-]\s*/, "");
      const last = blocks[blocks.length - 1];
      if (last && last.type === "bullets") {
        last.items.push(item);
      } else {
        blocks.push({ type: "bullets", items: [item] });
      }
      continue;
    }

    // Ítem destacado con tilde: "✓ Diseño desmontable..."
    if (line.startsWith("✓") || line.startsWith("✔")) {
      flushParagraph();
      const item = line.replace(/^[✓✔]\s*/, "");
      const last = blocks[blocks.length - 1];
      if (last && last.type === "checks") {
        last.items.push(item);
      } else {
        blocks.push({ type: "checks", items: [item] });
      }
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

// Divide los bloques en una intro (antes del primer encabezado) y secciones.
function groupIntoSections(blocks: Block[]): {
  intro: Block[];
  sections: Section[];
} {
  const intro: Block[] = [];
  const sections: Section[] = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      sections.push({ heading: block.text, blocks: [] });
    } else if (sections.length === 0) {
      intro.push(block);
    } else {
      sections[sections.length - 1].blocks.push(block);
    }
  }

  return { intro, sections };
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <h2
          key={index}
          className="text-base font-semibold text-foreground tracking-tight pt-2"
        >
          {block.text}
        </h2>
      );

    case "paragraph":
      return <p key={index}>{block.text}</p>;

    case "bullets":
      return (
        <ul key={index} className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "checks":
      return (
        <ul key={index} className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
  }
}

export function ProductDescription({
  description,
  className,
}: ProductDescriptionProps) {
  const blocks = parseDescription(description);
  if (blocks.length === 0) return null;

  const { intro, sections } = groupIntoSections(blocks);

  return (
    <div className={className}>
      {/* Intro: siempre visible en ambas vistas */}
      {intro.length > 0 && (
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {intro.map((block, i) => renderBlock(block, i))}
        </div>
      )}

      {sections.length > 0 && (
        <>
          {/* Desktop: secciones expandidas en plano */}
          <div className="hidden md:block space-y-4 text-muted-foreground leading-relaxed mt-4">
            {sections.map((section, s) => (
              <div key={s} className="space-y-4">
                <h2 className="text-base font-semibold text-foreground tracking-tight pt-2">
                  {section.heading}
                </h2>
                {section.blocks.map((block, i) => renderBlock(block, i))}
              </div>
            ))}
          </div>

          {/* Mobile: acordeón con la primera sección abierta */}
          <Accordion
            type="multiple"
            defaultValue={["section-0"]}
            className="md:hidden mt-2"
          >
            {sections.map((section, s) => (
              <AccordionItem key={s} value={`section-${s}`}>
                <AccordionTrigger>{section.heading}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {section.blocks.map((block, i) => renderBlock(block, i))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}
    </div>
  );
}
