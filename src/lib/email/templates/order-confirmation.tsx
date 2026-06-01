import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface OrderConfirmationEmailProps {
  order: Order;
}

export function OrderConfirmationEmail({ order }: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Un Fuego</Text>
          </Section>

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
            <Text style={summaryText}>
              Envío: {formatCurrency(order.shippingCost)}
            </Text>
            <Text style={totalText}>
              Total: {formatCurrency(order.total)}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Dirección de envío</Text>
            <Text style={text}>
              {order.shipping.address}
              <br />
              {order.shipping.city}, {order.shipping.province}
              <br />
              CP: {order.shipping.postalCode}
            </Text>
            {order.shipping.notes && (
              <Text style={text}>Notas: {order.shipping.notes}</Text>
            )}
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
