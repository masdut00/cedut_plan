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
    expect(screen.getByRole('status')).toHaveTextContent(/tertimpa saat sinkronisasi/i)
    expect(JSON.parse(localStorage.getItem('wedding_transactions'))).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: /Hapus transaksi Setoran manual web/i }))
    expect(screen.queryByText('Setoran manual web')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('wedding_transactions'))).toHaveLength(2)
  })

  it('clears offline notice after a successful re-sync', async () => {
    mockFetchFailure()
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Offline Cache'))
    expect(screen.getByRole('status')).toBeInTheDocument()

    mockFetchSuccess()
    fireEvent.click(screen.getByRole('button', { name: /Sinkronkan/i }))
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  describe('with Google Sheet write enabled', () => {
    const SCRIPT_URL = 'https://script.google.com/macros/s/test/exec'

    function mockSheetAndScript(scriptBody) {
      global.fetch = vi.fn((url) => {
        if (url === SCRIPT_URL) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(scriptBody) })
        }
        return Promise.resolve({ ok: true, text: () => Promise.resolve(SHEET_RESPONSE) })
      })
    }

    function scriptCalls() {
      return fetch.mock.calls.filter(([url]) => url === SCRIPT_URL).map(([, init]) => JSON.parse(init.body))
    }

    async function addViaModal(catatan) {
      fireEvent.click(screen.getByRole('button', { name: /Tambah Transaksi/i }))
      const dialog = screen.getByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Nominal'), { target: { value: '1000000' } })
      fireEvent.change(within(dialog).getByLabelText('Catatan'), { target: { value: catatan } })
      fireEvent.click(within(dialog).getByRole('button', { name: /Simpan/i }))
    }

    beforeEach(() => {
      vi.stubEnv('VITE_SHEET_WRITE_URL', SCRIPT_URL)
      vi.stubEnv('VITE_SHEET_WRITE_TOKEN', 'rahasia')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('saves a new transaction to the Sheet and shows it', async () => {
      mockSheetAndScript({ ok: true })
      render(<App />)
      await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))

      await addViaModal('Setoran ke sheet')

      expect(await screen.findByText('Setoran ke sheet')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/tersimpan ke Google Sheet/i)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      const [call] = scriptCalls()
      expect(call).toMatchObject({ action: 'append', token: 'rahasia', transaction: { catatan: 'Setoran ke sheet', nominal: 1000000 } })
    })

    it('keeps the modal open with the error when the Sheet rejects', async () => {
      mockSheetAndScript({ ok: false, error: 'Token tidak valid' })
      render(<App />)
      await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))

      await addViaModal('Gagal simpan')

      expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Token tidak valid')
      expect(screen.queryByText('Gagal simpan')).not.toBeInTheDocument()
    })

    it('deletes from the Sheet after confirmation', async () => {
      mockSheetAndScript({ ok: true })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      render(<App />)
      await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))

      fireEvent.click(screen.getByRole('button', { name: /Hapus transaksi Setoran Cece sheet/i }))

      await waitFor(() => expect(screen.queryByText('Setoran Cece sheet')).not.toBeInTheDocument())
      expect(scriptCalls()).toEqual([{ token: 'rahasia', action: 'delete', id: 'TX-S2' }])
    })

    it('does nothing when delete is cancelled', async () => {
      mockSheetAndScript({ ok: true })
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      render(<App />)
      await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Live'))

      fireEvent.click(screen.getByRole('button', { name: /Hapus transaksi Setoran Cece sheet/i }))

      expect(screen.getByText('Setoran Cece sheet')).toBeInTheDocument()
      expect(scriptCalls()).toHaveLength(0)
    })
  })
})
