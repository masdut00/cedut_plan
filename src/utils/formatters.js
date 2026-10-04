const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Formats a number to Indonesian Rupiah currency format (e.g. "Rp 100.000.000").
 * Safely handles null, undefined, strings, and negative values.
 *
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  const num = Number(amount);
  if (isNaN(num)) return 'Rp 0';
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('id-ID');
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Formats a number to abbreviated Indonesian Rupiah (e.g. "Rp 100 Jt", "Rp 2,5 Jt", "Rp 500 Rb").
 *
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatShortRupiah(amount) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 'Rp 0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  let valStr = '';

  if (absNum >= 1_000_000_000) {
    const val = absNum / 1_000_000_000;
    valStr = `${parseFloat(val.toFixed(1)).toString().replace('.', ',')} M`;
  } else if (absNum >= 1_000_000) {
    const val = absNum / 1_000_000;
    valStr = `${parseFloat(val.toFixed(1)).toString().replace('.', ',')} Jt`;
  } else if (absNum >= 1_000) {
    const val = absNum / 1_000;
    valStr = `${parseFloat(val.toFixed(1)).toString().replace('.', ',')} Rb`;
  } else {
    valStr = `${absNum.toLocaleString('id-ID')}`;
  }

  return `${isNegative ? '-Rp ' : 'Rp '}${valStr}`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) or Date object to Indonesian date format (e.g. "5 Okt 2026").
 * Returns '-' for invalid or missing inputs.
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      if (month >= 0 && month < 12 && day > 0 && day <= 31) {
        return `${day} ${MONTH_NAMES_SHORT[month]} ${year}`;
      }
    }
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}
