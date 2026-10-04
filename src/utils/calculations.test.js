import { describe, it, expect } from 'vitest';
import {
  calculateSummary,
  calculateSimulation,
  calculateMonthlyTrends,
} from './calculations';

describe('calculations', () => {
  describe('calculateSummary', () => {
    it('calculates summary correctly with mixed deposits and expenses', () => {
      const transactions = [
        { id: 1, penabung: 'Mas', tipe: 'Setoran', nominal: 30000000, tanggal: '2026-01-10' },
        { id: 2, penabung: 'Cece', tipe: 'Setoran', nominal: 20000000, tanggal: '2026-01-15' },
        { id: 3, penabung: 'Mas', tipe: 'Pengeluaran', nominal: 5000000, tanggal: '2026-02-01' },
      ];

      const result = calculateSummary(transactions, 100000000);

      expect(result).toEqual({
        targetAmount: 100000000,
        totalSavings: 50000000,
        totalExpense: 5000000,
        netSavings: 45000000,
        remaining: 55000000,
        percentComplete: 45,
        masTotal: 30000000,
        ceceTotal: 20000000,
        masPercent: 60,
        cecePercent: 40,
      });
    });

    it('handles empty transactions list with default targetAmount of 100,000,000', () => {
      const result = calculateSummary([]);

      expect(result).toEqual({
        targetAmount: 100000000,
        totalSavings: 0,
        totalExpense: 0,
        netSavings: 0,
        remaining: 100000000,
        percentComplete: 0,
        masTotal: 0,
        ceceTotal: 0,
        masPercent: 0,
        cecePercent: 0,
      });
    });

    it('handles null or undefined transactions gracefully', () => {
      const result = calculateSummary(null);

      expect(result).toEqual({
        targetAmount: 100000000,
        totalSavings: 0,
        totalExpense: 0,
        netSavings: 0,
        remaining: 100000000,
        percentComplete: 0,
        masTotal: 0,
        ceceTotal: 0,
        masPercent: 0,
        cecePercent: 0,
      });
    });

    it('handles string nominal values safely', () => {
      const transactions = [
        { id: 1, penabung: 'Mas', tipe: 'Setoran', nominal: '15000000', tanggal: '2026-01-10' },
        { id: 2, penabung: 'Cece', tipe: 'Setoran', nominal: '15000000', tanggal: '2026-01-15' },
      ];

      const result = calculateSummary(transactions, 50000000);

      expect(result.totalSavings).toBe(30000000);
      expect(result.netSavings).toBe(30000000);
      expect(result.remaining).toBe(20000000);
      expect(result.percentComplete).toBe(60);
      expect(result.masPercent).toBe(50);
      expect(result.cecePercent).toBe(50);
    });

    it('caps percentComplete at 100% when savings exceed target and remaining is 0', () => {
      const transactions = [
        { id: 1, penabung: 'Mas', tipe: 'Setoran', nominal: 70000000, tanggal: '2026-01-10' },
        { id: 2, penabung: 'Cece', tipe: 'Setoran', nominal: 60000000, tanggal: '2026-01-15' },
      ];

      const result = calculateSummary(transactions, 100000000);

      expect(result.netSavings).toBe(130000000);
      expect(result.remaining).toBe(0);
      expect(result.percentComplete).toBe(100);
    });

    it('ensures percentComplete is not negative if expenses exceed deposits', () => {
      const transactions = [
        { id: 1, penabung: 'Mas', tipe: 'Setoran', nominal: 1000000, tanggal: '2026-01-10' },
        { id: 2, penabung: 'Mas', tipe: 'Pengeluaran', nominal: 5000000, tanggal: '2026-01-15' },
      ];

      const result = calculateSummary(transactions, 100000000);

      expect(result.netSavings).toBe(-4000000);
      expect(result.remaining).toBe(104000000);
      expect(result.percentComplete).toBe(0);
    });
  });

  describe('calculateSimulation', () => {
    it('calculates months needed and estimated target date correctly', () => {
      const referenceDate = new Date(2026, 9, 1); // Oktober 2026
      const result = calculateSimulation(55000000, 3000000, 2500000, referenceDate);

      expect(result).toEqual({
        totalPerMonth: 55000000 ? 5500000 : 0, // 3M + 2.5M = 5.5M
        monthsNeeded: 10, // 55M / 5.5M = 10 months
        estimatedDate: 'Agustus 2027', // Oct 2026 + 10 months = Aug 2027
      });
    });

    it('handles fractional month divisions by rounding up (ceil)', () => {
      const referenceDate = new Date(2026, 0, 1); // Januari 2026
      // 10,000,000 / 3,000,000 = 3.33 -> 4 months
      const result = calculateSimulation(10000000, 2000000, 1000000, referenceDate);

      expect(result.totalPerMonth).toBe(3000000);
      expect(result.monthsNeeded).toBe(4);
      expect(result.estimatedDate).toBe('Mei 2026'); // Jan 2026 + 4 months = May 2026
    });

    it('returns monthsNeeded 0 when remaining is 0 or negative', () => {
      const referenceDate = new Date(2026, 9, 1); // Oktober 2026
      const result = calculateSimulation(0, 3000000, 2000000, referenceDate);

      expect(result.monthsNeeded).toBe(0);
      expect(result.estimatedDate).toBe('Oktober 2026');
    });

    it('handles zero monthly contribution without division by zero error', () => {
      const result = calculateSimulation(50000000, 0, 0);

      expect(result.totalPerMonth).toBe(0);
      expect(result.monthsNeeded).toBe(Infinity);
      expect(result.estimatedDate).toBe('-');
    });
  });

  describe('calculateMonthlyTrends', () => {
    it('groups transactions by month and sorts chronologically with cumulative net totals', () => {
      const transactions = [
        // Out of order on purpose to test sorting
        { id: 1, penabung: 'Cece', tipe: 'Setoran', nominal: 2000000, tanggal: '2026-10-15' },
        { id: 2, penabung: 'Mas', tipe: 'Setoran', nominal: 2500000, tanggal: '2026-10-05' },
        { id: 3, penabung: 'Mas', tipe: 'Setoran', nominal: 3000000, tanggal: '2026-08-10' },
        { id: 4, penabung: 'Cece', tipe: 'Setoran', nominal: 2000000, tanggal: '2026-08-20' },
        { id: 5, penabung: 'Mas', tipe: 'Pengeluaran', nominal: 1000000, tanggal: '2026-08-25' },
        { id: 6, penabung: 'Mas', tipe: 'Setoran', nominal: 4000000, tanggal: '2026-09-01' },
        { id: 7, penabung: 'Cece', tipe: 'Setoran', nominal: 3000000, tanggal: '2026-09-15' },
      ];

      const trends = calculateMonthlyTrends(transactions);

      expect(trends).toEqual([
        {
          month: 'Agustus 2026',
          mas: 3000000,
          cece: 2000000,
          expense: 1000000,
          net: 4000000,
          cumulative: 4000000,
        },
        {
          month: 'September 2026',
          mas: 4000000,
          cece: 3000000,
          expense: 0,
          net: 7000000,
          cumulative: 11000000,
        },
        {
          month: 'Oktober 2026',
          mas: 2500000,
          cece: 2000000,
          expense: 0,
          net: 4500000,
          cumulative: 15500000,
        },
      ]);
    });

    it('returns empty array when transactions is empty or invalid', () => {
      expect(calculateMonthlyTrends([])).toEqual([]);
      expect(calculateMonthlyTrends(null)).toEqual([]);
      expect(calculateMonthlyTrends(undefined)).toEqual([]);
    });

    it('ignores transactions with invalid dates gracefully', () => {
      const transactions = [
        { id: 1, penabung: 'Mas', tipe: 'Setoran', nominal: 1000000, tanggal: 'invalid-date' },
        { id: 2, penabung: 'Mas', tipe: 'Setoran', nominal: 2000000, tanggal: '2026-10-01' },
      ];

      const trends = calculateMonthlyTrends(transactions);
      expect(trends).toHaveLength(1);
      expect(trends[0].mas).toBe(2000000);
      expect(trends[0].month).toBe('Oktober 2026');
    });
  });
});
