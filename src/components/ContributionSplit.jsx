import React from 'react'
import { Users, User } from 'lucide-react'
import { formatRupiah } from '../utils/formatters'

/**
 * ContributionSplit displays the split ratio and contribution breakdown between Mas and Cece.
 *
 * @param {{
 *   summary?: {
 *     masTotal?: number,
 *     ceceTotal?: number,
 *     masPercent?: number,
 *     cecePercent?: number,
 *     netSavings?: number
 *   },
 *   masTotal?: number,
 *   ceceTotal?: number,
 *   masPercent?: number,
 *   cecePercent?: number,
 *   netSavings?: number
 * }} props
 */
export default function ContributionSplit({
  summary,
  masTotal: propMasTotal,
  ceceTotal: propCeceTotal,
  masPercent: propMasPercent,
  cecePercent: propCecePercent,
  netSavings: propNetSavings,
}) {
  const masTotal = Number(propMasTotal ?? summary?.masTotal ?? 0)
  const ceceTotal = Number(propCeceTotal ?? summary?.ceceTotal ?? 0)
  const totalContributions = masTotal + ceceTotal

  const calculatedMasPercent = totalContributions > 0
    ? Math.round((masTotal / totalContributions) * 100)
    : 0

  const calculatedCecePercent = totalContributions > 0
    ? 100 - calculatedMasPercent
    : 0

  const masPercent = Number(propMasPercent ?? summary?.masPercent ?? calculatedMasPercent)
  const cecePercent = Number(propCecePercent ?? summary?.cecePercent ?? calculatedCecePercent)

  const hasContributions = totalContributions > 0

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-wedding-rose-100/70 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              Split Kontribusi Tabungan
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan porsi setoran Mas vs Cece
            </p>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500">
          Total: {formatRupiah(totalContributions)}
        </div>
      </div>

      {/* Dual Split Visual Bar */}
      <div className="relative mb-5">
        <div className="h-4 sm:h-5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/70">
          {hasContributions ? (
            <>
              <div
                className="h-full bg-slate-700 rounded-l-full transition-all duration-500 ease-out"
                style={{ width: `${masPercent}%` }}
                title={`Mas: ${masPercent}%`}
                aria-label={`Mas: ${masPercent}%`}
              />
              <div
                className="h-full bg-wedding-rose-500 rounded-r-full transition-all duration-500 ease-out"
                style={{ width: `${cecePercent}%` }}
                title={`Cece: ${cecePercent}%`}
                aria-label={`Cece: ${cecePercent}%`}
              />
            </>
          ) : (
            <div className="h-full w-full bg-slate-200 rounded-full" />
          )}
        </div>
      </div>

      {/* Comparison Person Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Mas Card */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                M
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Mas
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800">
              {masPercent}%
            </span>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatRupiah(masTotal)}
            </div>
            <span className="text-[11px] text-slate-500">Porsi setoran Mas</span>
          </div>
        </div>

        {/* Cece Card */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-wedding-rose-50/60 border border-wedding-rose-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-wedding-rose-200 text-wedding-rose-700 flex items-center justify-center text-xs font-bold">
                C
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Cece
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-wedding-rose-200 text-wedding-rose-800">
              {cecePercent}%
            </span>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatRupiah(ceceTotal)}
            </div>
            <span className="text-[11px] text-slate-500">Porsi setoran Cece</span>
          </div>
        </div>
      </div>
    </div>
  )
}
