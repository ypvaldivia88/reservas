import { PaymentMethod } from "@/lib/types";

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  moneda: string;
}[] = [
  { value: "transferencia", label: "Transferencia", moneda: "USD" },
  { value: "efectivo_cup", label: "Efectivo CUP", moneda: "CUP" },
];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "transferencia" || value === "efectivo_cup";
}

export function getPaymentMethodMeta(metodo?: PaymentMethod) {
  return (
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === metodo) ??
    PAYMENT_METHOD_OPTIONS[0]
  );
}

export function getMonedaForPaymentMethod(metodo?: PaymentMethod): string {
  return getPaymentMethodMeta(metodo).moneda;
}

export function formatTransactionAmount(
  monto: number,
  metodo?: PaymentMethod,
  moneda?: string
): string {
  const currency = moneda ?? getMonedaForPaymentMethod(metodo);
  if (currency === "CUP") {
    return `${monto.toFixed(2)} CUP`;
  }
  return `$${monto.toFixed(2)}`;
}
