/**
 * Currency utility strictly for Indian Rupees (₹ / INR).
 * All financial calculations avoid floating point errors by using rounding or integer paise.
 */

const CURRENCY_CODE = 'INR';
const CURRENCY_SYMBOL = '₹';

/**
 * Format amount as Indian Rupees (INR)
 * @param {number} amount 
 * @param {boolean} includeDecimals 
 * @returns {string} e.g. "₹1,250.00" or "₹1,250"
 */
function formatINR(amount, includeDecimals = true) {
  const safeAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(safeAmount);
}

/**
 * Safely compute line total for products
 * @param {number} unitPrice 
 * @param {number} quantity 
 * @returns {number} rounded to 2 decimal places
 */
function calculateSubtotal(unitPrice, quantity) {
  const priceInPaise = Math.round((Number(unitPrice) || 0) * 100);
  const qty = Number(quantity) || 0;
  const totalInPaise = Math.round(priceInPaise * qty);
  return totalInPaise / 100;
}

module.exports = {
  CURRENCY_CODE,
  CURRENCY_SYMBOL,
  formatINR,
  calculateSubtotal,
};

