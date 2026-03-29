const { sendNotification } = require('../schemas');
const deviceQueries = require('../db/deviceQueries');
const notificationQueries = require('../db/notificationQueries');

async function notify(req, res) {
  const parsed = sendNotification.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { title, body } = parsed.data;

  // Store notification for all users
  const stored = await notificationQueries.createForAllUsers(title, body);

  // Send push to all registered devices
  const tokens = await deviceQueries.findAllTokens();

  let totalSent = 0;
  if (tokens.length > 0) {
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
  }

  res.json({ sent: totalSent, stored, total: tokens.length });
}

module.exports = { notify };
