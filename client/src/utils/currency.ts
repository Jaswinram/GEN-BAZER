/**
 * Currency utility strictly for Indian Rupees (₹ / INR).
 */

export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';

/**
 * Format amount as Indian Rupees (INR)
 * @param amount 
 * @param includeDecimals 
 * @returns e.g. "₹25.00" or "₹1,250"
 */
export function formatINR(amount: number | string | undefined | null, includeDecimals = true): string {
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  const safeAmount = isNaN(numeric) ? 0 : numeric;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(safeAmount);
}

/**
 * Safe subtotal calculation avoiding IEEE-754 precision errors
 */
export function calculateLineTotal(unitPrice: number, quantity: number): number {
  const priceInPaise = Math.round((unitPrice || 0) * 100);
  const qty = Number(quantity) || 0;
  const totalInPaise = Math.round(priceInPaise * qty);
  return totalInPaise / 100;
}

