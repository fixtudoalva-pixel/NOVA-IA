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
