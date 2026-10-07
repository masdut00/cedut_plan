import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  appendTransactionToSheet,
  deleteTransactionFromSheet,
  isSheetWriteEnabled,
} from './sheetWriteService'

const URL_ = 'https://script.google.com/macros/s/abc/exec'
const TX = {
  id: 'TX-1',
  tanggal: '2026-10-07',
  bulan: 'Oktober 2026',
  penabung: 'Mas',
  tipe: 'Setoran',
  kategori: 'Tabungan Rutin',
  nominal: 1500000,
  catatan: 'Gaji',
}

function mockResponse(body, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: vi.fn().mockResolvedValue(body) })
}

describe('sheetWriteService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SHEET_WRITE_URL', URL_)
    vi.stubEnv('VITE_SHEET_WRITE_TOKEN', 'rahasia')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('is enabled only when URL and token are configured', () => {
    expect(isSheetWriteEnabled()).toBe(true)
    vi.stubEnv('VITE_SHEET_WRITE_TOKEN', '')
    expect(isSheetWriteEnabled()).toBe(false)
  })

  it('posts append request as text/plain with token and created_at', async () => {
    mockResponse({ ok: true })
    await appendTransactionToSheet(TX)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe(URL_)
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('text/plain;charset=utf-8')
    const body = JSON.parse(init.body)
    expect(body).toMatchObject({ token: 'rahasia', action: 'append', transaction: TX })
    expect(body.transaction.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('posts delete request with id', async () => {
    mockResponse({ ok: true })
    await deleteTransactionFromSheet('TX-1')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ token: 'rahasia', action: 'delete', id: 'TX-1' })
  })

  it('throws the script error message when ok is false', async () => {
    mockResponse({ ok: false, error: 'Token tidak valid' })
    await expect(appendTransactionToSheet(TX)).rejects.toThrow('Token tidak valid')
  })

  it('throws on HTTP failure', async () => {
    mockResponse({}, false)
    await expect(appendTransactionToSheet(TX)).rejects.toThrow(/500/)
  })

  it('throws when not configured', async () => {
    vi.stubEnv('VITE_SHEET_WRITE_URL', '')
    global.fetch = vi.fn()
    await expect(appendTransactionToSheet(TX)).rejects.toThrow(/belum dikonfigurasi/)
    expect(fetch).not.toHaveBeenCalled()
  })
})
