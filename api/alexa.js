const { google } = require('googleapis');

async function appendItem(item) {
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
}

// Builds the plain JSON shape Alexa expects back from any request.
function alexaResponse(speechText, { endSession = true, reprompt } = {}) {
  const response = {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text: speechText },
      shouldEndSession: endSession,
    },
  };
  if (reprompt) {
    response.response.reprompt = {
      outputSpeech: { type: 'PlainText', text: reprompt },
    };
  }
  return response;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const body = req.body || {};
  const requestType = body.request && body.request.type;

  try {
    if (requestType === 'LaunchRequest') {
      res.status(200).json(
        alexaResponse('Welcome to your shopping list. What would you like to add?', {
          endSession: false,
          reprompt: 'What would you like to add?',
        })
      );
      return;
    }

    if (requestType === 'IntentRequest') {
      const intentName = body.request.intent && body.request.intent.name;

      if (intentName === 'AddItemIntent') {
        const slots = body.request.intent.slots || {};
        const item = slots.Item && slots.Item.value;

        if (!item) {
          res.status(200).json(
            alexaResponse("Sorry, I didn't catch what to add. What would you like to add?", {
              endSession: false,
              reprompt: 'What would you like to add?',
            })
          );
          return;
        }

        await appendItem(item);
        res.status(200).json(alexaResponse(`Added ${item} to your list.`));
        return;
      }

      if (intentName === 'AMAZON.HelpIntent') {
        res.status(200).json(
          alexaResponse('Just tell me an item to add, like "add milk", and I\'ll put it on your shopping list.', {
            endSession: false,
            reprompt: 'What would you like to add?',
          })
        );
        return;
      }

      if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        res.status(200).json(alexaResponse('Okay, goodbye.'));
        return;
      }
    }

    if (requestType === 'SessionEndedRequest') {
      res.status(200).json({ version: '1.0', response: {} });
      return;
    }

    // Fallback for anything unrecognized
    res.status(200).json(
      alexaResponse("Sorry, I didn't understand that. Try saying add, then an item.", {
        endSession: false,
      })
    );
  } catch (err) {
    console.error('Alexa handler error:', err);
    res.status(200).json(alexaResponse("Sorry, I couldn't add that to your list right now."));
  }
};
