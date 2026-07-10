import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Button,
} from "@react-email/components";
import type { Order } from "@/lib/types";
import { EmailLogoHeader } from "../EmailLogoHeader";

interface OrderShippedEmailProps {
  order: Order;
}

export function OrderShippedEmail({ order }: OrderShippedEmailProps) {
  const tracking = order.tracking;
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <EmailLogoHeader />

          <Section>
            <Text style={heading}>¡Tu pedido va en camino!</Text>
            <Text style={text}>
              Hola {order.customer.name}, despachamos tu pedido #{order.orderNumber}.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Seguimiento</Text>
            {tracking?.number && (
              <Text style={text}>Número de guía: {tracking.number}</Text>
            )}
            <Text style={text}>
              Dirección de envío: {order.shipping.address}
            </Text>
          </Section>

          {tracking?.url && (
            <Section style={{ textAlign: "center" as const }}>
              <Button href={tracking.url} style={button}>
                Seguir mi envío
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Gracias por tu compra. Un fuego, en cualquier lugar.
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
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const heading = { color: "#f5f5f5", fontSize: "20px", fontWeight: "500", marginBottom: "8px" };
const subheading = {
  color: "#f5f5f5",
  fontSize: "16px",
  fontWeight: "500",
  marginBottom: "8px",
};
const text = { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.6" };
const hr = { borderColor: "#333", margin: "24px 0" };
const footer = { color: "#666", fontSize: "12px", textAlign: "center" as const };
const button = {
  backgroundColor: "#f5f5f5",
  color: "#0a0a0a",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};
