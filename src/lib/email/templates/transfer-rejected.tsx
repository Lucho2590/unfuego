import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import type { Order } from "@/lib/types";
import { EmailLogoHeader } from "../EmailLogoHeader";

interface TransferRejectedEmailProps {
  order: Order;
}

export function TransferRejectedEmail({ order }: TransferRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <EmailLogoHeader />

          <Section>
            <Text style={heading}>No pudimos validar tu transferencia</Text>
            <Text style={text}>
              Hola {order.customer.name}, no pudimos validar el pago de tu pedido #
              {order.orderNumber}. Si creés que es un error o ya transferiste, respondé este
              email y lo revisamos.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>Estamos para ayudarte. Un fuego, en cualquier lugar.</Text>
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
const text = { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.6" };
const hr = { borderColor: "#333", margin: "24px 0" };
const footer = { color: "#666", fontSize: "12px", textAlign: "center" as const };
