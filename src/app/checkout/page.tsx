import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout | Un Fuego",
  description: "Completá tu pedido",
};

export default function CheckoutPage() {
  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-display-md font-light tracking-tight mb-8 text-center">
          Checkout
        </h1>
        <CheckoutForm />
      </div>
    </div>
  );
}
