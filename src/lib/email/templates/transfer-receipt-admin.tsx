import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
  Button,
} from "@react-email/components";
import type { Order } from "@/lib/types";
import { formatCurrency, formatPhone, isPdfUrl } from "@/lib/utils";

interface TransferReceiptAdminEmailProps {
  order: Order;
}

export function TransferReceiptAdminEmail({ order }: TransferReceiptAdminEmailProps) {
  const receiptUrl = order.bankTransfer?.receiptUrl;
  const isPdf = receiptUrl ? isPdfUrl(receiptUrl) : false;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>
              Comprobante recibido — Pedido #{order.orderNumber}
            </Text>
            <Text style={totalText}>Total: {formatCurrency(order.total)}</Text>
            <Text style={text}>
              El cliente subió el comprobante de transferencia. Revisalo y confirmá el
              pago desde el panel.
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

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Comprobante</Text>
            {!receiptUrl ? (
              <Text style={text}>No se encontró el archivo del comprobante.</Text>
            ) : isPdf ? (
              <Button href={receiptUrl} style={button}>
                Ver comprobante (PDF)
              </Button>
            ) : (
              <>
                <Img src={receiptUrl} alt="Comprobante de transferencia" style={receiptImg} />
                <Text style={smallLink}>
                  <a href={receiptUrl} style={link}>
                    Abrir comprobante en tamaño completo
                  </a>
                </Text>
              </>
            )}
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
const receiptImg = {
  width: "100%",
  maxWidth: "520px",
  borderRadius: "8px",
  border: "1px solid #333",
};
const smallLink = { fontSize: "12px", marginTop: "8px" };
const link = { color: "#f97316", textDecoration: "underline" };
const button = {
  backgroundColor: "#f5f5f5",
  color: "#0a0a0a",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};
