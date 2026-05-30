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

interface TransferReceiptReceivedEmailProps {
  order: Order;
}

export function TransferReceiptReceivedEmail({ order }: TransferReceiptReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Un Fuego</Text>
          </Section>

          <Section>
            <Text style={heading}>Recibimos tu comprobante</Text>
            <Text style={text}>
              Hola {order.customer.name}, recibimos el comprobante de tu pedido #
              {order.orderNumber}. Lo estamos revisando y te confirmamos por email apenas
              validemos el pago.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>Gracias por tu compra. Un fuego, en cualquier lugar.</Text>
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
const header = { textAlign: "center" as const, marginBottom: "32px" };
const title = {
  color: "#f5f5f5",
  fontSize: "24px",
  fontWeight: "300",
  letterSpacing: "0.05em",
};
const heading = { color: "#f5f5f5", fontSize: "20px", fontWeight: "500", marginBottom: "8px" };
const text = { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.6" };
const hr = { borderColor: "#333", margin: "24px 0" };
const footer = { color: "#666", fontSize: "12px", textAlign: "center" as const };
