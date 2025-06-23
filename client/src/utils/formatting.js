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

/**
 * Formats a date string or Date object into "DD Mon YYYY" format.
 * e.g., "01 Jan 2023"
 *
 * @param {string|Date|null|undefined} dateInput - The date to format.
 * @returns {string} The formatted date string, or the original input if invalid.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) {
    return ''; // Or handle as per desired UX for null/undefined inputs
  }

  const date = new Date(dateInput);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return String(dateInput); // Return original input if it's not a valid date
  }

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

// You can add other formatting utilities here in the future.
