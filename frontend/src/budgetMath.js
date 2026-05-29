export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function computeTotals(lines, ivaRatePercent, profitRatePercent = 0) {
  const ivaRate = (Number(ivaRatePercent) || 0) / 100;
  const profitRate = (Number(profitRatePercent) || 0) / 100;
  let subtotal = 0;
  const mapped = (lines || []).map((line) => {
    const q = Number(line.quantity) || 0;
    const p = Number(line.unit_price) || 0;
    const lt = q * p;
    subtotal += lt;
    return { ...line, line_subtotal: round2(lt) };
  });
  const ivaAmount = subtotal * ivaRate;
  const profitAmount = subtotal * profitRate;
  const total = subtotal + ivaAmount + profitAmount;
  return {
    lines: mapped,
    subtotal: round2(subtotal),
    iva_rate: round2(Number(ivaRatePercent) || 0),
    profit_rate: round2(Number(profitRatePercent) || 0),
    iva_amount: round2(ivaAmount),
    profit_amount: round2(profitAmount),
    total: round2(total),
  };
}
