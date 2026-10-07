/**
 * Mas & Cece Wedding Saving — jembatan tulis Google Sheet untuk dashboard web.
 *
 * Pasang: Google Sheet → Extensions → Apps Script → tempel file ini.
 * Project Settings → Script Properties → tambah WRITE_TOKEN = <token rahasia>.
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Panduan lengkap: DEPLOY.md bagian E.
 *
 * Request (POST, body JSON):
 *   { token, action: "append", transaction: { id, tanggal, bulan, penabung, tipe, kategori, nominal, catatan, created_at } }
 *   { token, action: "delete", id }
 * Response: { ok: true, ... } atau { ok: false, error }
 */

var SHEET_NAME = 'Transactions';
var HEADERS = ['id', 'tanggal', 'bulan', 'penabung', 'tipe', 'kategori', 'nominal', 'catatan', 'created_at'];
var PENABUNG = ['Mas', 'Cece', 'Bersama'];
var TIPE = ['Setoran', 'Pengeluaran'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var expected = PropertiesService.getScriptProperties().getProperty('WRITE_TOKEN');
    if (!expected) return reply_({ ok: false, error: 'WRITE_TOKEN belum diatur di Script Properties.' });
    if (body.token !== expected) return reply_({ ok: false, error: 'Token tidak valid.' });

    lock.waitLock(10000);
    var sheet = getSheet_();
    if (body.action === 'append') return reply_(appendRow_(sheet, body.transaction || {}));
    if (body.action === 'delete') return reply_(deleteRow_(sheet, String(body.id || '')));
    return reply_({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return reply_({ ok: false, error: String(err && err.message || err) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function doGet() {
  return reply_({ ok: true, message: 'Wedding Saving write API aktif.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function headerIndex_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  row.forEach(function (h, i) { map[String(h).trim().toLowerCase()] = i; });
  HEADERS.forEach(function (h) {
    if (!(h in map)) throw new Error('Kolom "' + h + '" tidak ada di baris 1 sheet ' + sheet.getName() + '.');
  });
  return { map: map, width: row.length };
}

// Cegah formula injection: teks yang diawali = + - @ ditulis sebagai teks biasa.
function safeText_(value, maxLen) {
  var s = String(value == null ? '' : value).trim().slice(0, maxLen || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function appendRow_(sheet, tx) {
  var nominal = Math.round(Number(tx.nominal));
  if (!(nominal > 0)) return { ok: false, error: 'Nominal harus lebih dari 0.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tx.tanggal || ''))) return { ok: false, error: 'Format tanggal harus YYYY-MM-DD.' };
  if (PENABUNG.indexOf(tx.penabung) < 0) return { ok: false, error: 'Penabung tidak valid.' };
  if (TIPE.indexOf(tx.tipe) < 0) return { ok: false, error: 'Tipe tidak valid.' };

  var id = safeText_(tx.id || 'TX-' + Date.now(), 50);
  var cols = headerIndex_(sheet);
  if (findRow_(sheet, cols, id) > 0) return { ok: true, id: id, duplicate: true };

  var values = {
    id: id,
    tanggal: tx.tanggal,
    bulan: safeText_(tx.bulan, 50),
    penabung: tx.penabung,
    tipe: tx.tipe,
    kategori: safeText_(tx.kategori || 'Tabungan Rutin', 100),
    nominal: nominal,
    catatan: safeText_(tx.catatan, 300),
    created_at: safeText_(tx.created_at || new Date().toISOString(), 40),
  };
  var row = new Array(cols.width).fill('');
  HEADERS.forEach(function (h) { row[cols.map[h]] = values[h]; });
  sheet.appendRow(row);
  return { ok: true, id: id };
}

function findRow_(sheet, cols, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || !id) return -1;
  var ids = sheet.getRange(2, cols.map.id + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) return i + 2;
  }
  return -1;
}

function deleteRow_(sheet, id) {
  if (!id) return { ok: false, error: 'id wajib diisi.' };
  var rowNumber = findRow_(sheet, headerIndex_(sheet), id);
  if (rowNumber < 0) return { ok: true, id: id, deleted: false };
  sheet.deleteRow(rowNumber);
  return { ok: true, id: id, deleted: true };
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
