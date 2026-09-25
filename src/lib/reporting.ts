export function startOfUtcReportingWeek(now = new Date()) {
  const start = new Date(now.getTime());
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function sumRevenueMinor(rows: Array<{ revenue_minor: number | null }> | null | undefined) {
  return rows?.reduce((sum, row) => sum + (row.revenue_minor ?? 0), 0) ?? 0;
}

export function formatMoneyMinor(minor: number, locale = "pt-PT", currency = "EUR") {
  const safeMinor = Number.isSafeInteger(minor) ? minor : 0;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(safeMinor / 100);
  } catch {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(safeMinor / 100);
  }
}
