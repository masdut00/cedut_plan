import { DEFAULT_TARGET_AMOUNT, INITIAL_TRANSACTIONS } from '../data/initialData';

export const STORAGE_KEY_TRANSACTIONS = 'wedding_transactions';
export const STORAGE_KEY_TARGET = 'wedding_target_amount';

/**
 * Safely parses string or numeric representation of currency amount into number.
 *
 * @param {string|number} val
 * @returns {number}
 */
function cleanNominal(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;

  let str = String(val).replace(/Rp\s*/gi, '').trim();
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.')) {
    if ((str.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(str)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    if ((str.match(/,/g) || []).length > 1 || /,\d{3}$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Loads stored transactions from localStorage.
 * Falls back to INITIAL_TRANSACTIONS if empty or invalid.
 *
 * @returns {Array} List of transactions
 */
export function loadStoredTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!raw) {
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TRANSACTIONS;
  } catch (err) {
    console.warn('Failed to load transactions from localStorage:', err);
    return INITIAL_TRANSACTIONS;
  }
}

/**
 * Saves transactions to localStorage.
 *
 * @param {Array} transactions - Transactions to persist
 */
export function saveStoredTransactions(transactions) {
  try {
    const data = Array.isArray(transactions) ? transactions : [];
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save transactions to localStorage:', err);
  }
}

/**
 * Loads stored target savings goal from localStorage.
 *
 * @returns {number} Target savings amount in Rupiah
 */
export function loadStoredTarget() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TARGET);
    if (!raw) return DEFAULT_TARGET_AMOUNT;
    const num = Number(raw);
    return !isNaN(num) && num > 0 ? num : DEFAULT_TARGET_AMOUNT;
  } catch (err) {
    console.warn('Failed to load target amount from localStorage:', err);
    return DEFAULT_TARGET_AMOUNT;
  }
}

/**
 * Saves target savings amount to localStorage.
 *
 * @param {number} amount - Target amount in Rupiah
 */
export function saveStoredTarget(amount) {
  try {
    const num = Number(amount) || DEFAULT_TARGET_AMOUNT;
    localStorage.setItem(STORAGE_KEY_TARGET, String(num));
  } catch (err) {
    console.warn('Failed to save target amount to localStorage:', err);
  }
}

/**
 * Exports transaction list as formatted JSON string for backup.
 *
 * @param {Array} transactions
 * @returns {string} Formatted JSON string
 */
export function exportTransactionsJSON(transactions) {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    transactions: Array.isArray(transactions) ? transactions : []
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Imports and validates transactions from a JSON string.
 * Supports both backup object format { transactions: [...] } and direct array [...].
 *
 * @param {string} jsonString
 * @returns {Array} Validated transaction array
 * @throws {Error} If JSON is malformed or invalid
 */
export function importTransactionsJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    throw new Error('Data JSON tidak boleh kosong');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`Format JSON tidak valid: ${err.message}`);
  }

  let list = parsed;
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (Array.isArray(parsed.transactions)) {
      list = parsed.transactions;
    } else {
      throw new Error('Format JSON transaksi tidak valid: tidak ditemukan array transactions');
    }
  }

  if (!Array.isArray(list)) {
    throw new Error('Data transaksi harus berupa array');
  }

  return list.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Data transaksi pada indeks ${index} tidak valid`);
    }

    return {
      id: item.id ? String(item.id) : `TX-IMP-${Date.now()}-${index + 1}`,
      tanggal: item.tanggal ? String(item.tanggal) : new Date().toISOString().split('T')[0],
      bulan: item.bulan ? String(item.bulan) : '',
      penabung: item.penabung ? String(item.penabung) : 'Mas',
      tipe: item.tipe === 'Pengeluaran' ? 'Pengeluaran' : 'Setoran',
      kategori: item.kategori ? String(item.kategori) : 'Tabungan Rutin',
      nominal: cleanNominal(item.nominal),
      catatan: item.catatan ? String(item.catatan) : ''
    };
  });
}
