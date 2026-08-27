import './styles.css';
import { summarizeDeck } from './csv';
import { localToday, makePlan, validateInput } from './planner';
import { clearState, loadState, saveState } from './storage';
import { checkoutUrl, hasPaidAccess, removeLicense, restoreLicense, storeReturnedLicense, verifyLicense } from './license';
import type { Pace, PersistedState, PlanInput, StudyPlan } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const savedState = document.querySelector<HTMLElement>('#saved-state')!;
const toast = document.querySelector<HTMLDivElement>('#toast')!;
const inThirtyDays = new Date();
inThirtyDays.setDate(inThirtyDays.getDate() + 30);

const defaultInput: PlanInput = {
  deckName: '', reviewCards: 0, newCards: 0,
  examDate: localToday(inThirtyDays), dailyMinutes: 35,
  secondsPerReview: 10, secondsPerNew: 35, reviewPasses: 2, newRepetitions: 3, pace: 'steady',
};
let state: PersistedState = { input: { ...defaultInput }, updatedAt: new Date().toISOString() };
let plus = hasPaidAccess();

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));

function announce(message: string): void {
  toast.textContent = message; toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 4200);
}

async function persist(message = 'Saved locally'): Promise<void> {
  state.updatedAt = new Date().toISOString();
  try { await saveState(state); savedState.textContent = message; }
  catch { savedState.textContent = 'Could not save on this device'; }
}

function inputTemplate(): string {
  const i = state.input;
  return `<form id="plan-form" class="plan-form" novalidate>
    <div class="route-steps" aria-hidden="true"><span class="active">1 Deck</span><i></i><span>2 Horizon</span><i></i><span>3 Pace</span></div>
      <div id="form-errors" class="form-errors" role="alert" tabindex="-1" hidden></div>
    <fieldset class="form-section">
      <legend><span>1</span> What needs revising?</legend>
      <p class="field-help">Import an Anki CSV with a header row. If it includes <code>reps</code>, <code>reviews</code>, <code>type</code>, or <code>status</code>, new and reviewed cards are separated automatically.</p>
      <div class="import-zone">
        <input id="deck-file" class="visually-hidden" type="file" accept=".csv,text/csv" />
        <label class="button secondary" for="deck-file"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0-12 4 4m-4-4L8 7M5 14v5h14v-5"/></svg>Import Anki CSV</label>
        <span id="import-status" role="status" aria-live="polite">or enter review counts</span>
      </div>
      <div class="field-grid three">
        <label><span>Deck name</span><input name="deckName" required value="${escapeHtml(i.deckName)}" /></label>
        <label><span>Cards seen before</span><input name="reviewCards" type="number" min="0" step="1" required value="${i.reviewCards}" /></label>
        <label><span>Brand-new cards</span><input name="newCards" type="number" min="0" step="1" required value="${i.newCards}" /></label>
      </div>
    </fieldset>
    <fieldset class="form-section">
      <legend><span>2</span> Where is the horizon?</legend>
      <div class="field-grid two">
        <label><span>Exam date</span><input name="examDate" type="date" min="${localToday()}" required value="${i.examDate}" /></label>
        <label><span>Minutes available each day</span><span class="input-suffix"><input name="dailyMinutes" type="number" min="5" max="720" step="5" required value="${i.dailyMinutes}" /><b>min</b></span></label>
      </div>
    </fieldset>
    <fieldset class="form-section assumptions">
      <legend><span>3</span> Choose the pace</legend>
      <div class="pace-options" role="radiogroup" aria-label="Study pace">
        ${paceOption('steady', 'Steady', 'Even daily effort', i.pace === 'steady', false)}
        ${paceOption('front-loaded', 'Front-loaded', 'More work while time is wide', i.pace === 'front-loaded', !plus)}
        ${paceOption('gentle-ramp', 'Gentle ramp', 'Build toward exam week', i.pace === 'gentle-ramp', !plus)}
      </div>
      ${!plus ? '<p class="plus-note"><span>Plus</span> Alternative pacing is part of the optional one-time unlock. The full steady plan remains free.</p>' : ''}
      <details><summary>Forecast assumptions <span>Shown and editable</span></summary>
        <div class="field-grid four">
          <label><span>Seconds / review</span><input name="secondsPerReview" type="number" min="3" max="300" value="${i.secondsPerReview}" /></label>
          <label><span>Seconds / new card</span><input name="secondsPerNew" type="number" min="5" max="600" value="${i.secondsPerNew}" /></label>
          <label><span>Passes / seen card</span><input name="reviewPasses" type="number" min="1" max="10" value="${i.reviewPasses}" /></label>
          <label><span>Visits / new card</span><input name="newRepetitions" type="number" min="1" max="10" value="${i.newRepetitions}" /></label>
        </div>
        <p class="field-help">A “review” in the calendar is one card visit, not a unique card. The planner spreads visits across every day before the exam and never silently plans more than 15 minutes above your cap.</p>
      </details>
    </fieldset>
    <div class="form-action"><div><strong>Your plan stays here.</strong><span>No deck content is uploaded.</span></div><button class="button primary" type="submit">Draw my plan <span aria-hidden="true">→</span></button></div>
  </form>`;
}

function paceOption(value: Pace, title: string, note: string, checked: boolean, locked: boolean): string {
  return `<label class="pace-option ${locked ? 'locked' : ''}"><input type="radio" name="pace" value="${value}" ${checked ? 'checked' : ''} ${locked ? 'disabled' : ''}/><span><b>${title}${locked ? ' · Plus' : ''}</b><small>${note}</small></span></label>`;
}

function planTemplate(plan: StudyPlan): string {
  const completed = plan.days.filter((day) => day.completed).length;
  const scheduled = plan.days.reduce((sum, day) => sum + day.newCards + day.reviews, 0);
  const overflowDays = plan.days.filter((day) => day.overCap).length;
  const unscheduled = plan.unscheduledNew + plan.unscheduledReviews;
  const progress = plan.days.length ? Math.round(completed / plan.days.length * 100) : 0;
  return `<div class="plan-view">
    <div class="plan-toolbar"><button id="back-to-form" class="text-button" type="button">← Adjust inputs</button><div><button id="export-csv" class="button secondary" type="button">Export calendar CSV</button></div></div>
    <section class="plan-summary" aria-labelledby="route-heading">
      <div><p class="kicker">${escapeHtml(plan.input.deckName)}</p><h3 id="route-heading">${plan.days.length} days to ${formatDate(plan.input.examDate, { month: 'long', day: 'numeric', year: 'numeric' })}</h3><p>${scheduled.toLocaleString()} card visits scheduled · ${plan.requiredMinutes.toLocaleString()} estimated minutes needed</p></div>
      <div class="deadline-seal"><span>${new Date(`${plan.input.examDate}T12:00:00Z`).getUTCDate()}</span>${formatDate(plan.input.examDate, { month: 'short' })}<small>exam</small></div>
    </section>
    ${unscheduled > 0 ? `<div class="notice danger" role="alert"><strong>The route does not fit yet.</strong><p>${unscheduled.toLocaleString()} card visits are left unscheduled even after using the 15-minute overflow band. Add days, raise the daily cap, or reduce repetition assumptions.</p></div>` : overflowDays ? `<div class="notice warning"><strong>${overflowDays} ${overflowDays === 1 ? 'day runs' : 'days run'} over your preferred cap.</strong><p>They stay within the promised 15-minute safety band. Lower the workload or add time to remove the overload.</p></div>` : `<div class="notice success"><strong>This route fits your stated capacity.</strong><p>No day exceeds ${plan.input.dailyMinutes} minutes. Keep the assumptions honest as your pace changes.</p></div>`}
    <div class="progress-block"><div><span>Days completed</span><strong>${completed} / ${plan.days.length}</strong></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-label="Plan completion"><i style="width:${progress}%"></i></div></div>
    <div class="calendar-head"><h3>Daily route</h3><p>Check off a day after the session. Progress is saved on this device.</p></div>
    <ol class="day-list">${plan.days.map((day, index) => `<li class="day-card ${day.completed ? 'complete' : ''} ${day.overCap ? 'over' : ''}">
      <label><input class="day-check" type="checkbox" data-index="${index}" ${day.completed ? 'checked' : ''}/><span class="custom-check" aria-hidden="true">✓</span><span class="day-date"><small>${formatDate(day.date, { weekday: 'short' })}</small><b>${formatDate(day.date, { month: 'short', day: 'numeric' })}</b></span></label>
      <div class="task-count"><span><b>${day.newCards}</b> new</span><span><b>${day.reviews}</b> reviews</span></div>
      <div class="day-minutes"><b>${day.minutes}</b><span>min</span>${day.overCap ? '<small>Over cap</small>' : ''}</div>
    </li>`).join('')}</ol>
    <p class="plan-disclaimer">This calendar is planning support, not a prediction of recall, grades, or exam results. Your actual study time may differ.</p>
  </div>`;
}

function readForm(form: HTMLFormElement): PlanInput {
  const data = new FormData(form);
  const number = (key: string) => Number(data.get(key));
  return {
    deckName: String(data.get('deckName') || '').trim(), reviewCards: number('reviewCards'), newCards: number('newCards'),
    examDate: String(data.get('examDate') || ''), dailyMinutes: number('dailyMinutes'),
    secondsPerReview: number('secondsPerReview'), secondsPerNew: number('secondsPerNew'),
    reviewPasses: number('reviewPasses'), newRepetitions: number('newRepetitions'), pace: String(data.get('pace') || 'steady') as Pace,
  };
}

function render(): void {
  app.innerHTML = state.plan ? planTemplate(state.plan) : inputTemplate();
  if (state.plan) bindPlan(); else bindForm();
}

function bindForm(): void {
  const form = document.querySelector<HTMLFormElement>('#plan-form')!;
  const file = document.querySelector<HTMLInputElement>('#deck-file')!;
  file.addEventListener('change', async () => {
    const selected = file.files?.[0]; if (!selected) return;
    const status = document.querySelector<HTMLElement>('#import-status')!;
    status.textContent = 'Reading deck…';
    try {
      const deck = summarizeDeck(await selected.text(), selected.name);
      (form.elements.namedItem('deckName') as HTMLInputElement).value = deck.name;
      (form.elements.namedItem('reviewCards') as HTMLInputElement).value = String(deck.reviewCards);
      (form.elements.namedItem('newCards') as HTMLInputElement).value = String(deck.newCards);
      state.sourceRows = deck.rows;
      status.textContent = `${deck.rows.toLocaleString()} rows read · ${deck.newCards} new · ${deck.reviewCards} seen${deck.note ? ` — ${deck.note}` : ''}`;
    } catch (error) { status.textContent = error instanceof Error ? error.message : 'This file could not be read.'; }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = readForm(form); const errors = validateInput(input);
    const box = document.querySelector<HTMLDivElement>('#form-errors')!;
    if (errors.length) { box.innerHTML = `<strong>Check the route details:</strong><ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`; box.hidden = false; box.focus(); return; }
    state.input = input; state.plan = makePlan(input); await persist(); render();
    document.querySelector('#planner-heading')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}

function bindPlan(): void {
  document.querySelector('#back-to-form')?.addEventListener('click', () => { delete state.plan; render(); });
  document.querySelector('#export-csv')?.addEventListener('click', exportCalendar);
  document.querySelectorAll<HTMLInputElement>('.day-check').forEach((checkbox) => checkbox.addEventListener('change', async () => {
    if (!state.plan) return;
    state.plan.days[Number(checkbox.dataset.index)].completed = checkbox.checked;
    await persist('Progress saved'); render();
  }));
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name }); link.click(); URL.revokeObjectURL(url);
}

function exportCalendar(): void {
  if (!state.plan) return;
  const rows = [['Date', 'New cards', 'Review visits', 'Estimated minutes', 'Over preferred cap', 'Completed'], ...state.plan.days.map((day) => [day.date, day.newCards, day.reviews, day.minutes, day.overCap ? 'yes' : 'no', day.completed ? 'yes' : 'no'])];
  download('exam-deadline-map.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv'); announce('Calendar CSV exported.');
}

function openDataDialog(): void {
  const dialog = document.createElement('dialog'); dialog.className = 'sheet-dialog';
  dialog.innerHTML = `<form method="dialog"><div class="dialog-head"><div><p class="kicker">Local-first</p><h2>Your data</h2></div><button class="icon-button" value="close" aria-label="Close data dialog">×</button></div><p>Your inputs, plan, and completion checks stay in this browser’s IndexedDB. Nothing is sent to us.</p><div class="dialog-actions"><button id="export-json" class="button secondary" type="button">Export backup</button><label class="button secondary" for="import-json">Import backup</label><input id="import-json" class="visually-hidden" type="file" accept="application/json,.json" /></div><hr/><button id="delete-data" class="text-button danger-text" type="button">Delete plan and local data</button></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('#export-json')?.addEventListener('click', () => { download('exam-deadline-map-backup.json', JSON.stringify(state, null, 2), 'application/json'); announce('Local backup exported.'); });
  dialog.querySelector<HTMLInputElement>('#import-json')?.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    try { const imported = JSON.parse(await file.text()) as PersistedState; if (!imported.input) throw new Error(); state = imported; await persist('Backup imported'); dialog.close(); render(); }
    catch { announce('That backup is not valid. No data was changed.'); }
  });
  dialog.querySelector('#delete-data')?.addEventListener('click', async () => {
    if (!confirm('Delete your deck counts, revision plan, and completion history from this device? This cannot be undone unless you exported a backup.')) return;
    await clearState(); state = { input: { ...defaultInput }, updatedAt: new Date().toISOString() }; dialog.close(); render(); announce('Local plan data deleted.');
  });
}

function openLicenseDialog(): void {
  const dialog = document.createElement('dialog'); dialog.className = 'sheet-dialog license-dialog';
  dialog.innerHTML = `<form method="dialog"><div class="dialog-head"><div><p class="kicker">One-time unlock</p><h2>Plan Plus</h2></div><button class="icon-button" value="close" aria-label="Close license dialog">×</button></div>
    ${plus ? '<div class="notice success"><strong>Plan Plus is active on this device.</strong><p>Alternative pacing strategies are unlocked.</p></div><button id="remove-license" class="text-button danger-text" type="button">Remove license from this device</button>' : `<p>Keep the full steady planner free. Unlock front-loaded and gentle-ramp planning with a <strong>$8 one-time purchase</strong>—no account or subscription.</p><a class="button primary full" href="${checkoutUrl()}">Buy Plan Plus</a><p class="merchant-note">Secure checkout is hosted by Sociobot; Dodo is the merchant of record. Refunds are handled there and revoke the license.</p><hr/><label><span>Have a license? Paste it here</span><input id="license-token" autocomplete="off" /></label><button id="restore-license" class="button secondary full" type="button">Verify and restore purchase</button><p id="license-error" class="error-copy" role="alert"></p>`}<p class="legal-links"><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p></form>`;
  document.body.append(dialog); dialog.showModal(); dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('#restore-license')?.addEventListener('click', async () => {
    const error = dialog.querySelector<HTMLElement>('#license-error')!;
    try { restoreLicense((dialog.querySelector<HTMLInputElement>('#license-token')!).value); plus = await verifyLicense(true); if (!plus) throw new Error('That license is not active for this product.'); dialog.close(); render(); announce('Plan Plus restored.'); }
    catch (reason) { error.textContent = reason instanceof Error ? reason.message : 'License verification failed. Try again when online.'; }
  });
  dialog.querySelector('#remove-license')?.addEventListener('click', () => { removeLicense(); plus = false; dialog.close(); render(); announce('License removed from this device.'); });
}

async function boot(): Promise<void> {
  const returned = storeReturnedLicense(); plus = hasPaidAccess();
  try { state = (await loadState()) || state; } catch { savedState.textContent = 'Local storage unavailable'; }
  render();
  document.querySelector('#data-button')?.addEventListener('click', openDataDialog);
  document.querySelector('#license-button')?.addEventListener('click', openLicenseDialog);
  if (returned) announce('Purchase received. Verifying Plan Plus…');
  if (plus && navigator.onLine) verifyLicense().then((valid) => { if (plus !== valid) { plus = valid; render(); announce('This license is no longer active.'); } }).catch(() => undefined);
  window.addEventListener('offline', () => announce('You are offline. Your saved plan still works.'));
  window.addEventListener('online', () => announce('Back online.'));
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) announce('An update is ready. Refresh to use it.'); });
      });
    }).catch(() => undefined);
  }
}

void boot();
