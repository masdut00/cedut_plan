import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseGVizResponse,
  fetchSheetTransactions,
  parseNominal
} from './googleSheetService';
import {
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredTarget,
  saveStoredTarget,
  exportTransactionsJSON,
  importTransactionsJSON
} from './storageService';
import {
  DEFAULT_TARGET_AMOUNT,
  DEFAULT_SHEET_ID,
  INITIAL_TRANSACTIONS
} from '../data/initialData';

describe('googleSheetService', () => {
  describe('parseNominal', () => {
    it('parses raw numbers correctly', () => {
      expect(parseNominal(2500000)).toBe(2500000);
      expect(parseNominal(0)).toBe(0);
      expect(parseNominal(-500000)).toBe(-500000);
    });

    it('parses Indonesian currency strings with dots and "Rp"', () => {
      expect(parseNominal('1.500.000')).toBe(1500000);
      expect(parseNominal('Rp 2.500.000')).toBe(2500000);
      expect(parseNominal('Rp100.000.000')).toBe(100000000);
    });

    it('parses comma-separated or plain numeric strings', () => {
      expect(parseNominal('1,500,000')).toBe(1500000);
      expect(parseNominal('750000')).toBe(750000);
      expect(parseNominal('1.500.000,50')).toBe(1500000.5);
    });

    it('handles empty, null, or invalid input safely', () => {
      expect(parseNominal(null)).toBe(0);
      expect(parseNominal(undefined)).toBe(0);
      expect(parseNominal('')).toBe(0);
      expect(parseNominal('abc')).toBe(0);
    });
  });

  describe('parseGVizResponse', () => {
    const sampleGVizResponse = `/*O_o*/
google.visualization.Query.setResponse({
  "version": "0.6",
  "reqId": "0",
  "status": "ok",
  "sig": "12345",
  "table": {
    "cols": [
      {"id": "A", "label": "id", "type": "string"},
      {"id": "B", "label": "tanggal", "type": "string"},
      {"id": "C", "label": "bulan", "type": "string"},
      {"id": "D", "label": "penabung", "type": "string"},
      {"id": "E", "label": "tipe", "type": "string"},
      {"id": "F", "label": "kategori", "type": "string"},
      {"id": "G", "label": "nominal", "type": "number"},
      {"id": "H", "label": "catatan", "type": "string"}
    ],
    "rows": [
      {
        "c": [
          {"v": "TX-01"},
          {"v": "2026-02-15"},
          {"v": "Februari 2026"},
          {"v": "Mas"},
          {"v": "Setoran"},
          {"v": "Tabungan Rutin"},
          {"v": 2500000, "f": "2.500.000"},
          {"v": "Gaji Februari"}
        ]
      },
      {
        "c": [
          {"v": "TX-02"},
          {"v": "2026-02-16"},
          {"v": "Februari 2026"},
          {"v": "Cece"},
          {"v": "Setoran"},
          {"v": "Tabungan Rutin"},
          {"v": "2.000.000"},
          {"v": "Gaji Cece"}
        ]
      }
    ]
  }
});`;

    it('extracts and parses valid GViz responses with col labels', () => {
      const result = parseGVizResponse(sampleGVizResponse);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'TX-01',
        tanggal: '2026-02-15',
        bulan: 'Februari 2026',
        penabung: 'Mas',
        tipe: 'Setoran',
        kategori: 'Tabungan Rutin',
        nominal: 2500000,
        catatan: 'Gaji Februari'
      });
      expect(result[1].nominal).toBe(2000000);
      expect(result[1].penabung).toBe('Cece');
    });

    it('parses responses when headers are in rows[0]', () => {
      const gvizWithHeaderInRow = `google.visualization.Query.setResponse({
        "status": "ok",
        "table": {
          "cols": [{"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}, {"id": "E"}, {"id": "F"}, {"id": "G"}],
          "rows": [
            {
              "c": [
                {"v": "Tanggal"},
                {"v": "Bulan"},
                {"v": "Penabung"},
                {"v": "Tipe"},
                {"v": "Kategori"},
                {"v": "Nominal"},
                {"v": "Catatan"}
              ]
            },
            {
              "c": [
                {"v": "2026-03-01"},
                {"v": "Maret 2026"},
                {"v": "Mas"},
                {"v": "Setoran"},
                {"v": "Bonus"},
                {"v": "1.000.000"},
                {"v": "Bonus project"}
              ]
            }
          ]
        }
      });`;

      const result = parseGVizResponse(gvizWithHeaderInRow);
      expect(result).toHaveLength(1);
      expect(result[0].nominal).toBe(1000000);
      expect(result[0].penabung).toBe('Mas');
      expect(result[0].tipe).toBe('Setoran');
      expect(result[0].id).toBeTruthy();
    });

    it('handles GViz Date format like Date(2026, 1, 15)', () => {
      const gvizWithDateObj = `google.visualization.Query.setResponse({
        "status": "ok",
        "table": {
          "cols": [
            {"label": "tanggal"},
            {"label": "bulan"},
            {"label": "penabung"},
            {"label": "tipe"},
            {"label": "kategori"},
            {"label": "nominal"},
            {"label": "catatan"}
          ],
          "rows": [
            {
              "c": [
                {"v": "Date(2026, 1, 15)"},
                null,
                {"v": "Mas"},
                {"v": "Setoran"},
                {"v": "Rutin"},
                {"v": 1500000},
                {"v": "Setoran Mas"}
              ]
            }
          ]
        }
      });`;

      const result = parseGVizResponse(gvizWithDateObj);
      expect(result).toHaveLength(1);
      expect(result[0].tanggal).toBe('2026-02-15');
      // Derived bulan
      expect(result[0].bulan).toBe('Februari 2026');
    });

    it('safely handles empty rows, null cells, or missing fields', () => {
      const gvizEmptyRows = `google.visualization.Query.setResponse({
        "status": "ok",
        "table": {
          "cols": [{"label": "tanggal"}, {"label": "penabung"}, {"label": "nominal"}],
          "rows": [
            { "c": null },
            { "c": [null, null, null] },
            { "c": [{"v": "2026-05-01"}, {"v": "Cece"}, {"v": 500000}] }
          ]
        }
      });`;

      const result = parseGVizResponse(gvizEmptyRows);
      expect(result).toHaveLength(1);
      expect(result[0].penabung).toBe('Cece');
      expect(result[0].nominal).toBe(500000);
    });

    it('returns empty array on malformed, error, or empty response text', () => {
      expect(parseGVizResponse('')).toEqual([]);
      expect(parseGVizResponse(null)).toEqual([]);
      expect(parseGVizResponse('invalid response')).toEqual([]);
      expect(parseGVizResponse('google.visualization.Query.setResponse({"status":"error"})')).toEqual([]);
    });
  });

  describe('fetchSheetTransactions', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.restoreAllMocks();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('fetches from Google Sheets URL and parses data successfully', async () => {
      const mockResponseText = `/*O_o*/
google.visualization.Query.setResponse({
  "status": "ok",
  "table": {
    "cols": [
      {"label": "id"}, {"label": "tanggal"}, {"label": "bulan"},
      {"label": "penabung"}, {"label": "tipe"}, {"label": "kategori"},
      {"label": "nominal"}, {"label": "catatan"}
    ],
    "rows": [
      {
        "c": [
          {"v": "TX-100"}, {"v": "2026-06-01"}, {"v": "Juni 2026"},
          {"v": "Mas"}, {"v": "Setoran"}, {"v": "Tabungan Rutin"},
          {"v": 4000000}, {"v": "Gaji Juni"}
        ]
      }
    ]
  }
});`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockResponseText)
      });

      const data = await fetchSheetTransactions('customSheetId', '0');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://docs.google.com/spreadsheets/d/customSheetId/gviz/tq?tqx=out:json&gid=0'
      );
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('TX-100');
      expect(data[0].nominal).toBe(4000000);

      // Verifies it also cached to localStorage
      const cached = loadStoredTransactions();
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe('TX-100');
    });

    it('falls back to localStorage or initial data when fetch fails', async () => {
      saveStoredTransactions([
        {
          id: 'TX-OFFLINE-1',
          tanggal: '2026-01-01',
          bulan: 'Januari 2026',
          penabung: 'Cece',
          tipe: 'Setoran',
          kategori: 'Tabungan Rutin',
          nominal: 1200000,
          catatan: 'Cached data'
        }
      ]);

      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const data = await fetchSheetTransactions();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('TX-OFFLINE-1');
    });

    it('falls back to INITIAL_TRANSACTIONS if storage is empty on fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const data = await fetchSheetTransactions();
      expect(data).toEqual(INITIAL_TRANSACTIONS);
    });

    it('throws error when fallbackToStorage is false and fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API forbidden'));

      await expect(
        fetchSheetTransactions(DEFAULT_SHEET_ID, '0', { fallbackToStorage: false })
      ).rejects.toThrow('API forbidden');
    });
  });
});
describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('transactions storage', () => {
    it('returns INITIAL_TRANSACTIONS if localStorage is empty', () => {
      const data = loadStoredTransactions();
      expect(data).toEqual(INITIAL_TRANSACTIONS);
    });

    it('saves and loads transactions from localStorage', () => {
      const mockList = [
        {
          id: 'TX-CUSTOM-1',
          tanggal: '2026-05-20',
          bulan: 'Mei 2026',
          penabung: 'Mas',
          tipe: 'Setoran',
          kategori: 'Bonus',
          nominal: 8000000,
          catatan: 'THR'
        }
      ];

      saveStoredTransactions(mockList);
      const loaded = loadStoredTransactions();
      expect(loaded).toEqual(mockList);
    });

    it('returns INITIAL_TRANSACTIONS if localStorage content is invalid JSON', () => {
      localStorage.setItem('wedding_transactions', 'not-valid-json');
      const data = loadStoredTransactions();
      expect(data).toEqual(INITIAL_TRANSACTIONS);
    });
  });

  describe('target amount storage', () => {
    it('returns DEFAULT_TARGET_AMOUNT if nothing stored', () => {
      expect(loadStoredTarget()).toBe(DEFAULT_TARGET_AMOUNT);
    });

    it('saves and loads custom target amount', () => {
      saveStoredTarget(120000000);
      expect(loadStoredTarget()).toBe(120000000);
    });

    it('returns default if stored target is invalid or non-positive', () => {
      localStorage.setItem('wedding_target_amount', 'invalid');
      expect(loadStoredTarget()).toBe(DEFAULT_TARGET_AMOUNT);
      localStorage.setItem('wedding_target_amount', '-100');
      expect(loadStoredTarget()).toBe(DEFAULT_TARGET_AMOUNT);
    });
  });

  describe('export and import JSON', () => {
    it('exports transactions with backup metadata', () => {
      const mockList = [
        {
          id: 'TX-EXP-1',
          tanggal: '2026-02-01',
          bulan: 'Februari 2026',
          penabung: 'Mas',
          tipe: 'Setoran',
          kategori: 'Rutin',
          nominal: 2000000,
          catatan: 'Catatan'
        }
      ];

      const jsonStr = exportTransactionsJSON(mockList);
      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.version).toBe('1.0');
      expect(parsed.transactions).toEqual(mockList);
      expect(parsed.exportedAt).toBeTruthy();
    });

    it('imports transactions from backup object format', () => {
      const backup = {
        version: '1.0',
        exportedAt: '2026-02-01T00:00:00.000Z',
        transactions: [
          {
            id: 'TX-IMP-1',
            tanggal: '2026-03-01',
            bulan: 'Maret 2026',
            penabung: 'Cece',
            tipe: 'Setoran',
            kategori: 'Tabungan',
            nominal: 3000000,
            catatan: 'Tabungan'
          }
        ]
      };

      const result = importTransactionsJSON(JSON.stringify(backup));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TX-IMP-1');
      expect(result[0].nominal).toBe(3000000);
    });

    it('imports transactions from a direct array format', () => {
      const rawArray = [
        {
          id: 'TX-RAW-1',
          tanggal: '2026-04-01',
          nominal: '1.500.000',
          penabung: 'Mas'
        }
      ];

      const result = importTransactionsJSON(JSON.stringify(rawArray));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TX-RAW-1');
      expect(result[0].nominal).toBe(1500000);
    });

    it('throws error when importing invalid JSON or empty content', () => {
      expect(() => importTransactionsJSON('')).toThrow();
      expect(() => importTransactionsJSON('{ invalid json')).toThrow();
      expect(() => importTransactionsJSON(JSON.stringify({ notA: 'transaction' }))).toThrow();
      expect(() => importTransactionsJSON(JSON.stringify([]))).not.toThrow();
    });
  });
});
