import React, { useMemo, useState } from 'react'
import { Calculator, CalendarHeart, Clock, PiggyBank } from 'lucide-react'
import { calculateSimulation } from '../utils/calculations'
import { formatRupiah } from '../utils/formatters'

const SLIDER_MIN = 0
const SLIDER_MAX = 15000000
const SLIDER_STEP = 100000

/**
 * SavingsSimulator lets Mas & Cece adjust their monthly saving commitment and
 * see how many months remain and the estimated month the target is reached.
 *
 * @param {{
 *   remaining?: number,
 *   defaultMas?: number,
 *   defaultCece?: number,
 *   startDate?: Date
 * }} props
 */
export default function SavingsSimulator({
  remaining = 0,
  defaultMas = 2500000,
  defaultCece = 2000000,
  startDate,
}) {
  const [masPerMonth, setMasPerMonth] = useState(defaultMas)
  const [cecePerMonth, setCecePerMonth] = useState(defaultCece)

  const result = useMemo(
    () => calculateSimulation(remaining, masPerMonth, cecePerMonth, startDate ?? new Date()),
    [remaining, masPerMonth, cecePerMonth, startDate]
  )

  const isReached = Number(remaining) <= 0
  const noCommitment = !isReached && result.totalPerMonth <= 0
  const monthsLabel = Number.isFinite(result.monthsNeeded) ? `${result.monthsNeeded} bulan` : '-'

  const sliders = [
    {
      id: 'sim-mas',
      label: 'Komitmen Mas per bulan',
      value: masPerMonth,
      onChange: setMasPerMonth,
      accent: 'accent-slate-700',
      text: 'text-slate-700',
    },
    {
      id: 'sim-cece',
      label: 'Komitmen Cece per bulan',
      value: cecePerMonth,
      onChange: setCecePerMonth,
      accent: 'accent-rose-500',
      text: 'text-wedding-rose-600',
    },
  ]

  const outcomes = [
    { id: 'sim-total', title: 'Total / bulan', value: formatRupiah(result.totalPerMonth), icon: PiggyBank },
    { id: 'sim-months', title: 'Sisa waktu', value: monthsLabel, icon: Clock },
    { id: 'sim-date', title: 'Perkiraan tercapai', value: result.estimatedDate, icon: CalendarHeart },
  ]

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-wedding-gold-100 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-wedding-gold-100 text-wedding-gold-700 flex items-center justify-center">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-800">Simulasi Waktu Pernikahan</h3>
          <p className="text-xs text-slate-500">
            Sisa kebutuhan {formatRupiah(Math.max(0, Number(remaining) || 0))}
          </p>
        </div>
      </div>

      <div className="space-y-5 mb-6">
        {sliders.map((s) => (
          <div key={s.id}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={s.id} className="text-xs sm:text-sm font-medium text-slate-600">
                {s.label}
              </label>
              <span className={`text-sm font-semibold ${s.text}`}>{formatRupiah(s.value)}</span>
            </div>
            <input
              id={s.id}
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={SLIDER_STEP}
              value={s.value}
              onChange={(e) => s.onChange(Number(e.target.value) || 0)}
              className={`w-full ${s.accent} cursor-pointer`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {outcomes.map((o) => {
          const IconComponent = o.icon
          return (
            <div key={o.id} className="rounded-xl bg-wedding-gold-50 border border-wedding-gold-100 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <IconComponent className="w-3.5 h-3.5" aria-hidden="true" />
                {o.title}
              </div>
              <div data-testid={o.id} className="text-base sm:text-lg font-bold text-slate-900">
                {o.value}
              </div>
            </div>
          )
        })}
      </div>

      {isReached && (
        <p className="mt-4 text-sm text-wedding-sage-600 font-medium">
          Target sudah tercapai! Saatnya fokus ke persiapan hari bahagia 🎉
        </p>
      )}
      {noCommitment && (
        <p className="mt-4 text-sm text-wedding-rose-600">
          Atur komitmen menabung lebih dari Rp 0 untuk melihat proyeksi.
        </p>
      )}
    </div>
  )
}
