// Round to 2 decimal places for currency math.
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
