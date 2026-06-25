export function formatSAR(n: number) {
  return `${n.toLocaleString("en-US")} SAR`;
}

/** @deprecated Use formatSAR. Kept for screens not yet migrated. */
export const formatYER = formatSAR;

export function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}
