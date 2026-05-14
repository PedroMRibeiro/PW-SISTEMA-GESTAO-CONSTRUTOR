/** @param {Array<{ quantity: string|number, unit_price: string|number }>} lines */
/** @param {string|number} ivaRatePercent */
export function computeBudgetTotals(lines, ivaRatePercent) {
  const qty = (v) => Number(v) || 0;
  const price = (v) => Number(v) || 0;
  const rate = (Number(ivaRatePercent) || 0) / 100;

  let subtotal = 0;
  const withLineTotals = lines.map((line) => {
    const lineSubtotal = qty(line.quantity) * price(line.unit_price);
    subtotal += lineSubtotal;
    return {
      ...line,
      line_subtotal: round2(lineSubtotal),
    };
  });

  const ivaAmount = subtotal * rate;
  const total = subtotal + ivaAmount;

  return {
    lines: withLineTotals,
    subtotal: round2(subtotal),
    iva_rate: round2(Number(ivaRatePercent) || 0),
    iva_amount: round2(ivaAmount),
    total: round2(total),
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
