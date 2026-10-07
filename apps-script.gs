// Romeinse Muntenregen: gedeelde ranglijst in Google Sheets.
// Plakken in een nieuw project op script.new. Implementeren als web-app, toegang: Iedereen.
const SPREADSHEET_ID = '1lo2XvyUwAj6oH1k-ChPOuHCjQWfewxm0mPQsD610LHs';
const SHEET_NAME = 'Scores';

function sheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Naam', 'Score', 'Datum']);
  }
  return sh;
}

function top_() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const best = {};
  rows.forEach(function (r) {
    const name = String(r[0]).replace(/^'/, '').trim();
    const score = Number(r[1]);
    if (!name || !(score > 0)) return;
    const key = name.toLowerCase();
    if (!best[key] || score > best[key].score) best[key] = { name: name, score: score };
  });
  return Object.keys(best).map(function (k) { return best[k]; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 3);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ top: top_() });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
  let name = String(data.name || '').trim().slice(0, 16);
  const score = Math.floor(Number(data.score));
  if (!name || !(score >= 1 && score <= 100000)) return json_({ ok: false, error: 'invalid' });
  if (/^[=+\-@]/.test(name)) name = "'" + name; // no formulas
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try { sheet_().appendRow([name, score, new Date()]); } finally { lock.releaseLock(); }
  return json_({ ok: true, top: top_() });
}
