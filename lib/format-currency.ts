export type FormatCurrencyOptions = {
  currency?: string;
  locale?: string;
};

export function formatCurrency(
  amountInCents: number,
  { currency = "EUR", locale = "es-ES" }: FormatCurrencyOptions = {},
): string {
  if (!Number.isInteger(amountInCents)) {
    throw new RangeError("amountInCents debe ser un entero (los céntimos no se redondean implícitamente)");
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountInCents / 100);
}
