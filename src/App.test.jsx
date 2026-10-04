import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from './App'

const SHEET_RESPONSE = `/*O_o*/
google.visualization.Query.setResponse({
  "status": "ok",
  "table": {
    "cols": [
      {"label": "id"}, {"label": "tanggal"}, {"label": "bulan"},
      {"label": "penabung"}, {"label": "tipe"}, {"label": "kategori"},
      {"label": "nominal"}, {"label": "catatan"}
    ],
    "rows": [
      {"c": [{"v": "TX-S1"}, {"v": "2026-06-01"}, {"v": "Juni 2026"}, {"v": "Mas"}, {"v": "Setoran"}, {"v": "Tabungan Rutin"}, {"v": 40000000}, {"v": "Setoran dari sheet"}]},
      {"c": [{"v": "TX-S2"}, {"v": "2026-06-02"}, {"v": "Juni 2026"}, {"v": "Cece"}, {"v": "Setoran"}, {"v": "Tabungan Rutin"}, {"v": 20000000}, {"v": "Setoran Cece sheet"}]}
    ]
  }
});`

function mockFetchSuccess() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: vi.fn().mockResolvedValue(SHEET_RESPONSE),
  })
}

function mockFetchFailure() {
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'))
}

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders welcoming header for Mas & Cece Wedding Saving', async () => {
    mockFetchSuccess()
    render(<App />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Mas & Cece Wedding Saving/i)
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))
  })

  it('renders target badge with 100.000.000', async () => {
    mockFetchSuccess()
    render(<App />)
    expect(screen.getByText(/Target: Rp 100\.000\.000/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))
  })

  it('fetches Google Sheet on mount and shows Live data', async () => {
    mockFetchSuccess()
    render(<App />)

    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Setoran dari sheet')).toBeInTheDocument()
    // 60 Jt terkumpul
    expect(screen.getAllByText('Rp 60.000.000').length).toBeGreaterThan(0)
  })

  it('falls back to offline cache when sheet fetch fails', async () => {
    mockFetchFailure()
    render(<App />)

    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Offline Cache'))
    // initial mock data shown
    expect(screen.getByText('Down payment booking venue gedung')).toBeInTheDocument()
  })

  it('re-syncs when sync button clicked', async () => {
    mockFetchFailure()
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Offline Cache'))

    mockFetchSuccess()
    fireEvent.click(screen.getByRole('button', { name: /Sinkronkan/i }))
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))
    expect(screen.getByText('Setoran dari sheet')).toBeInTheDocument()
  })

  it('renders all dashboard sections', async () => {
    mockFetchSuccess()
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))

    expect(screen.getByText('Target Tabungan')).toBeInTheDocument()
    expect(screen.getByText('Split Kontribusi Tabungan')).toBeInTheDocument()
    expect(screen.getByText('Simulasi Waktu Pernikahan')).toBeInTheDocument()
    expect(screen.getByText('Pertumbuhan Tabungan')).toBeInTheDocument()
    expect(screen.getByText('Riwayat Transaksi')).toBeInTheDocument()
  })

  it('adds and deletes a transaction locally and persists to localStorage', async () => {
    mockFetchSuccess()
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))

    fireEvent.click(screen.getByRole('button', { name: /Tambah Transaksi/i }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nominal'), { target: { value: '1000000' } })
    fireEvent.change(within(dialog).getByLabelText('Catatan'), { target: { value: 'Setoran manual web' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Simpan/i }))

    expect(screen.getByText('Setoran manual web')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('wedding_transactions'))).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: /Hapus transaksi Setoran manual web/i }))
    expect(screen.queryByText('Setoran manual web')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('wedding_transactions'))).toHaveLength(2)
  })
})
