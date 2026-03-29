const { sendNotification } = require('../schemas');
const deviceQueries = require('../db/deviceQueries');

async function notify(req, res) {
  const parsed = sendNotification.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { title, body } = parsed.data;
  const tokens = await deviceQueries.findAllTokens();

  if (tokens.length === 0) {
    return res.json({ sent: 0, message: 'No registered devices' });
  }

  // Expo Push API accepts batches of up to 100
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
  }));

  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let totalSent = 0;
  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (response.ok) {
      totalSent += chunk.length;
    }
  }

  res.json({ sent: totalSent, total: tokens.length });
}

module.exports = { notify };
