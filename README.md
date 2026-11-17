# Pulse Merchant Portal

## Mastercard RFP prototype (16 Nov 2026)

The merchant portal with the campaign request that the Mastercard RFP answers commit to: offer type, funding, days and times, caps, and offer rules on the review step.
It is built on top of the Lune demo environment (`merchant` app). Open `index.html` in a browser. The demo sign-in accepts any email and password.

This is the pitch version. It does not show the internal RFP review marks (answer labels, legends, row tooltips). A small script at the end of `index.html` (`id="pitch-mode"`) hides them.

- `src/mext.js`: the add-on that adds the RFP fields.
- `src/build_merchant.py`: patches the demo base with the add-on. Run it from the `product` workspace.

## Earlier prototype (July 2026)

`pulse.html` is the earlier merchant journey prototype. It is kept as it was. Its notes follow.

Interactive prototype of the LunePulse **merchant journey**: a self-contained,
single-file HTML/CSS/vanilla-JS app.

### Run

Open [`pulse.html`](pulse.html) in a browser, or serve the folder:

```bash
python3 -m http.server 4178
# then visit http://localhost:4178/pulse.html
```

### What's inside

- **Overview** — live / completed campaign cards, each showing cashback, duration
  and the partner **bank** (Lune client banks: ADIB, Ajman Bank, American Express,
  D360 Bank, Beyon Money, Commercial Bank of Dubai).
- **Campaign Requests** — under review · recommendations ready · approved.
- **Campaign Recommendation flow** — goal selection with a live reach/revenue
  estimate → review & confirm, with a customer-facing offer preview and a
  merchant brand-logo / campaign-graphic picker.
- **Confirm → Confirmed** submission flow.

### Files

| Path | Purpose |
|------|---------|
| `pulse.html` | The entire prototype (markup, styles, logic) |
| `index.html` | Redirect to `pulse.html` (for GitHub Pages) |
| `assets/` | Static images (campaign hero, etc.) |
