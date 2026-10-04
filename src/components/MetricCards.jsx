import React from 'react'
import { Target, Wallet, HeartHandshake, Sparkles } from 'lucide-react'
import { formatRupiah } from '../utils/formatters'

/**
 * MetricCards displays the 4 top-level KPI metrics for the wedding savings dashboard:
 * 1. Target Tabungan
 * 2. Total Terkumpul (Net)
 * 3. Sisa Kebutuhan
 * 4. Progress (%)
 *
 * @param {{
 *   summary?: {
 *     targetAmount?: number,
 *     totalSavings?: number,
 *     totalExpense?: number,
 *     netSavings?: number,
 *     remaining?: number,
 *     percentComplete?: number
 *   }
 * }} props
 */
export default function MetricCards({ summary = {} }) {
  const targetAmount = summary?.targetAmount ?? 100000000
  const netSavings = summary?.netSavings ?? 0
  const remaining = summary?.remaining ?? Math.max(0, targetAmount - netSavings)
  const percentComplete = summary?.percentComplete ?? (
    targetAmount > 0 ? Math.max(0, Math.min(100, Math.round((netSavings / targetAmount) * 100))) : 0
  )

  const cards = [
    {
      id: 'target',
      title: 'Target Tabungan',
      value: formatRupiah(targetAmount),
      subtitle: 'Target impian bersama',
      icon: Target,
      iconColor: 'text-wedding-gold-600',
      iconBg: 'bg-wedding-gold-100',
      borderColor: 'border-wedding-gold-100',
    },
    {
      id: 'terkumpul',
      title: 'Total Terkumpul',
      value: formatRupiah(netSavings),
      subtitle: 'Tabungan bersih saat ini',
      icon: Wallet,
      iconColor: 'text-wedding-sage-600',
      iconBg: 'bg-wedding-sage-100',
      borderColor: 'border-wedding-sage-100',
    },
    {
      id: 'sisa',
      title: 'Sisa Kebutuhan',
      value: formatRupiah(remaining),
      subtitle: remaining === 0 ? 'Target telah terpenuhi' : 'Perlu dikumpulkan lagi',
      icon: HeartHandshake,
      iconColor: 'text-wedding-rose-600',
      iconBg: 'bg-wedding-rose-100',
      borderColor: 'border-wedding-rose-100',
    },
    {
      id: 'progress',
      title: 'Progress',
      value: `${percentComplete}%`,
      subtitle: remaining === 0 ? 'Target tercapai! 🎉' : 'Dari total target',
      icon: Sparkles,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100',
      borderColor: 'border-amber-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <div
            key={card.id}
            className={`bg-white rounded-2xl p-4 sm:p-5 border ${card.borderColor} shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-slate-500">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-sm`}
                aria-hidden="true"
              >
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
