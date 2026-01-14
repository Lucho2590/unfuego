import { Instagram } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export function Footer() {
  return (
    <footer className="px-[var(--section-padding-x)] py-12 border-t border-border/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center gap-0">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground font-light">
              Un fuego, en cualquier lugar.
            </p>
          </div>

          {/* Instagram */}
          <a
            href="https://instagram.com/unfuegomdq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
            aria-label="Seguir en Instagram"
          >
            <Instagram className="w-5 h-5" />
            <span className="text-sm">@unfuegomdq</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
