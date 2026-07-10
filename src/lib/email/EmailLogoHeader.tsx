import { Section, Img } from "@react-email/components";

/**
 * Header con el logo de Un Fuego para los emails. El logo va adjunto inline por CID
 * (`cid:unfuego-logo`); cada `resend.emails.send` que use este header debe incluir el
 * attachment del logo (ver `LOGO_ATTACHMENT` en `send.ts`).
 */
export function EmailLogoHeader() {
  return (
    <Section style={header}>
      <Img
        src="cid:unfuego-logo"
        alt="Un Fuego"
        width="180"
        style={logo}
      />
    </Section>
  );
}

const header = { textAlign: "center" as const, marginBottom: "32px" };
const logo = { margin: "0 auto", display: "block" };
