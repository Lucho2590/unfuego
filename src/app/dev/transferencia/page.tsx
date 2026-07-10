import { notFound } from "next/navigation";
import { TransferPreview } from "./TransferPreview";

// Page de test para simular el flujo de transferencia. Solo en desarrollo.
export const metadata = { robots: { index: false, follow: false } };

export default function DevTransferenciaPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TransferPreview />;
}
