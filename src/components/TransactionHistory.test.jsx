import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TransactionHistory from './TransactionHistory'
import AddTransactionModal from './AddTransactionModal'
import MonthlyChart from './MonthlyChart'

const TRANSACTIONS = [
  { id: 'TX-1', tanggal: '2026-01-10', bulan: 'Januari 2026', penabung: 'Mas', tipe: 'Setoran', kategori: 'Tabungan Rutin', nominal: 3500000, catatan: 'Gaji Januari Mas' },
  { id: 'TX-2', tanggal: '2026-01-12', bulan: 'Januari 2026', penabung: 'Cece', tipe: 'Setoran', kategori: 'Tabungan Rutin', nominal: 3000000, catatan: 'Gaji Januari Cece' },
  { id: 'TX-3', tanggal: '2026-03-25', bulan: 'Maret 2026', penabung: 'Mas', tipe: 'Setoran', kategori: 'Bonus & Freelance', nominal: 5000000, catatan: 'Bonus project freelance' },
  { id: 'TX-4', tanggal: '2026-04-05', bulan: 'April 2026', penabung: 'Bersama', tipe: 'Pengeluaran', kategori: 'DP Gedung', nominal: 5000000, catatan: 'Booking venue gedung' },
]

const rows = () => screen.getAllByTestId('tx-row')

describe('TransactionHistory Component', () => {
  it('renders all transactions sorted newest first', () => {
    render(<TransactionHistory transactions={TRANSACTIONS} />)
    const list = rows()
    expect(list).toHaveLength(4)
    expect(list[0]).toHaveTextContent('Booking venue gedung')
    expect(list[3]).toHaveTextContent('Gaji Januari Mas')
  })

  it('filters by Mas', () => {
    render(<TransactionHistory transactions={TRANSACTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mas' }))
    const list = rows()
    expect(list).toHaveLength(2)
    list.forEach((r) => expect(r).toHaveTextContent('Mas'))
  })

  it('filters by Cece', () => {
    render(<TransactionHistory transactions={TRANSACTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cece' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Gaji Januari Cece')
  })

  it('filters by Pengeluaran', () => {
    render(<TransactionHistory transactions={TRANSACTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pengeluaran' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('DP Gedung')
  })

  it('searches catatan and kategori case-insensitively', () => {
    render(<TransactionHistory transactions={TRANSACTIONS} />)
    const search = screen.getByPlaceholderText(/Cari catatan/i)

    fireEvent.change(search, { target: { value: 'FREELANCE' } })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Rp 5.000.000')

    fireEvent.change(search, { target: { value: 'tabungan rutin' } })
    expect(rows()).toHaveLength(2)
  })

  it('combines filter and search, and shows empty state', () => {
    render(<TransactionHistory transactions={TRANSACTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cece' }))
    fireEvent.change(screen.getByPlaceholderText(/Cari catatan/i), { target: { value: 'venue' } })
    expect(screen.queryAllByTestId('tx-row')).toHaveLength(0)
    expect(screen.getByText(/Tidak ada transaksi/i)).toBeInTheDocument()
  })

  it('calls onDelete with transaction id', () => {
    const onDelete = vi.fn()
    render(<TransactionHistory transactions={TRANSACTIONS} onDelete={onDelete} />)
    const first = rows()[0]
    fireEvent.click(within(first).getByRole('button', { name: /Hapus/i }))
    expect(onDelete).toHaveBeenCalledWith('TX-4')
  })

  it('calls onAddClick when tambah button pressed', () => {
    const onAddClick = vi.fn()
    render(<TransactionHistory transactions={TRANSACTIONS} onAddClick={onAddClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Tambah Transaksi/i }))
    expect(onAddClick).toHaveBeenCalled()
  })
})

describe('AddTransactionModal Component', () => {
  it('renders nothing when closed', () => {
    render(<AddTransactionModal isOpen={false} onClose={() => {}} onSubmit={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('submits a new transaction with derived bulan', () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(<AddTransactionModal isOpen onClose={onClose} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Tanggal'), { target: { value: '2026-05-20' } })
    fireEvent.change(screen.getByLabelText('Penabung'), { target: { value: 'Cece' } })
    fireEvent.change(screen.getByLabelText('Tipe'), { target: { value: 'Setoran' } })
    fireEvent.change(screen.getByLabelText('Nominal'), { target: { value: '1.500.000' } })
    fireEvent.change(screen.getByLabelText('Catatan'), { target: { value: 'Setor gaji' } })
    fireEvent.click(screen.getByRole('button', { name: /Simpan/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const tx = onSubmit.mock.calls[0][0]
    expect(tx).toMatchObject({
      tanggal: '2026-05-20',
      bulan: 'Mei 2026',
      penabung: 'Cece',
      tipe: 'Setoran',
      nominal: 1500000,
      catatan: 'Setor gaji',
    })
    expect(tx.id).toBeTruthy()
    expect(onClose).toHaveBeenCalled()
  })

  it('rejects zero nominal', () => {
    const onSubmit = vi.fn()
    render(<AddTransactionModal isOpen onClose={() => {}} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Nominal'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /Simpan/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/Nominal/i)
  })
})

describe('MonthlyChart Component', () => {
  it('renders one bar per month with cumulative values', () => {
    render(<MonthlyChart transactions={TRANSACTIONS} />)
    const bars = screen.getAllByTestId('chart-bar')
    expect(bars).toHaveLength(3) // Jan, Mar, Apr
    expect(bars[2]).toHaveAttribute('aria-label', expect.stringContaining('Rp 6.500.000'))
  })

  it('shows empty state without transactions', () => {
    render(<MonthlyChart transactions={[]} />)
    expect(screen.getByText(/Belum ada data/i)).toBeInTheDocument()
  })
})
