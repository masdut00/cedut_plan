import React from 'react'
import { Heart, Sparkles } from 'lucide-react'
import { formatRupiah, formatShortRupiah } from '../utils/formatters'

/**
 * WeddingProgressBar displays visual milestone progress towards the wedding goal.
 * Includes milestone markers at 25%, 50%, 75%, and 100% with labels and wedding iconography.
 *
 * @param {{
 *   percentComplete?: number,
 *   targetAmount?: number,
 *   netSavings?: number,
 *   summary?: {
 *     percentComplete?: number,
 *     targetAmount?: number,
 *     netSavings?: number
 *   }
 * }} props
 */
export default function WeddingProgressBar({
  percentComplete,
  targetAmount,
  netSavings,
  summary,
}) {
  const target = typeof targetAmount === 'number'
    ? targetAmount
    : (summary?.targetAmount ?? 100000000)

  const net = typeof netSavings === 'number'
    ? netSavings
    : (summary?.netSavings ?? 0)

  const rawPercent = typeof percentComplete === 'number'
    ? percentComplete
    : (summary?.percentComplete ?? (target > 0 ? Math.round((net / target) * 100) : 0))

  const clampedPercent = Math.max(0, Math.min(100, Math.round(rawPercent)))

  // Helper to format short Rupiah milestone label without the "Rp " prefix
  const formatMilestone = (pct) => {
    const nominal = target * (pct / 100)
    return formatShortRupiah(nominal).replace(/^Rp\s*/, '')
  }

  const milestones = [
    { percent: 25, label: formatMilestone(25) },
    { percent: 50, label: formatMilestone(50) },
    { percent: 75, label: formatMilestone(75) },
    { percent: 100, label: formatMilestone(100) },
  ]

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-wedding-rose-100/70 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-wedding-rose-50 text-wedding-rose-600 flex items-center justify-center">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-1.5">
              Progres Tabungan Menuju Hari Bahagia
              <Sparkles className="w-3.5 h-3.5 text-wedding-gold-500" />
            </h3>
            <p className="text-xs text-slate-500">
              {formatRupiah(net)} terkumpul dari target {formatRupiah(target)}
            </p>
          </div>
        </div>

        {/* Current Percentage Badge */}
        <div className="flex items-center self-start sm:self-auto gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-wedding-rose-50 to-wedding-gold-50 text-wedding-rose-700 border border-wedding-rose-200 shadow-xs">
            <svg
              className="w-3.5 h-3.5 text-wedding-gold-600 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Interlocking wedding rings icon */}
              <circle cx="9" cy="12" r="5" />
              <circle cx="15" cy="12" r="5" />
            </svg>
            <span>{clampedPercent}%</span>
          </span>
        </div>
      </div>

      {/* Progress Track and Fill */}
      <div className="relative pt-1 pb-1">
        <div
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Progress tabungan pernikahan"
          className="relative h-4 sm:h-5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-wedding-rose-400 via-wedding-rose-500 to-wedding-gold-500 transition-all duration-700 ease-out shadow-inner"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        {/* Milestone Tick Marks overlayed on track */}
        <div className="relative w-full h-0">
          {milestones.map((m) => {
            const isReached = clampedPercent >= m.percent
            return (
              <div
                key={m.percent}
                className="absolute -top-3.5 sm:-top-4 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${m.percent}%` }}
              >
                <div
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white shadow-xs transition-colors duration-300 ${
                    isReached
                      ? 'bg-wedding-gold-500 ring-2 ring-wedding-gold-200'
                      : 'bg-slate-300'
                  }`}
                  aria-hidden="true"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestone Labels Grid */}
      <div className="relative mt-4 pt-1 grid grid-cols-4 gap-1 text-center">
        {milestones.map((m) => {
          const isReached = clampedPercent >= m.percent
          return (
            <div
              key={m.percent}
              className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
                isReached ? 'bg-wedding-gold-50/50' : 'bg-transparent'
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  isReached ? 'text-wedding-gold-700' : 'text-slate-600'
                }`}
              >
                {m.percent}%
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
