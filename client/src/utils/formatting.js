// client/src/utils/formatting.js

/**
 * Formats a numeric amount as a currency string.
 * Defaults to KES (Kenyan Shilling).
 *
 * @param {number|string|null|undefined} amount - The amount to format.
 * @param {string} currencyCode - The ISO 4217 currency code (e.g., 'KES', 'USD').
 * @returns {string} The formatted currency string, or an empty string/placeholder if amount is invalid.
 */
export const formatCurrency = (amount, currencyCode = 'KES') => {
  const numericAmount = Number(amount);

  if (amount === null || amount === undefined || isNaN(numericAmount)) {
    // Return a non-breaking space or an empty string for invalid inputs to avoid 'NaN' or errors in UI
    // Or, could return a placeholder like '0.00' or 'N/A' depending on desired UX
    return ' '; // Non-breaking space, good for table cells to maintain height
  }

  return new Intl.NumberFormat('en-KE', { // Using 'en-KE' locale for Kenyan Shilling formatting conventions
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// You can add other formatting utilities here in the future.
