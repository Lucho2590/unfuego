import type { Metadata } from "next";
import { OrderStatusListener } from "@/components/checkout/OrderStatusListener";

export const metadata: Metadata = {
  title: "Confirmación | Un Fuego",
};

interface Props {
  searchParams: Promise<{
    status?: string;
    external_reference?: string;
    payment_id?: string;
  }>;
}

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { status, external_reference } = await searchParams;

  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <OrderStatusListener orderId={external_reference} initialStatus={status} />
    </div>
  );
}
