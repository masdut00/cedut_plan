import { DEFAULT_SHEET_ID } from '../data/initialData';
import { loadStoredTransactions, saveStoredTransactions } from './storageService';

const MONTH_NAMES_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Safely parses string or numeric representation of currency amount into number.
 * Supports Indonesian format ("1.500.000", "Rp 2.500.000"), comma format, or raw numbers.
 *
 * @param {string|number} val
 * @returns {number}
 */
export function parseNominal(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;

  let str = String(val).replace(/Rp\s*/gi, '').trim();
  if (str.includes('.') && str.includes(',')) {
    // Indonesian decimal style: 1.500.000,50
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.')) {
    // Thousand separator: multiple dots or dot followed by 3 digits
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
 * Formats a raw cell date (GViz Date() wrapper, ISO string, or DD/MM/YYYY) into YYYY-MM-DD.
 *
 * @param {*} rawVal
 * @param {string} [formattedVal]
 * @returns {string} Date string in YYYY-MM-DD format
 */
function parseCellDate(rawVal, formattedVal) {
  const valStr = String(rawVal ?? formattedVal ?? '').trim();
  if (!valStr) return '';

  // GViz Date format: Date(2026, 1, 15) -> Note month is 0-indexed in GViz
  const gvizDateMatch = valStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)/i);
  if (gvizDateMatch) {
    const year = gvizDateMatch[1];
    const month = String(parseInt(gvizDateMatch[2], 10) + 1).padStart(2, '0');
    const day = String(parseInt(gvizDateMatch[3], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD ISO format
  const isoMatch = valStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = valStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  return valStr;
}

/**
 * Derives month name in Indonesian (e.g. "Februari 2026") from YYYY-MM-DD string.
 *
 * @param {string} dateString
 * @returns {string}
 */
export function deriveMonthName(dateString) {
  if (!dateString) return '';
  const match = dateString.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const monthIndex = parseInt(match[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES_INDONESIA[monthIndex]} ${year}`;
    }
  }
  return '';
}

/**
 * Extracts JSON payload from Google Visualization API response string.
 *
 * @param {string} responseText
 * @returns {Object|null}
 */
function extractGVizJSON(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return null;
  }

  let jsonStr = '';
  const setResponseIdx = responseText.indexOf('setResponse(');
  if (setResponseIdx !== -1) {
    const after = responseText.substring(setResponseIdx + 'setResponse('.length);
    const lastParen = after.lastIndexOf(')');
    if (lastParen !== -1) {
      jsonStr = after.substring(0, lastParen).trim();
    }
  }

  if (!jsonStr) {
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = responseText.substring(firstBrace, lastBrace + 1);
    }
  }

  if (!jsonStr) return null;

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

/**
 * Resolves column index mappings based on table columns or first data row.
 *
 * @param {Array} cols - GViz cols array
 * @param {Array} rows - GViz rows array
 * @returns {{ colMap: Object, dataRows: Array }}
 */
function resolveColumnMapping(cols = [], rows = []) {
  const HEADER_PATTERNS = {
    id: /^(id|tx_id|transaksi_id|no)$/i,
    tanggal: /^(tanggal|date|tgl|waktu)$/i,
    bulan: /^(bulan|month|periode)$/i,
    penabung: /^(penabung|saver|nama|oleh|contributor)$/i,
    tipe: /^(tipe|type|jenis)$/i,
    kategori: /^(kategori|category|keperluan)$/i,
    nominal: /^(nominal|amount|jumlah|nilai|total)$/i,
    catatan: /^(catatan|note|notes|keterangan|deskripsi)$/i
  };

  const colMap = {};

  // 1. Try matching from cols labels
  if (Array.isArray(cols)) {
    cols.forEach((col, idx) => {
      const label = String(col?.label || '').trim();
      if (!label) return;

      for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
        if (pattern.test(label) && colMap[key] === undefined) {
          colMap[key] = idx;
        }
      }
    });
  }

  // If critical fields found from cols
  if (colMap.tanggal !== undefined || colMap.nominal !== undefined) {
    return { colMap, dataRows: rows };
  }

  // 2. Check if rows[0] contains header strings
  if (Array.isArray(rows) && rows.length > 0 && rows[0]?.c) {
    const firstRowCells = rows[0].c;
    let matchesFound = 0;
    const row0Map = {};

    firstRowCells.forEach((cell, idx) => {
      const cellText = String(cell?.v ?? cell?.f ?? '').trim();
      if (!cellText) return;

      for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
        if (pattern.test(cellText) && row0Map[key] === undefined) {
          row0Map[key] = idx;
          matchesFound++;
        }
      }
    });

    if (matchesFound >= 2) {
      return { colMap: row0Map, dataRows: rows.slice(1) };
    }
  }

  // 3. Fallback to default positional column indices
  const colsCount = Array.isArray(cols) && cols.length ? cols.length : 8;
  if (colsCount >= 8) {
    return {
      colMap: {
        id: 0,
        tanggal: 1,
        bulan: 2,
        penabung: 3,
        tipe: 4,
        kategori: 5,
        nominal: 6,
        catatan: 7
      },
      dataRows: rows
    };
  }

  return {
    colMap: {
      tanggal: 0,
      bulan: 1,
      penabung: 2,
      tipe: 3,
      kategori: 4,
      nominal: 5,
      catatan: 6
    },
    dataRows: rows
  };
}

/**
 * Parses Google Visualization (GViz) API query response into structured Transaction objects.
 *
 * @param {string} responseText - Raw response text from GViz endpoint
 * @returns {Array<Object>} List of parsed transaction objects
 */
export function parseGVizResponse(responseText) {
  const data = extractGVizJSON(responseText);
  if (!data || data.status === 'error' || !data.table || !Array.isArray(data.table.rows)) {
    return [];
  }

  const { cols, rows } = data.table;
  const { colMap, dataRows } = resolveColumnMapping(cols, rows);

  const transactions = [];

  dataRows.forEach((row, rowIndex) => {
    if (!row || !Array.isArray(row.c)) return;

    const getVal = (colIndex) => {
      if (colIndex === undefined || !row.c[colIndex]) return '';
      const cell = row.c[colIndex];
      return cell.v !== undefined && cell.v !== null ? cell.v : cell.f ?? '';
    };

    const rawTanggal = colMap.tanggal !== undefined ? getVal(colMap.tanggal) : '';
    const rawNominal = colMap.nominal !== undefined ? getVal(colMap.nominal) : 0;
    const rawPenabung = colMap.penabung !== undefined ? String(getVal(colMap.penabung)).trim() : '';

    const nominal = parseNominal(rawNominal);
    const tanggal = parseCellDate(rawTanggal);

    // Skip blank rows where essential data is missing
    if (!tanggal && !rawPenabung && nominal === 0) {
      return;
    }

    let bulan = colMap.bulan !== undefined ? String(getVal(colMap.bulan)).trim() : '';
    if (!bulan && tanggal) {
      bulan = deriveMonthName(tanggal);
    }

    let penabung = rawPenabung || 'Mas';
    // Normalize contributor name
    if (/cece/i.test(penabung)) {
      penabung = 'Cece';
    } else if (/bersama/i.test(penabung)) {
      penabung = 'Bersama';
    } else if (/mas/i.test(penabung)) {
      penabung = 'Mas';
    }

    const rawTipe = colMap.tipe !== undefined ? String(getVal(colMap.tipe)).trim() : '';
    const tipe = /pengeluaran|keluar|expense/i.test(rawTipe) ? 'Pengeluaran' : 'Setoran';

    const kategori = colMap.kategori !== undefined
      ? String(getVal(colMap.kategori)).trim() || 'Tabungan Rutin'
      : 'Tabungan Rutin';

    const catatan = colMap.catatan !== undefined ? String(getVal(colMap.catatan)).trim() : '';
    const id = colMap.id !== undefined && getVal(colMap.id)
      ? String(getVal(colMap.id)).trim()
      : `TX-${rowIndex + 1}`;

    transactions.push({
      id,
      tanggal,
      bulan,
      penabung,
      tipe,
      kategori,
      nominal,
      catatan
    });
  });

  return transactions;
}

/**
 * Fetches transactions from a public Google Sheet using Google Visualization API.
 * Includes automatic caching to localStorage and offline fallback.
 *
 * @param {string} [sheetId=DEFAULT_SHEET_ID] - Google Spreadsheet ID
 * @param {string} [gid='0'] - Sheet tab GID
 * @param {Object} [options={}] - Options (e.g. { fallbackToStorage: true })
 * @returns {Promise<Array<Object>>}
 */
export async function fetchSheetTransactions(sheetId = DEFAULT_SHEET_ID, gid = '0', options = {}) {
  const { fallbackToStorage = true } = options;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed with status ${response.status} (${response.statusText})`);
    }

    const text = await response.text();
    const transactions = parseGVizResponse(text);

    if (transactions && transactions.length > 0) {
      saveStoredTransactions(transactions);
      return transactions;
    }

    // If sheet returns no transactions, check if stored cache has records
    if (fallbackToStorage) {
      const stored = loadStoredTransactions();
      if (stored && stored.length > 0) {
        return stored;
      }
    }

    return transactions;
  } catch (error) {
    if (fallbackToStorage) {
      console.warn('Google Sheets fetch failed, falling back to local storage cache:', error);
      return loadStoredTransactions();
    }
    throw error;
  }
}
