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
import { formatCurrency } from "@/lib/utils";
import { EmailLogoHeader } from "../EmailLogoHeader";

interface OrderConfirmationEmailProps {
  order: Order;
}

export function OrderConfirmationEmail({ order }: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <EmailLogoHeader />

          <Section>
            <Text style={heading}>
              Pedido confirmado
            </Text>
            <Text style={text}>
              Hola {order.customer.name}, tu pedido #{order.orderNumber} fue
              confirmado.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Productos</Text>
            {order.items.map((item, i) => (
              <Section key={i} style={itemRow}>
                <Text style={itemText}>
                  {item.name} x{item.quantity} —{" "}
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={summaryText}>
              Subtotal: {formatCurrency(order.subtotal)}
            </Text>
            {order.shippingCost > 0 && (
              <Text style={summaryText}>
                Envío: {formatCurrency(order.shippingCost)}
              </Text>
            )}
            <Text style={totalText}>
              Total: {formatCurrency(order.total)}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={text}>
              Nos pondremos en contacto con vos para coordinar la entrega.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Gracias por elegirnos. Un fuego, en cualquier lugar.
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

const heading = {
  color: "#f5f5f5",
  fontSize: "20px",
  fontWeight: "500",
  marginBottom: "8px",
};

const subheading = {
  color: "#f5f5f5",
  fontSize: "16px",
  fontWeight: "500",
  marginBottom: "8px",
};

const text = {
  color: "#a0a0a0",
  fontSize: "14px",
  lineHeight: "1.6",
};

const itemRow = {
  marginBottom: "4px",
};

const itemText = {
  color: "#d0d0d0",
  fontSize: "14px",
};

const summaryText = {
  color: "#a0a0a0",
  fontSize: "14px",
  margin: "2px 0",
};

const totalText = {
  color: "#f5f5f5",
  fontSize: "16px",
  fontWeight: "600",
  marginTop: "8px",
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
