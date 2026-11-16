/**
 * Money utilities (INR). Store/compute monetary values as integer paise.
 */
export const PAISE_PER_RUPEE = 100;

export function toPaise(amountRupees: number | string | null | undefined): number {
  const n = typeof amountRupees === 'string' ? Number(amountRupees) : Number(amountRupees || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: number | null | undefined): number {
  const n = Number(paise || 0);
  if (!Number.isFinite(n)) return 0;
  return n / PAISE_PER_RUPEE;
}

export function formatRupeesFromPaise(paise: number | null | undefined): string {
  return paiseToRupees(paise).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function addPaise(...values: Array<number | null | undefined>): number {
  return values.reduce<number>((sum, v) => sum + Math.round(Number(v || 0)), 0);
}

export function subPaise(a: number | null | undefined, b: number | null | undefined): number {
  return Math.round(Number(a || 0)) - Math.round(Number(b || 0));
}

export function percentPaise(amountPaise: number, percent: number): number {
  return Math.round((Math.round(Number(amountPaise || 0)) * Number(percent || 0)) / 100);
}

export function clampNonNegativePaise(paise: number): number {
  return Math.max(0, Math.round(Number(paise || 0)));
}
