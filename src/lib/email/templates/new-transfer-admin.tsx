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
import { formatCurrency, formatPhone } from "@/lib/utils";

interface NewTransferAdminEmailProps {
  order: Order;
}

export function NewTransferAdminEmail({ order }: NewTransferAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Nuevo pedido por transferencia #{order.orderNumber}</Text>
            <Text style={totalText}>Total: {formatCurrency(order.total)}</Text>
            <Text style={text}>
              El cliente debe transferir y subir el comprobante. Revisalo y confirmá el pago
              desde el panel.
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
              {formatPhone(order.customer.phone)}
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
const totalText = { color: "#f5f5f5", fontSize: "16px", fontWeight: "600", margin: "8px 0" };
const hr = { borderColor: "#333", margin: "24px 0" };
