const MONTH_NAMES_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Calculates summary metrics for savings transactions.
 *
 * @param {Array} transactions - List of transaction items
 * @param {number} [targetAmount=100000000] - Total target savings goal
 * @returns {{
 *   targetAmount: number,
 *   totalSavings: number,
 *   totalExpense: number,
 *   netSavings: number,
 *   remaining: number,
 *   percentComplete: number,
 *   masTotal: number,
 *   ceceTotal: number,
 *   masPercent: number,
 *   cecePercent: number
 * }}
 */
export function calculateSummary(transactions = [], targetAmount = 100000000) {
  const target = Number(targetAmount) || 100000000;
  const list = Array.isArray(transactions) ? transactions : [];

  let totalSavings = 0;
  let totalExpense = 0;
  let masTotal = 0;
  let ceceTotal = 0;

  for (const t of list) {
    if (!t) continue;
    const nominal = Number(t.nominal) || 0;

    if (t.tipe === 'Setoran') {
      totalSavings += nominal;
      if (t.penabung === 'Mas') {
        masTotal += nominal;
      } else if (t.penabung === 'Cece') {
        ceceTotal += nominal;
      }
    } else if (t.tipe === 'Pengeluaran') {
      totalExpense += nominal;
    }
  }

  const netSavings = totalSavings - totalExpense;
  const remaining = Math.max(0, target - netSavings);

  const percentComplete = target > 0
    ? Math.max(0, Math.min(100, Math.round((netSavings / target) * 100)))
    : 0;

  const totalContributions = masTotal + ceceTotal;
  const masPercent = totalContributions > 0
    ? Math.round((masTotal / totalContributions) * 100)
    : 0;
  const cecePercent = totalContributions > 0
    ? Math.round((ceceTotal / totalContributions) * 100)
    : 0;

  return {
    targetAmount: target,
    totalSavings,
    totalExpense,
    netSavings,
    remaining,
    percentComplete,
    masTotal,
    ceceTotal,
    masPercent,
    cecePercent,
  };
}

/**
 * Calculates monthly simulation projections based on remaining target and savings rate.
 *
 * @param {number} remainingAmount - Remaining amount to reach target
 * @param {number} masPerMonth - Expected monthly deposit from Mas
 * @param {number} cecePerMonth - Expected monthly deposit from Cece
 * @param {Date|string} [startDate=new Date()] - Reference starting date for simulation
 * @returns {{
 *   totalPerMonth: number,
 *   monthsNeeded: number,
 *   estimatedDate: string
 * }}
 */
export function calculateSimulation(
  remainingAmount,
  masPerMonth,
  cecePerMonth,
  startDate = new Date()
) {
  const remaining = Number(remainingAmount) || 0;
  const mas = Number(masPerMonth) || 0;
  const cece = Number(cecePerMonth) || 0;
  const totalPerMonth = mas + cece;

  const refDate = startDate instanceof Date ? new Date(startDate.getTime()) : new Date(startDate);
  const isValidDate = !isNaN(refDate.getTime());

  if (remaining <= 0) {
    const estimatedDate = isValidDate
      ? `${MONTH_NAMES_LONG[refDate.getMonth()]} ${refDate.getFullYear()}`
      : '-';
    return {
      totalPerMonth,
      monthsNeeded: 0,
      estimatedDate,
    };
  }

  if (totalPerMonth <= 0) {
    return {
      totalPerMonth: 0,
      monthsNeeded: Infinity,
      estimatedDate: '-',
    };
  }

  const monthsNeeded = Math.ceil(remaining / totalPerMonth);

  let estimatedDate = '-';
  if (isValidDate) {
    refDate.setMonth(refDate.getMonth() + monthsNeeded);
    estimatedDate = `${MONTH_NAMES_LONG[refDate.getMonth()]} ${refDate.getFullYear()}`;
  }

  return {
    totalPerMonth,
    monthsNeeded,
    estimatedDate,
  };
}

/**
 * Groups transactions by month (chronologically ordered) and computes cumulative net totals.
 *
 * @param {Array} transactions - List of transaction items
 * @returns {Array<{
 *   month: string,
 *   mas: number,
 *   cece: number,
 *   bersama: number,
 *   expense: number,
 *   net: number,
 *   cumulative: number
 * }>}
 */
export function calculateMonthlyTrends(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const monthlyMap = new Map();

  for (const t of transactions) {
    if (!t || !t.tanggal) continue;

    let year;
    let month;

    if (typeof t.tanggal === 'string') {
      const match = t.tanggal.match(/^(\d{4})-(\d{2})/);
      if (match) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
      }
    }

    if (year === undefined || month === undefined || isNaN(year) || isNaN(month)) {
      const d = new Date(t.tanggal);
      if (isNaN(d.getTime())) continue;
      year = d.getFullYear();
      month = d.getMonth();
    }

    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const nominal = Number(t.nominal) || 0;

    let entry = monthlyMap.get(key);
    if (!entry) {
      entry = { key, year, month, mas: 0, cece: 0, bersama: 0, expense: 0 };
      monthlyMap.set(key, entry);
    }

    if (t.tipe === 'Setoran') {
      if (t.penabung === 'Mas') {
        entry.mas += nominal;
      } else if (t.penabung === 'Cece') {
        entry.cece += nominal;
      } else {
        entry.bersama += nominal;
      }
    } else if (t.tipe === 'Pengeluaran') {
      entry.expense += nominal;
    }
  }

  const sortedEntries = Array.from(monthlyMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  let cumulative = 0;
  return sortedEntries.map((entry) => {
    const net = (entry.mas + entry.cece + entry.bersama) - entry.expense;
    cumulative += net;
    return {
      month: `${MONTH_NAMES_LONG[entry.month]} ${entry.year}`,
      mas: entry.mas,
      cece: entry.cece,
      bersama: entry.bersama,
      expense: entry.expense,
      net,
      cumulative,
    };
  });
}
