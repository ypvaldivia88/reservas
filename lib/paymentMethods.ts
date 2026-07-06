import { PaymentMethod } from "@/lib/types";

export const MONEDA = "CUP" as const;

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo_cup", label: "Efectivo" },
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

export function getMonedaForPaymentMethod(_metodo?: PaymentMethod): string {
  return MONEDA;
}

export function formatTransactionAmount(
  monto: number,
  _metodo?: PaymentMethod,
  _moneda?: string
): string {
  return `${monto.toFixed(2)} CUP`;
}
