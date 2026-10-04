import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import MetricCards from './components/MetricCards'
import WeddingProgressBar from './components/WeddingProgressBar'
import ContributionSplit from './components/ContributionSplit'
import SavingsSimulator from './components/SavingsSimulator'
import MonthlyChart from './components/MonthlyChart'
import TransactionHistory from './components/TransactionHistory'
import AddTransactionModal from './components/AddTransactionModal'
import { calculateSummary } from './utils/calculations'
import { fetchSheetTransactions } from './services/googleSheetService'
import {
  exportTransactionsJSON,
  importTransactionsJSON,
  loadStoredTarget,
  loadStoredTransactions,
  saveStoredTransactions,
} from './services/storageService'
import { DEFAULT_SHEET_ID } from './data/initialData'

export default function App() {
  const [transactions, setTransactions] = useState(() => loadStoredTransactions())
  const [targetAmount] = useState(() => loadStoredTarget())
  const [syncStatus, setSyncStatus] = useState('loading')
  const [lastSync, setLastSync] = useState(null)
  const [notice, setNotice] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const mountedRef = useRef(true)

  const summary = useMemo(
    () => calculateSummary(transactions, targetAmount),
    [transactions, targetAmount]
  )

  const syncFromSheet = useCallback(async () => {
    setSyncStatus('loading')
    try {
      const data = await fetchSheetTransactions(DEFAULT_SHEET_ID, '0', { fallbackToStorage: false })
      if (!mountedRef.current) return
      if (data.length > 0) {
        setTransactions(data)
        setSyncStatus('live')
        setLastSync(new Date())
        return
      }
      setTransactions(loadStoredTransactions())
      setSyncStatus('cached')
      setNotice({ type: 'info', text: 'Google Sheet masih kosong, menampilkan data cache lokal.' })
    } catch (err) {
      if (!mountedRef.current) return
      console.warn('Sinkronisasi Google Sheet gagal:', err)
      setTransactions(loadStoredTransactions())
      setSyncStatus('cached')
      setNotice({ type: 'info', text: 'Tidak dapat terhubung ke Google Sheet. Menampilkan data cache offline.' })
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    syncFromSheet()
    return () => {
      mountedRef.current = false
    }
  }, [syncFromSheet])

  const updateTransactions = (next) => {
    setTransactions(next)
    saveStoredTransactions(next)
  }

  const handleAdd = (tx) => updateTransactions([...transactions, tx])

  const handleDelete = (id) => updateTransactions(transactions.filter((t) => t.id !== id))

  const handleExport = () => {
    const blob = new Blob([exportTransactionsJSON(transactions)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wedding-saving-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file) => {
    try {
      const imported = importTransactionsJSON(await file.text())
      updateTransactions(imported)
      setNotice({ type: 'success', text: `${imported.length} transaksi berhasil diimpor.` })
    } catch (err) {
      setNotice({ type: 'error', text: `Gagal impor: ${err.message}` })
    }
  }

  const noticeStyles = {
    info: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-wedding-sage-50 text-wedding-sage-600 border-wedding-sage-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-rose-50 via-slate-50 to-wedding-gold-50 text-slate-800">
      <Header
        targetAmount={targetAmount}
        syncStatus={syncStatus}
        lastSync={lastSync}
        onSync={syncFromSheet}
        onExport={handleExport}
        onImport={handleImport}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {notice && (
          <div
            role="status"
            className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${noticeStyles[notice.type]}`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Tutup pemberitahuan"
              className="text-xs font-medium opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        <MetricCards summary={summary} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeddingProgressBar summary={summary} />
          <ContributionSplit summary={summary} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SavingsSimulator remaining={summary.remaining} />
          <MonthlyChart transactions={transactions} targetAmount={targetAmount} />
        </div>

        <TransactionHistory
          transactions={transactions}
          onDelete={handleDelete}
          onAddClick={() => setIsModalOpen(true)}
        />
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  )
}
