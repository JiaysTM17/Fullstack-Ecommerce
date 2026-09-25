const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return currencyFormatter.format(amount);
}
