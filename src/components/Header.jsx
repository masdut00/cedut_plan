import React, { useRef } from 'react'
import { Download, Heart, RefreshCw, Sparkles, Upload, Wifi, WifiOff } from 'lucide-react'
import { formatRupiah } from '../utils/formatters'

const STATUS_STYLES = {
  loading: { label: 'Menyinkronkan...', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
  live: { label: 'Live', className: 'bg-wedding-sage-50 text-wedding-sage-600 border-wedding-sage-200', icon: Wifi },
  cached: { label: 'Offline Cache', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: WifiOff },
}

const iconButtonClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-60'

/**
 * Header shows the app title, target badge, Google Sheet sync control & status,
 * and JSON backup export/import actions.
 *
 * @param {{
 *   targetAmount?: number,
 *   syncStatus?: 'loading' | 'live' | 'cached',
 *   lastSync?: Date | null,
 *   onSync?: () => void,
 *   onExport?: () => void,
 *   onImport?: (file: File) => void
 * }} props
 */
export default function Header({
  targetAmount = 100000000,
  syncStatus = 'cached',
  lastSync = null,
  onSync,
  onExport,
  onImport,
}) {
  const fileInputRef = useRef(null)
  const status = STATUS_STYLES[syncStatus] ?? STATUS_STYLES.cached
  const StatusIcon = status.icon
  const isSyncing = syncStatus === 'loading'

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onImport) onImport(file)
    e.target.value = ''
  }

  return (
    <header className="border-b border-wedding-rose-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-wedding-rose-100 flex items-center justify-center text-wedding-rose-600 shadow-inner shrink-0">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold font-serif-wedding text-slate-900 tracking-tight flex items-center gap-2">
              Mas & Cece Wedding Saving
              <Sparkles className="w-4 h-4 text-wedding-gold-500 inline" />
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-wedding-rose-50 text-wedding-rose-700 border border-wedding-rose-200">
                Target: {formatRupiah(targetAmount)}
              </span>
              <span
                data-testid="sync-status"
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${status.className}`}
                title={lastSync ? `Sinkron terakhir: ${lastSync.toLocaleString('id-ID')}` : undefined}
              >
                <StatusIcon className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className={`${iconButtonClass} bg-wedding-sage-500 text-white border-wedding-sage-500 hover:bg-wedding-sage-600`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Sinkronkan Google Sheets
          </button>
          <button
            type="button"
            onClick={onExport}
            className={`${iconButtonClass} bg-white text-slate-600 border-slate-200 hover:bg-slate-50`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${iconButtonClass} bg-white text-slate-600 border-slate-200 hover:bg-slate-50`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
            data-testid="import-input"
          />
        </div>
      </div>
    </header>
  )
}
