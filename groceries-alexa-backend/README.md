# groceries-alexa-backend

A single serverless endpoint (`/api/add-item`) deployed on Vercel that appends
an item to a Google Sheet. Built to be called later by a custom Alexa skill.

## Environment variables (set these in the Vercel project settings, not in this repo)

- `GOOGLE_CLIENT_EMAIL` — the `client_email` field from your Google service account JSON key.
- `GOOGLE_PRIVATE_KEY` — the `private_key` field from that same JSON key (paste it exactly as it appears, including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines).
- `GOOGLE_SHEET_ID` — the long ID in your spreadsheet's URL, between `/d/` and `/edit`.

Never commit the actual JSON key file or these values into this repo.

## Testing after deploy

```bash
curl -X POST https://<your-vercel-project>.vercel.app/api/add-item \
  -H "Content-Type: application/json" \
  -d '{"item": "milk"}'
```

A successful response looks like:

```json
{"success": true, "item": "milk"}
```

Then check the Google Sheet — a new row with a timestamp and "milk" should appear.

## Note on the sheet range

`api/add-item.js` writes to the `Shopping List` tab (columns A:B). If you
rename that tab, update the `range` value in `api/add-item.js` to match —
note the single quotes around the tab name in the code, which are required
because the name contains a space.
