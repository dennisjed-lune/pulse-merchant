# LunePulse — Merchant Portal

Interactive prototype of the LunePulse **merchant journey**: a self-contained,
single-file HTML/CSS/vanilla-JS app.

## Run

Open [`pulse.html`](pulse.html) in a browser, or serve the folder:

```bash
python3 -m http.server 4178
# then visit http://localhost:4178/pulse.html
```

## What's inside

- **Overview** — live / completed campaign cards, each showing cashback, duration
  and the partner **bank** (Lune client banks: ADIB, Ajman Bank, American Express,
  D360 Bank, Beyon Money, Commercial Bank of Dubai).
- **Campaign Requests** — under review · recommendations ready · approved.
- **Campaign Recommendation flow** — goal selection with a live reach/revenue
  estimate → review & confirm, with a customer-facing offer preview and a
  merchant brand-logo / campaign-graphic picker.
- **Confirm → Confirmed** submission flow.

## Files

| Path | Purpose |
|------|---------|
| `pulse.html` | The entire prototype (markup, styles, logic) |
| `index.html` | Redirect to `pulse.html` (for GitHub Pages) |
| `assets/` | Static images (campaign hero, etc.) |
