// Grocery PWA — Google Sheets sync
// Deploy: Extensions > Apps Script > paste this in Code.gs
// Then Deploy > New deployment > Web app
//   Execute as: Me
//   Who has access: Anyone
// Copy the Web App URL and paste it into the Grocery app's sync prompt.

const SHEET_NAME = 'Grocery';
const HEADERS = ['id', 'name', 'amount', 'store', 'price', 'category', 'bought'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function doGet(e) {
  const action = e.parameter.action || 'pull';
  const callback = e.parameter.callback;

  let result;
  if (action === 'pull') {
    result = { items: readItems_() };
  } else {
    result = { error: 'unknown action' };
  }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.parameter.payload);
    if (payload.action === 'push' && Array.isArray(payload.items)) {
      writeItems_(payload.items);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'bad payload' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readItems_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const rows = values.slice(1);
  return rows
    .filter(r => r[0] !== '' && r[0] !== null)
    .map(r => ({
      id: String(r[0]),
      name: String(r[1] || ''),
      amount: String(r[2] || ''),
      store: String(r[3] || ''),
      price: r[4] === '' || r[4] === null ? '' : String(r[4]),
      category: String(r[5] || ''),
      bought: r[6] === true || r[6] === 'true' || r[6] === 'TRUE'
    }));
}

function writeItems_(items) {
  const sheet = getSheet_();
  // Full overwrite: clear existing data rows, rewrite from the pushed list.
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
  }
  if (items.length === 0) return;
  const rows = items.map(i => [
    i.id || '',
    i.name || '',
    i.amount || '',
    i.store || '',
    i.price || '',
    i.category || '',
    !!i.bought
  ]);
  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
}
