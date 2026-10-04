import React, { useMemo, useState } from 'react'
import { ListOrdered, Plus, Search, Trash2 } from 'lucide-react'
import { formatDate, formatRupiah } from '../utils/formatters'

const FILTERS = ['Semua', 'Mas', 'Cece', 'Pengeluaran']

const PENABUNG_BADGE = {
  Mas: 'bg-slate-100 text-slate-700 border-slate-200',
  Cece: 'bg-wedding-rose-50 text-wedding-rose-700 border-wedding-rose-200',
  Bersama: 'bg-wedding-gold-50 text-wedding-gold-700 border-wedding-gold-200',
}

function matchesFilter(t, filter) {
  if (filter === 'Pengeluaran') return t.tipe === 'Pengeluaran'
  if (filter === 'Mas' || filter === 'Cece') return t.penabung === filter
  return true
}

function matchesSearch(t, query) {
  if (!query) return true
  const haystack = `${t.catatan ?? ''} ${t.kategori ?? ''} ${t.bulan ?? ''}`.toLowerCase()
  return haystack.includes(query)
}

/**
 * TransactionHistory shows a filterable, searchable list of transactions (newest first).
 *
 * @param {{
 *   transactions?: Array,
 *   onDelete?: (id: string) => void,
 *   onAddClick?: () => void
 * }} props
 */
export default function TransactionHistory({ transactions = [], onDelete, onAddClick }) {
  const [filter, setFilter] = useState('Semua')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...transactions]
      .filter((t) => t && matchesFilter(t, filter) && matchesSearch(t, query))
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
  }, [transactions, filter, search])

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-wedding-rose-100/70 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-wedding-rose-100 text-wedding-rose-600 flex items-center justify-center">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">Riwayat Transaksi</h3>
            <p className="text-xs text-slate-500">{visible.length} dari {transactions.length} transaksi</p>
          </div>
        </div>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-wedding-rose-600 text-white text-sm font-medium hover:bg-wedding-rose-700 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah Transaksi
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari catatan atau kategori..."
            aria-label="Cari transaksi"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-rose-200"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Tidak ada transaksi yang cocok.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((t) => {
            const isExpense = t.tipe === 'Pengeluaran'
            return (
              <li key={t.id} data-testid="tx-row" className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PENABUNG_BADGE[t.penabung] ?? PENABUNG_BADGE.Bersama}`}>
                      {t.penabung}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isExpense ? 'bg-red-50 text-red-600' : 'bg-wedding-sage-50 text-wedding-sage-600'}`}>
                      {t.tipe}
                    </span>
                    <span className="text-[11px] text-slate-400">{t.kategori}</span>
                  </div>
                  <p className="text-sm text-slate-700 truncate">{t.catatan || '-'}</p>
                  <p className="text-[11px] text-slate-400">{formatDate(t.tanggal)}</p>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${isExpense ? 'text-red-600' : 'text-wedding-sage-600'}`}>
                  {isExpense ? '-' : '+'}{formatRupiah(t.nominal)}
                </span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(t.id)}
                    aria-label={`Hapus transaksi ${t.catatan || t.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
