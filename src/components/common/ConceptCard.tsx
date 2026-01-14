import { cn } from "@/lib/utils";

interface ConceptCardProps {
  title: string;
  className?: string;
}

export function ConceptCard({ title, className }: ConceptCardProps) {
  return (
    <div
      className={cn(
        "group p-8 border border-border/50 rounded-lg",
        "bg-gradient-to-b from-muted/30 to-transparent",
        "hover:border-primary/30 hover:bg-muted/40",
        "transition-all duration-500 ease-out",
        className
      )}
    >
      <h3 className="text-lg font-light text-foreground/90 group-hover:text-foreground transition-colors duration-300">
        {title}
      </h3>
    </div>
  );
}
