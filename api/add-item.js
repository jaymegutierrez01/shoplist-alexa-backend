const { google } = require('googleapis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed, use POST' });
    return;
  }

  const { item } = req.body || {};
  if (!item || typeof item !== 'string') {
    res.status(400).json({ error: 'Request body must include a non-empty "item" string' });
    return;
  }

  try {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Shopping List'!A:B",
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[new Date().toISOString(), item]],
      },
    });

    res.status(200).json({ success: true, item });
  } catch (err) {
    console.error('Failed to append row:', err);
    res.status(500).json({ error: 'Failed to add item', details: err.message });
  }
};
