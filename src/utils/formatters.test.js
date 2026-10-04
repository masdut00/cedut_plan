import { describe, it, expect } from 'vitest';
import { formatRupiah, formatShortRupiah, formatDate } from './formatters';

describe('formatters', () => {
  describe('formatRupiah', () => {
    it('formats standard positive numbers to Indonesian Rupiah currency format', () => {
      expect(formatRupiah(100000000)).toBe('Rp 100.000.000');
      expect(formatRupiah(2500000)).toBe('Rp 2.500.000');
      expect(formatRupiah(50000)).toBe('Rp 50.000');
    });

    it('formats 0 correctly', () => {
      expect(formatRupiah(0)).toBe('Rp 0');
    });

    it('handles numeric strings gracefully', () => {
      expect(formatRupiah('1500000')).toBe('Rp 1.500.000');
      expect(formatRupiah('0')).toBe('Rp 0');
    });

    it('handles null, undefined, and non-numeric inputs safely', () => {
      expect(formatRupiah(null)).toBe('Rp 0');
      expect(formatRupiah(undefined)).toBe('Rp 0');
      expect(formatRupiah('')).toBe('Rp 0');
      expect(formatRupiah('invalid')).toBe('Rp 0');
    });

    it('handles negative numbers', () => {
      expect(formatRupiah(-50000)).toBe('-Rp 50.000');
    });
  });

  describe('formatShortRupiah', () => {
    it('formats billions with M suffix', () => {
      expect(formatShortRupiah(1000000000)).toBe('Rp 1 M');
      expect(formatShortRupiah(2500000000)).toBe('Rp 2,5 M');
    });

    it('formats millions with Jt suffix', () => {
      expect(formatShortRupiah(100000000)).toBe('Rp 100 Jt');
      expect(formatShortRupiah(2500000)).toBe('Rp 2,5 Jt');
      expect(formatShortRupiah(1000000)).toBe('Rp 1 Jt');
    });

    it('formats thousands with Rb suffix', () => {
      expect(formatShortRupiah(500000)).toBe('Rp 500 Rb');
      expect(formatShortRupiah(2500)).toBe('Rp 2,5 Rb');
    });

    it('formats values under 1000 without abbreviation', () => {
      expect(formatShortRupiah(500)).toBe('Rp 500');
      expect(formatShortRupiah(0)).toBe('Rp 0');
    });

    it('handles null and undefined safely', () => {
      expect(formatShortRupiah(null)).toBe('Rp 0');
      expect(formatShortRupiah(undefined)).toBe('Rp 0');
      expect(formatShortRupiah('invalid')).toBe('Rp 0');
    });
  });

  describe('formatDate', () => {
    it('formats YYYY-MM-DD string to Indonesian short date', () => {
      expect(formatDate('2026-10-05')).toBe('5 Okt 2026');
      expect(formatDate('2026-01-15')).toBe('15 Jan 2026');
      expect(formatDate('2026-08-17')).toBe('17 Agu 2026');
    });

    it('handles Date objects', () => {
      const date = new Date(2026, 9, 5); // October 5, 2026 in local time
      expect(formatDate(date)).toBe('5 Okt 2026');
    });

    it('handles invalid or empty date safely', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('')).toBe('-');
      expect(formatDate('invalid-date')).toBe('-');
    });
  });
});
