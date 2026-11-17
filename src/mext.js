/* Merchant portal + RFP Build 01 (wizard). Add-on for the merchant demo (lune-demo-48b.pages.dev/merchant.html).
   Adds the offer rules our RFP answers describe to the Create Campaign wizard (step 1) and the review (step 3).
   Labels come from our answers in the RFP sheet (window.RFP_REQS), never typed by hand. */
(() => {
'use strict';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css = document.createElement('style');
css.textContent = `.mx-tag{display:inline-flex;align-items:center;gap:.25rem;width:fit-content;white-space:nowrap;border-radius:9999px;border:1px solid;padding:.0625rem .5rem;font-size:.6875rem;line-height:1rem;font-weight:600}
.mx-ok{background:#effef4;color:#08451f;border-color:#d0efdb}.mx-info{background:#e7efed;color:#0a634d;border-color:#cee0db}.mx-warn{background:#fff7eb;color:#66440c;border-color:#ffeed2}.mx-bad{background:#ffecec;color:#621515;border-color:#fdd7d7}.mx-out{background:#fff;color:#656565;border-color:#e1e1e1}
.mx-box{border:1px dashed #ffbc4c;border-radius:.75rem;padding:1rem;display:flex;flex-direction:column;gap:1rem;background:#fff7eb66}
.mx-opt{display:flex;cursor:pointer;align-items:flex-start;gap:.75rem;border:1px solid #e1e1e1;border-radius:.5rem;padding:.625rem .75rem;background:#fff;text-align:left}
.mx-opt[aria-checked=true]{border-color:#0a634d;background:#e7efed}.mx-dot{margin-top:.125rem;width:1rem;height:1rem;border-radius:9999px;border:1px solid #b3b3b3;display:flex;align-items:center;justify-content:center;flex:none}
.mx-opt[aria-checked=true] .mx-dot{border-color:#0a634d}.mx-opt[aria-checked=true] .mx-dot::after{content:"";width:.5rem;height:.5rem;border-radius:9999px;background:#0a634d}
.mx-day{height:2.25rem;border-radius:.5rem;border:1px solid #e1e1e1;padding:0 .75rem;font-size:.875rem;font-weight:500;background:#fff;color:#383838;cursor:pointer}.mx-day[aria-pressed=true]{background:#0a634d;border-color:#0a634d;color:#fff}
.mx-note{font-size:.75rem;line-height:1rem;color:#656565}.mx-seg button{min-height:2.25rem}.mx-link{display:inline-flex;align-items:center;min-height:2.25rem}.mx-link:hover{text-decoration:underline}`;
document.head.appendChild(css);

/* same tag rules as the LuneHub add-on */
const stat = (c) => (!c ? 'none' : /^Fully/.test(c) ? 'full' : /^Partial/.test(c) ? 'partial' : /^Not/.test(c) ? 'not' : 'none');
const tagText = (rows, part) => {
  const R = window.RFP_REQS || {}, ids = String(rows || '').split(/\s+/).filter(Boolean);
  if (part === 'idea') return ['Not in our answers', 'out'];
  if (!ids.length) return ['Available today', 'info'];
  const st = new Set(ids.map((i) => stat((R[i] || {}).c)));
  if (st.has('none')) return ['No answer yet', 'out'];
  if (st.size === 1 && st.has('not')) return ['Not Compliant', 'bad'];
  if (part === 'plan') { if (st.size === 1 && st.has('full')) return ['Fully Compliant', 'ok']; if (st.has('full')) return ['Answers conflict', 'bad']; return ['Partially Compliant', 'info']; }
  if (st.has('not')) return ['Answers conflict', 'bad'];
  return st.has('partial') ? ['Partially Compliant · available today', 'info'] : ['Fully Compliant', 'ok'];
};
const tag = (rows, part) => { const [t, k] = tagText(rows, part); return `<span class="mx-tag mx-${k}"${rows ? ` data-req="${rows}"` : ''}>${t}</span>`; };
const today = (rows) => tag(rows, 'today'), plan = (rows) => tag(rows, 'plan');

const FLABEL = 'text-gray-1000 text-sm leading-5.25 font-medium';
const UNIT_SHELL = 'flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3';
const UNIT_INPUT = 'w-full outline-none text-gray-1100 h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5.25 font-medium shadow-none';
const unit = (key, label, val, pre, suf, rows) => `<div class="grid gap-0"><label class="flex flex-wrap items-center gap-2 select-none ${FLABEL} mb-2" for="mx-${key}">${label} ${rows ? plan(rows) : ''}</label><div class="${UNIT_SHELL}">${pre ? `<span class="text-gray-700 shrink-0 text-sm">${pre}</span>` : ''}<input id="mx-${key}" inputmode="decimal" data-mx-in="${key}" value="${esc(val ?? '')}" placeholder="${rows ? 'No limit' : '0'}" autocomplete="off" class="${UNIT_INPUT}">${suf ? `<span class="text-gray-700 shrink-0 text-sm">${suf}</span>` : ''}</div></div>`;
const opts = (key, list, cur) => `<div class="grid grid-cols-2 gap-3" role="radiogroup">${list.map((o) => `<button type="button" role="radio" aria-checked="${cur === o.v}" class="mx-opt" data-mx="${key}" data-v="${o.v}"><span class="mx-dot"></span><span class="flex min-w-0 flex-col gap-1"><span class="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-1100">${o.l} ${o.idea ? tag('', 'idea') : o.p ? plan(o.rows) : today(o.rows)}</span>${o.d ? `<span class="mx-note">${o.d}</span>` : ''}</span></button>`).join('')}</div>`;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const rx = (w) => (w.rx ||= { type: 'percent', days: [0, 1, 2, 3, 4, 5, 6], timeFrom: '', timeTo: '', capDay: '', capMonth: '', capCard: '', fixed: '' });

/* Step 1, before "Campaign Settings": offer type */
const typeSection = (w) => {
  const r = rx(w);
  return `<div class="flex flex-col gap-3"><div class="flex flex-wrap items-center justify-between gap-2"><p class="text-gray-1100 text-base leading-normal font-semibold">Offer type</p><span class="mx-note">Labels show what our RFP answers say. Hover a label for the requirement.</span></div>
    ${opts('type', [
      { v: 'percent', l: 'Percentage cashback', rows: 'CL-3.4 OM-1.1', d: 'Cashback on each qualifying purchase, with a minimum spend.' },
      { v: 'fixed', l: 'Fixed-value cashback', rows: 'CL-3.4 OM-1.1', d: 'A fixed amount on each qualifying purchase.' },
      { v: 'tiered', l: 'Tiered cashback', rows: 'CL-3.4 CL-3.7', d: 'A tier based on the transaction amount.' }
    ], r.type)}
    ${r.type === 'fixed' ? `<div class="grid grid-cols-2 gap-4">${unit('fixed', 'Cashback per purchase', r.fixed, 'AED', '', '')}</div>` : ''}
</div>`;
};
/* Step 1, after "Campaign Settings": time rules and more caps */
const rulesSection = (w) => {
  const r = rx(w);
  return `<div class="mx-box"><div class="flex flex-wrap items-center gap-2"><p class="text-gray-1100 text-base leading-normal font-semibold">More campaign rules</p>${plan('CL-3.15 CL-3.16')}</div>
    <div class="flex flex-col gap-2"><p class="${FLABEL} flex flex-wrap items-center gap-2">Days ${plan('CL-3.15')}</p><div class="flex flex-wrap gap-2">${DAYS.map((d, i) => `<button type="button" class="mx-day" data-mx="day" data-v="${i}" aria-pressed="${r.days.includes(i)}">${d}</button>`).join('')}</div></div>
    <div class="grid grid-cols-2 gap-4"><div class="grid gap-0"><label class="${FLABEL} mb-2 flex flex-wrap items-center gap-2" for="mx-timeFrom">From time ${plan('CL-3.15')}</label><input id="mx-timeFrom" type="time" data-mx-in="timeFrom" value="${esc(r.timeFrom)}" class="${UNIT_SHELL} ${UNIT_INPUT} px-3"></div><div class="grid gap-0"><label class="${FLABEL} mb-2" for="mx-timeTo">To time</label><input id="mx-timeTo" type="time" data-mx-in="timeTo" value="${esc(r.timeTo)}" class="${UNIT_SHELL} ${UNIT_INPUT} px-3"></div></div>
    <div class="grid grid-cols-3 gap-4">${unit('capDay', 'Cap per day', r.capDay, 'AED', '', 'CL-3.16')}${unit('capMonth', 'Cap per month', r.capMonth, 'AED', '', 'CL-3.16 LAF-86 LAF-101')}${unit('capCard', 'Cap per card', r.capCard, 'AED', '', 'CL-3.16')}</div></div>`;
};
/* Step 3, review: one more section that lists the rules beyond today's fields */
const reviewSection = (w) => {
  const r = rx(w);
  const T = { percent: 'Percentage cashback', fixed: 'Fixed-value cashback', tiered: 'Tiered cashback' };
  const rows = [['Offer type', T[r.type], r.type === 'tiered' ? today('CL-3.4 CL-3.7') : today('CL-3.4 OM-1.1')],
    ['Days', r.days.length === 7 ? 'Every day' : r.days.map((d) => DAYS[d]).join(', '), r.days.length === 7 ? '' : plan('CL-3.15')],
    ['Time', r.timeFrom && r.timeTo ? `${r.timeFrom} to ${r.timeTo}` : 'All day', r.timeFrom && r.timeTo ? plan('CL-3.15') : ''],
    ['More caps', [r.capDay && `AED ${r.capDay} per day`, r.capMonth && `AED ${r.capMonth} per month`, r.capCard && `AED ${r.capCard} per card`].filter(Boolean).join(', ') || 'None', r.capDay || r.capMonth || r.capCard ? plan('CL-3.16') : '']];
  return `<div class="flex flex-col rounded-xl border border-gray-300 bg-white"><div class="flex items-center gap-2 p-4"><p class="text-gray-1100 text-base font-semibold">Offer rules</p></div><div class="grid grid-cols-2 gap-4 border-t border-gray-300 p-4">${rows.map((x) => `<div class="flex flex-col gap-1"><span class="text-xs text-gray-700">${x[0]}</span><span class="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-1100">${esc(x[1])} ${x[2]}</span></div>`).join('')}</div></div>`;
};
/* Banks: one campaign can run at several banks (OM-2.1). Lune operations sends it to each bank, and each bank reviews it.
   The merchant sees bank names and status only, never bank customer data (OM-9.3). No budget per bank. */
const BSEED = {
  221: [['Nova Bank', 'Live'], ['Gulf Demo Bank', 'Live'], ['Oasis Bank', 'Rejected', 'The bank already runs a grocery offer on these dates.']],
  229: [['Nova Bank', 'Live'], ['Gulf Demo Bank', 'Live']],
  225: [['Nova Bank', 'Live'], ['Gulf Demo Bank', 'In review']],
};
const BST = { live: 'Live', completed: 'Ended', rejected: 'Rejected', in_review: 'In review', scheduled: 'Scheduled' };
const BCLS = { Live: 'bg-[#cee0db] text-primary-500', Scheduled: 'bg-[#dbeafe] text-[#155dfc]', 'In review': 'bg-[#fef3c6] text-[#e17100]', Ended: 'bg-gray-100 text-gray-800', Rejected: 'bg-[#ffe0e1] text-[#e60000]' };
const banksOf = (c) => (BSEED[c.id] ? BSEED[c.id].map(([n, st, reason]) => ({ n, st, reason: reason || '' })) : c.bank ? [{ n: c.bank, st: BST[c.status] || 'Live', reason: c.status === 'rejected' ? (c.reason || '') : '' }] : []);
const bankNames = (c) => banksOf(c).map((b) => b.n);
const bBadge = (st) => `<div data-slot="badge" class="inline-flex items-center justify-center rounded-full border w-fit whitespace-nowrap shrink-0 overflow-hidden gap-1 border-transparent px-1.5 py-1 text-xs font-semibold ${BCLS[st] || BCLS.Ended}"><span class="size-1.5 shrink-0 rounded-full bg-current"></span> ${esc(st)}</div>`;
const banksCell = (c) => {
  const L = bankNames(c);
  if (!L.length) return '<span class="text-sm font-medium text-gray-800">Not sent yet</span>';
  return `<div class="flex min-w-0 flex-col gap-0.5" data-req="OM-2.1 OM-9.3"><p class="text-gray-1100 truncate text-sm font-medium">${L.length} ${L.length === 1 ? 'bank' : 'banks'}</p><p class="truncate text-xs font-medium text-gray-800" title="${esc(L.join(', '))}">${esc(L.join(', '))}</p></div>`;
};
const banksSection = (c) => {
  const B = banksOf(c);
  const rows = B.length ? B.map((b) => `<tr class="border-b border-gray-300 last:border-0" data-req="OM-2.1 CL-11.3"><td class="py-3 pr-4 align-top"><span class="flex items-center gap-2 text-sm font-medium text-gray-1100"><span class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white"><svg viewBox="0 0 24 24" class="size-4 text-gray-600" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V10M19 21V10M9 21v-6M15 21v-6M2 10l10-6 10 6"/></svg></span>${esc(b.n)}</span></td><td class="py-3 align-top"><div class="flex flex-col gap-1">${bBadge(b.st)}${b.reason ? `<span class="text-xs font-medium text-gray-800">Reason: ${esc(b.reason)}</span>` : ''}</div></td></tr>`).join('')
    : '<tr><td colspan="2" class="py-3 text-sm font-medium text-gray-800">Lune reviews the campaign first. Then Lune sends it to one or more banks.</td></tr>';
  return `<div class="flex flex-col gap-3"><div class="flex flex-wrap items-center gap-2"><span class="mx-note">Each bank reviews the campaign on its own. You see the bank and its status.</span>${today('OM-2.1 CL-11.3 OM-9.3')}</div>
    ${B.length ? `<table class="w-full text-sm"><thead><tr class="border-b border-gray-300"><th class="py-2 pr-4 text-left text-xs font-semibold text-gray-700">Bank</th><th class="py-2 text-left text-xs font-semibold text-gray-700">Status</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="text-sm font-medium text-gray-800">Lune reviews the campaign first. Then Lune sends it to one or more banks.</p>'}</div>`;
};
window.MEXT = { typeSection, rulesSection, reviewSection, today, banksOf, bankNames, banksCell, banksSection };

const wiz = () => (window.__M_UI ? window.__M_UI().wiz : null);
const rerender = () => { if (window.__M_RENDER) window.__M_RENDER(true); };
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-mx]'); if (!t) return;
  e.preventDefault(); e.stopPropagation();
  const w = wiz(); if (!w) return; const r = rx(w), k = t.dataset.mx, v = t.dataset.v;
  if (k === 'day') { const d = +v; r.days = r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort(); }
  else r[k] = v;
  rerender();
}, true);
document.addEventListener('input', (e) => { const t = e.target; if (!t.dataset || !t.dataset.mxIn) return; e.stopPropagation(); const w = wiz(); if (w) rx(w)[t.dataset.mxIn] = t.value; }, true);
})();
