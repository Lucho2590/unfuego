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

interface NewOrderAdminEmailProps {
  order: Order;
}

export function NewOrderAdminEmail({ order }: NewOrderAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>
              Nuevo pedido #{order.orderNumber}
            </Text>
            <Text style={totalText}>
              Total: ${order.total.toLocaleString("es-AR")}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Cliente</Text>
            <Text style={text}>
              {order.customer.name}
              <br />
              {order.customer.email}
              <br />
              {order.customer.phone}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Productos</Text>
            {order.items.map((item, i) => (
              <Text key={i} style={text}>
                {item.name} x{item.quantity} — $
                {(item.price * item.quantity).toLocaleString("es-AR")}
              </Text>
            ))}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Envío</Text>
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
            <Text style={summaryText}>
              Subtotal: ${order.subtotal.toLocaleString("es-AR")}
            </Text>
            <Text style={summaryText}>
              Envío: ${order.shippingCost.toLocaleString("es-AR")}
            </Text>
            <Text style={totalText}>
              Total: ${order.total.toLocaleString("es-AR")}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
};

const heading = {
  color: "#111",
  fontSize: "20px",
  fontWeight: "600",
};

const subheading = {
  color: "#111",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "4px",
};

const text = {
  color: "#555",
  fontSize: "14px",
  lineHeight: "1.6",
};

const summaryText = {
  color: "#555",
  fontSize: "14px",
  margin: "2px 0",
};

const totalText = {
  color: "#111",
  fontSize: "18px",
  fontWeight: "700",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "20px 0",
};
