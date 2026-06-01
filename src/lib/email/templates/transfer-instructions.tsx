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
import type { Order, TransferSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface TransferInstructionsEmailProps {
  order: Order;
  settings: Pick<
    TransferSettings,
    "bank" | "titular" | "cbu" | "alias" | "cuit" | "instructions"
  >;
  trackUrl: string;
}

export function TransferInstructionsEmail({
  order,
  settings,
  trackUrl,
}: TransferInstructionsEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Un Fuego</Text>
          </Section>

          <Section>
            <Text style={heading}>Completá tu pago por transferencia</Text>
            <Text style={text}>
              Hola {order.customer.name}, registramos tu pedido #{order.orderNumber}.
              Para confirmarlo, transferí el total y subí el comprobante.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={subheading}>Datos para transferir</Text>
            {settings.bank && <Text style={text}>Banco: {settings.bank}</Text>}
            {settings.titular && <Text style={text}>Titular: {settings.titular}</Text>}
            {settings.cuit && <Text style={text}>CUIT/CUIL: {settings.cuit}</Text>}
            {settings.cbu && <Text style={text}>CBU: {settings.cbu}</Text>}
            {settings.alias && <Text style={text}>Alias: {settings.alias}</Text>}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={summaryText}>
              Subtotal: {formatCurrency(order.subtotal)}
            </Text>
            {!!order.discount && order.discount > 0 && (
              <Text style={summaryText}>
                Descuento: −{formatCurrency(order.discount)}
              </Text>
            )}
            <Text style={summaryText}>
              Envío: {formatCurrency(order.shippingCost)}
            </Text>
            <Text style={totalText}>
              Total a transferir: {formatCurrency(order.total)}
            </Text>
          </Section>

          {settings.instructions && (
            <>
              <Hr style={hr} />
              <Section>
                <Text style={subheading}>Instrucciones</Text>
                <Text style={text}>{settings.instructions}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Section style={{ textAlign: "center" as const }}>
            <Text style={text}>
              Cuando hayas transferido, subí el comprobante desde acá para que confirmemos
              tu compra:
            </Text>
            <Button href={trackUrl} style={button}>
              Subir comprobante y ver el estado
            </Button>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Una vez que recibamos y validemos tu comprobante, te confirmamos el pedido
              por email.
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
const header = { textAlign: "center" as const, marginBottom: "32px" };
const title = {
  color: "#f5f5f5",
  fontSize: "24px",
  fontWeight: "300",
  letterSpacing: "0.05em",
};
const heading = { color: "#f5f5f5", fontSize: "20px", fontWeight: "500", marginBottom: "8px" };
const subheading = {
  color: "#f5f5f5",
  fontSize: "16px",
  fontWeight: "500",
  marginBottom: "8px",
};
const text = { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.6" };
const summaryText = { color: "#a0a0a0", fontSize: "14px", margin: "2px 0" };
const totalText = { color: "#f5f5f5", fontSize: "16px", fontWeight: "600", marginTop: "8px" };
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
