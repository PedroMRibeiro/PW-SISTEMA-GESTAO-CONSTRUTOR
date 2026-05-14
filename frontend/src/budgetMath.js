export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function computeTotals(lines, ivaRatePercent) {
  const rate = (Number(ivaRatePercent) || 0) / 100;
  let subtotal = 0;
  const mapped = (lines || []).map((line) => {
    const q = Number(line.quantity) || 0;
    const p = Number(line.unit_price) || 0;
    const lt = q * p;
    subtotal += lt;
    return { ...line, line_subtotal: round2(lt) };
  });
  const ivaAmount = subtotal * rate;
  const total = subtotal + ivaAmount;
  return {
    lines: mapped,
    subtotal: round2(subtotal),
    iva_rate: round2(Number(ivaRatePercent) || 0),
    iva_amount: round2(ivaAmount),
    total: round2(total),
  };
}
