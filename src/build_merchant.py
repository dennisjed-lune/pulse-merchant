#!/usr/bin/env python3
"""Build Merchant portal + RFP Build 01 and 07: the merchant demo (demo-src/merchant.html, unchanged source) with the add-on
(src/merchant/mext.js), small hooks into the wizard, and RFP requirement tooltips.
Usage: python3 src/merchant/build_merchant.py   ->  ./merchant-rfp.html"""
import json, os, sys
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(root, 'src', '_shared'))
from rfpids import used_ids
s = open(os.path.join(root, 'demo-src', 'merchant.html')).read()
ext = open(os.path.join(root, 'src', 'merchant', 'mext.js')).read()
reqs = json.load(open(os.path.join(root, 'src', '_shared', 'rfp-reqs.effective.json')))
tips = open(os.path.join(root, 'src', '_shared', 'req-tips.js')).read()
def patch(old, new):
    global s
    assert old in s, 'hook not found: ' + old[:90]
    s = s.replace(old, new, 1)
# Wizard step 1: offer type and funding before Campaign Settings; more rules after it
patch('<div class="flex flex-col gap-3"><p class="text-gray-1100 text-base leading-normal font-semibold">Campaign Settings</p>',
      '${window.MEXT ? window.MEXT.typeSection(w) : \'\'}<div class="flex flex-col gap-3"><p class="text-gray-1100 text-base leading-normal font-semibold">Campaign Settings</p>')
patch("    </div></div></div>`;\n};\nconst midState", "    </div></div>${window.MEXT ? window.MEXT.rulesSection(w) : ''}</div>`;\n};\nconst midState")
# Wizard step 3: offer rules in the review
patch("${accItem('rv-merchant', 'Merchant Details', midTable(selectedMids(c)), true)}",
      "${accItem('rv-merchant', 'Merchant Details', midTable(selectedMids(c)), true)}${window.MEXT ? window.MEXT.reviewSection(w) : ''}")
# Banks: one campaign can run at several banks (OM-2.1). The merchant sees bank names and status only (OM-9.3). No budget per bank.
patch("(f.bank === 'all' || c.bank === f.bank));", "(f.bank === 'all' || (window.MEXT ? window.MEXT.bankNames(c).includes(f.bank) : c.bank === f.bank)));")
patch("...[...new Set(DB.campaigns.map((c) => c.bank).filter(Boolean))].map((b) => [b, b])];", "...[...new Set(DB.campaigns.flatMap((c) => (window.MEXT ? window.MEXT.bankNames(c) : [c.bank])).filter(Boolean))].map((b) => [b, b])];")
patch("['Bank', 'bank', 'w-40']", "['Banks', 'bank', 'w-56']")
patch("""<td class="${TD}">${c.bank ? `<div class="flex items-center gap-3"><div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white">${ic('lucide:landmark', 'size-4 text-gray-600')}</div><p class="text-gray-1100 min-w-0 truncate text-sm font-medium">${esc(c.bank)}</p></div>` : '<span class="text-sm font-medium text-gray-800">-</span>'}</td>""",
      """<td class="${TD}">${window.MEXT ? window.MEXT.banksCell(c) : esc(c.bank || '-')}</td>""")
patch("${accItem('cd-details', 'Campaign Details', detailsGrid(c), true)}", "${accItem('cd-details', 'Campaign Details', detailsGrid(c), true)}${window.MEXT ? accItem('cd-banks', 'Banks', window.MEXT.banksSection(c), true) : ''}")
patch("['ph:bank', 'Bank partner', c.bank || 'No bank applied yet']", "['ph:bank', 'Banks', window.MEXT && window.MEXT.bankNames(c).length ? window.MEXT.bankNames(c).length + (window.MEXT.bankNames(c).length === 1 ? ' bank' : ' banks') : 'Not sent yet']")
patch("text: (c) => `${esc(c.bank || 'The bank')} did not approve this campaign", "text: (c) => `${esc((window.MEXT ? window.MEXT.banksOf(c).filter((b) => b.st === 'Rejected').map((b) => b.n).join(', ') : c.bank) || 'The bank')} did not approve this campaign")
# Expose render and UI for the add-on
# Build 07: sidebar item and route for the Campaign Results page
# ---- Audit of the original demo screens against our RFP answers (see report). Each patch removes or relabels one element.
# Wizard: two caps (product-owner decision). Cap per transaction (OM-8.7) and cap per customer for the campaign (CL-3.3).
patch("${unitField(w, 'cap', 'Cashback cap', { prefix: 'AED', ph: '200', hint: 'The maximum cashback amount that can be earned on a single transaction.' })}",
      "${unitField(w, 'capTx', 'Cap per transaction', { prefix: 'AED', ph: '50', hint: 'The maximum cashback on one transaction.' })}${unitField(w, 'cap', 'Cap per customer for the campaign', { prefix: 'AED', ph: '200', hint: 'The maximum cashback one customer can earn in this campaign.' })}")
patch("${detailItem('ph:hand-coins', 'Cashback cap', money(c.cap))}", "${detailItem('ph:hand-coins', 'Cap per transaction', money(c.capTx ?? Math.max(5, Math.round((c.cap || 0) * 0.4 / 5) * 5)))}${detailItem('ph:hand-coins', 'Cap per customer for the campaign', money(c.cap))}")
patch("cap: num(w.cap), minSpend: num(w.minSpend), hold: w.hold, mode: w.mode, start: w.start, end: w.end, mids: w.mids, tids: w.tids });", "cap: num(w.cap), capTx: num(w.capTx), minSpend: num(w.minSpend), hold: w.hold, mode: w.mode, start: w.start, end: w.end, mids: w.mids, tids: w.tids });")
patch("pct: '', cap: '', minSpend: '', hold: 14,", "pct: '', cap: '', capTx: '', minSpend: '', hold: 14,")
patch("e.cap = 'Cashback cap cannot exceed the total budget'", "e.cap = 'The cap per customer cannot be more than the total budget'")
# Wizard: no answer covers Lune fees on the budget
patch("hint: 'This is the total budget allocated for this campaign. Lune markup fees are applicable and will be calculated separately.'", "hint: 'This is the total budget allocated for this campaign.'")
# Approval flow: Lune reviews, the bank approves (CL-11.3). No answer commits a match to a bank or a merchant notification.
patch("Your campaign will be reviewed and matched with a bank partner.", "Lune reviews your campaign, then each bank approves it.")
patch("\"Your campaign details have been received by the Lune team and will be shared with the bank for approval. We'll notify you once the campaign is approved.\"",
      "'The Lune team reviews your campaign details. Then Lune sends it to one or more banks. Each bank approves or rejects it.'")
# Brands: the brand profile (average transaction value, monthly orders, marketing budget) is not in our answers
patch("""    <div class="flex flex-col gap-4 ${dim}"><div class="flex flex-col gap-1"><p class="text-gray-1000 text-sm leading-5.25 font-semibold">Brand profile</p><p class="text-sm leading-normal font-normal text-gray-700">Help us understand your customers and business so we can match you with the right bank offers.</p></div>
      <div class="grid grid-cols-3 items-start gap-4">${textField('bw.atv', 'Average transaction value', w.atv, '200', w.err.atv, { prefix: 'AED', numeric: 1 })}${textField('bw.orders', 'Average monthly orders', w.orders, '2000', w.err.orders, { numeric: 1 })}${textField('bw.budget', 'Typical monthly marketing budget', w.budget, '40,000', w.err.budget, { prefix: 'AED', numeric: 1 })}</div></div>
""", "")
patch("      ['atv', 'orders', 'budget'].forEach((k) => { const v = num(w[k]); if (v == null) e[k] = 'Must be a number'; else if (v <= 0) e[k] = 'Must be a positive number'; });\n", "")
patch("""<section class="flex h-full flex-col gap-6 rounded-xl border border-gray-300 bg-white p-5 shadow-sm"><h2 class="${CARD_TITLE}">Business snapshot</h2><div class="flex flex-col gap-6">${stat('Average transaction value', money(b.atv))}${stat('Average monthly orders', b.orders != null ? Number(b.orders).toLocaleString('en-US') : '-')}${stat('Typical monthly marketing budget', money(b.budget))}</div></section>""", "")
# Brands: "I don't know my merchant ID, a Lune specialist will contact you" is a service. The merchant adds MIDs (CL-13.1).
patch("knows: b ? (b.mids.length ? 'yes' : 'no') : null,\n  mids: b ? JSON.parse(JSON.stringify(b.mids)) : [], err: {},",
      "knows: 'yes',\n  mids: b && b.mids.length ? JSON.parse(JSON.stringify(b.mids)) : [newMid()], err: {},")
patch("""<div class="flex flex-col gap-3"><p class="${FLABEL}">Do you know your merchant ID?</p><div class="flex items-start gap-3">${opt('yes', 'Yes, I know my merchant ID')}${opt('no', "No, I don't know my merchant ID")}</div>${errMsg(w.err.knows)}</div>""", "")
patch("""    ${w.knows === 'no' ? `<div class="flex items-center gap-2.5 rounded-xl bg-gray-100 p-3"><span class="bg-gray-0 flex size-12 shrink-0 items-center justify-center rounded-md">${ic('ph:handshake', 'size-6 text-primary-500')}</span><span class="flex flex-col gap-0.5"><span class="text-gray-1100 text-sm font-semibold">No problem, Lune will take it from here</span><span class="text-sm text-gray-700"> A Lune specialist will contact you to confirm your details before your first campaign goes live. </span></span></div>` : ''}
""", "")
patch("No merchant IDs added. A Lune specialist will contact you to confirm them.", "No merchant IDs added.")
# Analytics: the merchant dashboard is built and live (OM-7.1, OM-7.4; product owner 13 Nov 2026). The page stays in the RFP build.
# CL-10.7 and CL-10.23 still say roadmap in the sheet: fix them to match.
# Requirement tags (data-req) on original screens that had none. Each control names only the rows whose answer describes it.
req_patches = [
    # Onboard Brand step 1: merchants self-register and create their brand with name and logo (OM-3.1). One global brand ID (OM-3.5). Website and social links (OM-3.6).
    ("<h1 class=\"${H1}\">${w.editId ? 'Edit Brand' : 'Onboard Brand'}</h1>", "<h1 class=\"${H1}\" data-req=\"OM-3.1 CL-13.1\">${w.editId ? 'Edit Brand' : 'Onboard Brand'}</h1>"),
    ('<p class="${FLABEL}">Brand lookup</p>', '<p class="${FLABEL}" data-req="OM-3.1 OM-3.5">Brand lookup</p>'),
    ('<span class="text-gray-1100 text-[13px] leading-normal font-medium">Logo</span>', '<span class="text-gray-1100 text-[13px] leading-normal font-medium" data-req="OM-3.1">Logo</span>'),
    ("textField('bw.name', 'Official brand name'", "textField('bw.name', '<span data-req=\"OM-3.1\">Official brand name</span>'"),
    ("textField('bw.website', 'Website'", "textField('bw.website', '<span data-req=\"OM-3.6\">Website</span>'"),
    ('<p class="text-gray-1000 text-sm leading-5.25 font-semibold">Add social links</p>', '<p class="text-gray-1000 text-sm leading-5.25 font-semibold" data-req="OM-3.6">Add social links</p>'),
    # Onboard Brand step 2: the merchant adds MIDs and terminals in the portal (CL-13.1). Brand > MID with acquirer > terminal with name and channel (CL-13.6, CL-2.22, OM-3.6).
    ('<p class="text-gray-1100 text-base leading-normal font-semibold">Merchant ID</p>', '<p class="text-gray-1100 text-base leading-normal font-semibold" data-req="CL-13.1 CL-13.6 CL-2.22">Merchant ID</p>'),
    ("'Merchant ID', m.value", "'<span data-req=\"CL-13.1 CL-2.22\">Merchant ID</span>', m.value"),
    ("'Acquirer', m.acquirer", "'<span data-req=\"CL-2.22 CL-13.6\">Acquirer</span>', m.acquirer"),
    ("${lbl('Channel', TIP.channel)}", "${lbl('<span data-req=\"OM-3.6 CL-13.6\">Channel</span>', TIP.channel)}"),
    ("${lbl('Channel')}", "${lbl('<span data-req=\"OM-3.6 CL-13.6\">Channel</span>')}"),
    ("'Outlet name', m.outlet", "'<span data-req=\"CL-2.22 OM-3.6\">Outlet name</span>', m.outlet"),
    ("optLabel('Outlet location', true)", "optLabel('<span data-req=\"OM-3.6\">Outlet location</span>', true)"),
    ("optLabel('Terminal ID', !per)", "optLabel('<span data-req=\"CL-13.6 CL-2.22 OM-3.5\">Terminal ID</span>', !per)"),
    ("optLabel('Terminal tag', true)", "optLabel('<span data-req=\"CL-13.6\">Terminal tag</span>', true)"),
    ('data-act="bw-mid-add" ${addMidOff', 'data-act="bw-mid-add" data-req="CL-13.1 CL-2.22" ${addMidOff'),
    ('data-act="bw-tid-add" data-i="${i}"', 'data-act="bw-tid-add" data-i="${i}" data-req="CL-13.1 CL-2.22"'),
    # Create Campaign review: the merchant submits, Lune reviews, the bank approves or rejects (OM-3.9, CL-11.21, OM-1.6, CL-11.3). The review already shows labels, so this line gets one too.
    ('<p class="text-gray-700 text-sm leading-normal font-normal">${s.desc}</p></div>\n      <div class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-6 pb-1">${body}</div>',
     '<p class="text-gray-700 text-sm leading-normal font-normal"${w.step === 2 ? \' data-req="OM-3.9 CL-11.21 OM-1.6 CL-11.3"\' : \'\'}>${s.desc}${w.step === 2 && window.MEXT ? \' \' + window.MEXT.today(\'OM-3.9 CL-11.21 OM-1.6 CL-11.3\') : \'\'}</p></div>\n      <div class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-6 pb-1">${body}</div>'),
    ('<button type="submit" class="${BTN_LG_PRI}">${w.step === 2', '<button type="submit" class="${BTN_LG_PRI}"${w.step === 2 ? \' data-req="OM-3.9 CL-11.21"\' : \'\'}>${w.step === 2'),
    ('data-act="wiz-save-draft"', 'data-act="wiz-save-draft" data-req="OM-1.6"'),
]
for old, new in req_patches:
    assert s.count(old) == 1, 'tag hook not unique: ' + old[:90]
    patch(old, new)
# Expose render, UI and the read-only data and helpers the add-on uses
patch("window.addEventListener('hashchange', () => render());", "window.__M_RENDER = render; window.__M_UI = () => UI;\nwindow.__M_H = { DB: () => DB, esc, ic, badge, logoImg, chBadge, menu: (...a) => menu(...a), fmtMDY, maData, maCampaigns, MA_ASOF };\nwindow.addEventListener('hashchange', () => render());")
ids = sorted(k for k in used_ids(ext + ''.join(n for _, n in req_patches)) if k in reqs)
sub = {k: reqs[k] for k in ids}
patch("<script>/* Lune Pulse merchant portal", "<script>window.RFP_REQS=" + json.dumps(sub, ensure_ascii=False).replace('</', '<\\/') + ";</script><script>" + ext + "</script>\n<script>/* Lune Pulse merchant portal")
patch("</body>", "<script>" + tips + "</script>\n</body>")
out = os.path.join(root, 'merchant-rfp.html')
import sys as _s; _s.path.insert(0, os.path.join(root, 'src', '_shared')); import rebrand  # demo merchants -> RFP offer set (13 Nov 2026)
s = rebrand.apply(s, 'merchant')
open(out, 'w').write(s)
print('built', out, os.path.getsize(out), 'rows', len(sub))
