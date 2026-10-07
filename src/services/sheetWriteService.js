/**
 * Writes transactions to the Google Sheet through a Google Apps Script Web App
 * (see apps-script/Code.gs). Configured at build time via
 * VITE_SHEET_WRITE_URL and VITE_SHEET_WRITE_TOKEN.
 */

function getConfig() {
  return {
    url: import.meta.env.VITE_SHEET_WRITE_URL || '',
    token: import.meta.env.VITE_SHEET_WRITE_TOKEN || '',
  }
}

/**
 * @returns {boolean} true when the Apps Script URL and token are configured.
 */
export function isSheetWriteEnabled() {
  const { url, token } = getConfig()
  return Boolean(url && token)
}

async function postToScript(payload) {
  const { url, token } = getConfig()
  if (!url || !token) {
    throw new Error('Penyimpanan ke Google Sheet belum dikonfigurasi.')
  }

  // text/plain avoids a CORS preflight, which Apps Script cannot answer.
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token, ...payload }),
  })
  if (!response.ok) {
    throw new Error(`Google Sheet menolak permintaan (HTTP ${response.status}).`)
  }

  const result = await response.json()
  if (!result || result.ok !== true) {
    throw new Error(result?.error || 'Google Sheet tidak menyimpan transaksi.')
  }
  return result
}

/**
 * Appends a transaction as a new row in the Transactions sheet.
 *
 * @param {Object} transaction
 * @returns {Promise<Object>} script response
 */
export function appendTransactionToSheet(transaction) {
  return postToScript({
    action: 'append',
    transaction: { ...transaction, created_at: new Date().toISOString() },
  })
}

/**
 * Deletes the row whose id column matches.
 *
 * @param {string} id
 * @returns {Promise<Object>} script response
 */
export function deleteTransactionFromSheet(id) {
  return postToScript({ action: 'delete', id })
}
