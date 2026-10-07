import React, { useState } from 'react'
import { X } from 'lucide-react'
import { deriveMonthName, parseNominal } from '../services/googleSheetService'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyForm() {
  const tanggal = todayISO()
  return {
    tanggal,
    bulan: deriveMonthName(tanggal),
    penabung: 'Mas',
    tipe: 'Setoran',
    kategori: 'Tabungan Rutin',
    nominal: '',
    catatan: '',
  }
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-wedding-rose-200'

/**
 * AddTransactionModal is a quick-entry form for a new deposit or expense.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (transaction: Object) => void | Promise<void>
 * }} props
 *
 * If onSubmit rejects, the modal stays open and shows the error message.
 */
export default function AddTransactionModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const update = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'tanggal' ? { bulan: deriveMonthName(value) } : {}),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!/^(Rp\s*)?[\d.,\s]+$/i.test(form.nominal.trim())) {
      setError('Nominal harus berupa angka, mis. 1.500.000.')
      return
    }
    const nominal = parseNominal(form.nominal.replace(/\s/g, ''))
    if (nominal <= 0) {
      setError('Nominal harus lebih dari Rp 0.')
      return
    }
    if (!form.tanggal) {
      setError('Tanggal wajib diisi.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await onSubmit({
        id: `TX-${Date.now()}`,
        tanggal: form.tanggal,
        bulan: form.bulan || deriveMonthName(form.tanggal),
        penabung: form.penabung,
        tipe: form.tipe,
        kategori: form.kategori.trim() || 'Tabungan Rutin',
        nominal,
        catatan: form.catatan.trim(),
      })
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan transaksi.')
      return
    } finally {
      setSaving(false)
    }
    setForm(emptyForm())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tx-title"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-wedding-rose-100 p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-tx-title" className="text-base font-semibold text-slate-800">Tambah Transaksi</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-tanggal" className="block text-xs font-medium text-slate-600 mb-1">Tanggal</label>
              <input id="tx-tanggal" type="date" value={form.tanggal} onChange={update('tanggal')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="tx-bulan" className="block text-xs font-medium text-slate-600 mb-1">Bulan</label>
              <input id="tx-bulan" type="text" value={form.bulan} onChange={update('bulan')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="tx-penabung" className="block text-xs font-medium text-slate-600 mb-1">Penabung</label>
              <select id="tx-penabung" value={form.penabung} onChange={update('penabung')} className={inputClass}>
                <option value="Mas">Mas</option>
                <option value="Cece">Cece</option>
                <option value="Bersama">Bersama</option>
              </select>
            </div>
            <div>
              <label htmlFor="tx-tipe" className="block text-xs font-medium text-slate-600 mb-1">Tipe</label>
              <select id="tx-tipe" value={form.tipe} onChange={update('tipe')} className={inputClass}>
                <option value="Setoran">Setoran</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="tx-kategori" className="block text-xs font-medium text-slate-600 mb-1">Kategori</label>
            <input id="tx-kategori" type="text" value={form.kategori} onChange={update('kategori')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tx-nominal" className="block text-xs font-medium text-slate-600 mb-1">Nominal</label>
            <input
              id="tx-nominal"
              type="text"
              inputMode="numeric"
              placeholder="cth. 1.500.000"
              value={form.nominal}
              onChange={update('nominal')}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tx-catatan" className="block text-xs font-medium text-slate-600 mb-1">Catatan</label>
            <input id="tx-catatan" type="text" value={form.catatan} onChange={update('catatan')} className={inputClass} />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-wedding-rose-600 text-white hover:bg-wedding-rose-700 disabled:opacity-60 disabled:cursor-wait"
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
