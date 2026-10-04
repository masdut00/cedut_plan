import React, { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { calculateMonthlyTrends } from '../utils/calculations'
import { formatRupiah, formatShortRupiah } from '../utils/formatters'

/**
 * MonthlyChart renders a lightweight CSS bar chart of cumulative net savings per month.
 * No charting library — keeps the bundle small.
 *
 * @param {{ transactions?: Array, targetAmount?: number }} props
 */
export default function MonthlyChart({ transactions = [], targetAmount = 100000000 }) {
  const trends = useMemo(() => calculateMonthlyTrends(transactions), [transactions])

  const maxValue = Math.max(1, ...trends.map((t) => Math.max(0, t.cumulative)))

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-wedding-sage-100 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-wedding-sage-100 text-wedding-sage-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">Pertumbuhan Tabungan</h3>
            <p className="text-xs text-slate-500">Akumulasi tabungan bersih per bulan</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500">Target {formatShortRupiah(targetAmount)}</span>
      </div>

      {trends.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">Belum ada data transaksi untuk ditampilkan.</p>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3 h-48 overflow-x-auto pb-1">
          {trends.map((t) => {
            const heightPercent = Math.max(2, Math.round((Math.max(0, t.cumulative) / maxValue) * 100))
            return (
              <div key={t.month} className="flex-1 min-w-[44px] h-full flex flex-col items-center justify-end">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-600 mb-1 whitespace-nowrap">
                  {formatShortRupiah(t.cumulative)}
                </span>
                <div
                  data-testid="chart-bar"
                  role="img"
                  aria-label={`${t.month}: ${formatRupiah(t.cumulative)}`}
                  title={`${t.month}\nAkumulasi: ${formatRupiah(t.cumulative)}\nBersih bulan ini: ${formatRupiah(t.net)}`}
                  className="w-full rounded-t-lg bg-gradient-to-t from-wedding-sage-500 to-wedding-sage-300 transition-all duration-500"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] sm:text-xs text-slate-500 mt-1.5 whitespace-nowrap">
                  {t.month.slice(0, 3)} {t.month.slice(-2)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
