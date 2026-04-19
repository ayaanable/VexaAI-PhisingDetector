/* app.js */
const API = '';
let blocked = 0, safe = 0, total = 0;

const DEMO_PHISH = `Dear valued customer,

We have detected suspicious activity on your account. Your access has been temporarily suspended.

To restore your account, please verify your details immediately:
http://paypa1-secure-login.xyz/verify?token=abc123

Failure to act within 24 hours will result in permanent account closure.

Account Security Team`;

const DEMO_SAFE = `Hi team,

Just a reminder that our Q3 review meeting is scheduled for Thursday at 2pm in Conference Room B.

Please bring your department reports. The agenda has been shared on Google Drive.

Regards,
Sarah`;

window.addEventListener('load', checkStatus);

async function checkStatus() {
  const badge = document.getElementById('modelBadge');
  const dot   = document.getElementById('pulseDot');
  try {
    const r = await fetch(`${API}/api/status`);
    const d = await r.json();
    if (d.model_loaded) {
      badge.textContent = 'Model ready';
      badge.className   = 'badge ok';
      dot.style.background = 'var(--green)';
    } else {
      badge.textContent = 'model.pkl missing';
      badge.className   = 'badge error';
      dot.style.background = 'var(--red)';
    }
  } catch {
    badge.textContent = 'Server offline';
    badge.className   = 'badge error';
    dot.style.background = 'var(--red)';
  }
}

async function startScan() {
  const text = document.getElementById('scanInput').value.trim();
  if (!text) { document.getElementById('scanInput').focus(); return; }

  const btn = document.getElementById('scanBtn');
  btn.disabled = true;
  hide('resultCard'); hide('errorCard');
  show('scanningCard');

  try {
    const res  = await fetch(`${API}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    hide('scanningCard');

    if (data.error) {
      showError(data.error);
      if (window.glThreat) window.glThreat.target = 0.5;
    } else {
      renderResult(data, text);
      updateStats(data.label);
      addLog(text, data);
    }
  } catch {
    hide('scanningCard');
    showError('Cannot reach Flask server.\nMake sure app.py is running:\n\n  python app.py');
    if (window.glThreat) window.glThreat.target = 0.35;
  }
  btn.disabled = false;
}

function renderResult(data, inputText) {
  const isPhish = data.label === 'phishing';
  const score   = typeof data.score === 'number' ? data.score : 0.5;
  const pct     = Math.round(score * 100);
  const conf    = data.confidence ? data.confidence.toFixed(1) : (Math.round(Math.max(score, 1 - score) * 1000) / 10).toFixed(1);

  const card = document.getElementById('resultCard');
  card.className = 'result-card ' + (isPhish ? 'phishing' : 'safe');

  const icon = document.getElementById('resultIcon');
  icon.className = 'result-icon ' + (isPhish ? 'phishing' : 'safe');
  icon.innerHTML = isPhish
    ? `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F09595" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    : `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7DCFA8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/><polyline points="9 12 11 14 15 10"/></svg>`;

  document.getElementById('resultTitle').className = 'result-title ' + (isPhish ? 'phishing' : 'safe');
  document.getElementById('resultTitle').textContent = isPhish
    ? `Phishing detected — ${conf}% model confidence`
    : `Safe — ${conf}% model confidence`;

  document.getElementById('resultMeta').textContent =
    `label: ${data.label}  |  score: ${score.toFixed(4)}  |  model: MultinomialNB + TF-IDF`;

  document.getElementById('resultBadge').className   = 'result-badge ' + (isPhish ? 'phishing' : 'safe');
  document.getElementById('resultBadge').textContent  = pct + '%';

  const bar   = document.getElementById('confBar');
  const thumb = document.getElementById('confThumb');
  bar.className   = 'conf-bar ' + (isPhish ? 'phishing' : 'safe');
  bar.style.width = pct + '%';
  thumb.style.left= pct + '%';
  document.getElementById('confPct').textContent =
    `Safe ${100 - pct}%  ←  confidence  →  Phishing ${pct}%`;

  const indEl   = document.getElementById('indicators');
  const indWrap = document.getElementById('indicatorsWrap');
  if (data.indicators && data.indicators.length) {
    indEl.innerHTML = '';
    data.indicators.forEach(ind => {
      const tag = document.createElement('span');
      tag.className = 'tag ' + (isPhish ? 'red' : 'green');
      tag.textContent = ind;
      indEl.appendChild(tag);
    });
    show('indicatorsWrap');
  } else {
    hide('indicatorsWrap');
  }

  show('resultCard');
  if (window.glThreat) window.glThreat.target = isPhish ? 1.0 : 0.0;
  if (window.glSafe)   window.glSafe.target   = isPhish ? 0.0 : 1.0;
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  show('errorCard');
}

function updateStats(label) {
  total++;
  if (label === 'phishing') blocked++; else safe++;
  document.getElementById('statBlocked').textContent = blocked.toLocaleString();
  document.getElementById('statSafe').textContent    = safe.toLocaleString();
  document.getElementById('statTotal').textContent   = total.toLocaleString();
}

function addLog(text, data) {
  const log = document.getElementById('scanLog');
  const empty = log.querySelector('.log-empty');
  if (empty) empty.remove();

  const isPhish = data.label === 'phishing';
  const pct     = typeof data.score === 'number' ? Math.round(data.score * 100) : '?';
  const preview = text.replace(/\s+/g, ' ').slice(0, 55) + (text.length > 55 ? '…' : '');
  const time    = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const row = document.createElement('div');
  row.className = 'log-row';
  row.innerHTML = `
    <div class="log-dot ${isPhish ? 'phishing' : 'safe'}"></div>
    <div class="log-text">${esc(preview)}</div>
    <div class="log-score">score: ${typeof data.score === 'number' ? data.score.toFixed(3) : '?'}</div>
    <div class="log-verdict ${isPhish ? 'phishing' : 'safe'}">${isPhish ? 'PHISHING ' + pct + '%' : 'SAFE'}</div>
    <div class="log-time">${time}</div>
  `;
  log.insertBefore(row, log.firstChild);
  if (log.querySelectorAll('.log-row').length > 25) {
    log.removeChild(log.lastChild);
  }
}

async function triggerRetrain() {
  const btns = document.querySelectorAll('.btn-retrain, .btn-retrain-big');
  btns.forEach(b => { b.disabled = true; b.textContent = 'Retraining…'; });
  const out = document.getElementById('retrainOutput');
  out.textContent = 'Running train.py — this may take a few minutes…';
  show('retrainOutput');

  try {
    const r = await fetch(`${API}/api/retrain`, { method: 'POST' });
    const d = await r.json();
    if (d.error) {
      out.textContent = 'ERROR:\n' + d.error;
    } else {
      out.textContent = d.stdout || 'Done.';
      await checkStatus();
    }
  } catch {
    out.textContent = 'Could not reach server.';
  }
  btns.forEach(b => { b.disabled = false; b.innerHTML = b.classList.contains('btn-retrain-big')
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Retrain model`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Retrain`; });
}

function loadDemo(type) {
  document.getElementById('scanInput').value = type === 1 ? DEMO_PHISH : DEMO_SAFE;
  hide('resultCard'); hide('errorCard');
}

function clearScan() {
  document.getElementById('scanInput').value = '';
  hide('resultCard'); hide('errorCard'); hide('scanningCard');
  if (window.glThreat) window.glThreat.target = 0;
  if (window.glSafe)   window.glSafe.target   = 0;
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('scanInput').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') startScan();
  });
});
