import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Button,
} from "@react-email/components";

interface AdminInvitationEmailProps {
  email: string;
  loginUrl: string;
}

export function AdminInvitationEmail({
  email,
  loginUrl,
}: AdminInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Un Fuego</Text>
          </Section>

          <Section>
            <Text style={heading}>Invitación al panel de administración</Text>
            <Text style={text}>
              Hola, fuiste invitado/a a administrar Un Fuego.
            </Text>
            <Text style={text}>
              Te enviamos un email aparte para que configures tu contraseña. Una
              vez que la tengas, podés ingresar al panel de administración desde
              el siguiente enlace:
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={loginUrl}>
              Ir al panel de admin
            </Button>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={text}>
              Tu email de acceso: <strong>{email}</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Si no esperabas esta invitación, podés ignorar este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const title = {
  color: "#f5f5f5",
  fontSize: "24px",
  fontWeight: "300",
  letterSpacing: "0.05em",
};

const heading = {
  color: "#f5f5f5",
  fontSize: "20px",
  fontWeight: "500",
  marginBottom: "8px",
};

const text = {
  color: "#a0a0a0",
  fontSize: "14px",
  lineHeight: "1.6",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#c77b3f",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
};

const hr = {
  borderColor: "#333",
  margin: "24px 0",
};

const footer = {
  color: "#666",
  fontSize: "12px",
  textAlign: "center" as const,
};
