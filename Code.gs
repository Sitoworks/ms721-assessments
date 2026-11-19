/**
 * MS-721 assessment backend (Google Apps Script bound to your Google Sheet).
 *
 *  - Learners' pages POST each signed result here; it is added to the "Results" tab.
 *  - The trainer console signs in with TRAINER_PASSWORD to read results and change controls.
 *  - Controls (open/close, explanations, retakes, benchmark) live in the "Settings" tab.
 *
 * Setup: see README.md. Deploy as a Web app: Execute as = Me, Who has access = Anyone.
 */

// ====== EDIT THIS BEFORE DEPLOYING ======
const TRAINER_PASSWORD = "CHANGE-ME-BEFORE-DEPLOYING";   // choose a long password; only you need to know it
// ========================================

const SECRET = "ms721-result-v1";          // must match the learner page; do not change
const RESULTS = "Results", SETTINGS = "Settings";
const HEADER = ["Received","Name","Learner ID","Assessment","Submitted","Points","Max","Percent","Unanswered","Seconds","Result code"];
const DEFAULTS = { preOpen: true, postOpen: true, showExplanations: true, allowRetake: false, benchmark: 70 };

// ---------- helpers ----------
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function page_(m) { return HtmlService.createHtmlOutput('<p style="font:18px sans-serif;padding:24px">' + m + '</p>'); }
const clean_ = v => /^[=+\-@\t\r]/.test(String(v)) ? "'" + v : v;   // blocks spreadsheet formula injection

function decode_(code) {
  const p = String(code || "").trim().split(".");
  if (p.length !== 3 || p[0] !== "MS721") return { error: "Invalid code" };
  const sig = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, p[1] + SECRET)
    .map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("").slice(0, 10);
  if (sig !== p[2]) return { error: "Signature check failed" };
  let o;
  try { o = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(p[1] + "====".slice(p[1].length % 4 || 4))).getDataAsString()); }
  catch (e) { return { error: "Could not read code" }; }
  if ((o.t !== "pre" && o.t !== "post") || typeof o.n !== "string" || !o.n.trim() || o.n.length > 80) return { error: "Invalid result" };
  if (!(o.m > 0) || !(o.p >= 0 && o.p <= o.m) || isNaN(Date.parse(o.s))) return { error: "Invalid result" };
  return { code: String(code).trim(), o: o };
}

function resultsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(RESULTS) || ss.insertSheet(RESULTS);
  if (sh.getLastRow() === 0) sh.appendRow(HEADER);
  return sh;
}

function record_(code) {
  const d = decode_(code);
  if (d.error) return d;
  const o = d.o, sh = resultsSheet_(), lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const seen = sh.getLastRow() > 1 ? sh.getRange(2, 11, sh.getLastRow() - 1, 1).getValues().flat() : [];
    if (seen.indexOf(d.code) < 0)
      sh.appendRow([new Date(), clean_(o.n), clean_(o.i || ""), o.t, o.s, o.p, o.m, Math.round(o.p / o.m * 1000) / 10, o.u, o.d, d.code]);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function getConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS);
    sh.appendRow(["Setting", "Value"]);
    Object.keys(DEFAULTS).forEach(k => sh.appendRow([k, DEFAULTS[k]]));
    sh.getRange("A1:B1").setFontWeight("bold");
  }
  const cfg = Object.assign({}, DEFAULTS);
  sh.getDataRange().getValues().slice(1).forEach(r => {
    const k = String(r[0]).trim();
    if (!(k in DEFAULTS)) return;
    if (typeof DEFAULTS[k] === "boolean") cfg[k] = (r[1] === true || String(r[1]).toUpperCase() === "TRUE");
    else { const n = Number(r[1]); if (n >= 0 && n <= 100) cfg[k] = n; }
  });
  return cfg;
}

function setConfig_(c) {
  const cfg = Object.assign(getConfig_(), {});
  Object.keys(DEFAULTS).forEach(k => {
    if (!(k in c)) return;
    if (typeof DEFAULTS[k] === "boolean") { if (typeof c[k] === "boolean") cfg[k] = c[k]; }
    else { const n = Number(c[k]); if (n >= 0 && n <= 100) cfg[k] = n; }
  });
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS);
  sh.clear();
  sh.appendRow(["Setting", "Value"]);
  Object.keys(DEFAULTS).forEach(k => sh.appendRow([k, cfg[k]]));
  sh.getRange("A1:B1").setFontWeight("bold");
  return cfg;
}

// Password check with throttling: 1 second delay per wrong guess, 20 wrong guesses lock sign-in for 10 minutes.
function checkKey_(key) {
  if (!TRAINER_PASSWORD || TRAINER_PASSWORD === "CHANGE-ME-BEFORE-DEPLOYING")
    return "The trainer password has not been set in Code.gs yet.";
  const cache = CacheService.getScriptCache(), fails = Number(cache.get("fails") || 0);
  if (fails >= 20) return "Too many wrong passwords. Sign-in is locked for 10 minutes.";
  if (typeof key === "string" && key === TRAINER_PASSWORD) { cache.remove("fails"); return null; }
  cache.put("fails", String(fails + 1), 600);
  Utilities.sleep(1000);
  return "Wrong password.";
}

// ---------- web app entry points ----------
function doPost(e) {
  let b;
  try { b = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) { return json_({ ok: false, error: "Bad request" }); }
  switch (b.action) {
    case "submit": {
      const r = record_(b.code);
      return json_(r.error ? { ok: false, error: r.error } : { ok: true });
    }
    case "results": {
      const bad = checkKey_(b.key);
      if (bad) return json_({ ok: false, error: bad });
      const sh = resultsSheet_();
      const codes = sh.getLastRow() > 1 ? sh.getRange(2, 11, sh.getLastRow() - 1, 1).getValues().flat().filter(String) : [];
      return json_({ ok: true, codes: codes, config: getConfig_() });
    }
    case "setconfig": {
      const bad = checkKey_(b.key);
      if (bad) return json_({ ok: false, error: bad });
      return json_({ ok: true, config: setConfig_(b.config || {}) });
    }
    default: return json_({ ok: false, error: "Unknown action" });
  }
}

function doGet(e) {
  const prm = (e && e.parameter) || {};
  if (prm.action === "config") return json_({ ok: true, config: getConfig_() });   // public: only open/closed flags
  if (prm.code !== undefined) {                                                    // fallback link used by the learner page
    const r = record_(prm.code);
    return page_(r.error ? r.error : "Result recorded. You can close this tab.");
  }
  return page_("MS-721 results service is running.");
}
