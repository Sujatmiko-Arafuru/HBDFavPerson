export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    res.status(500).json({ error: 'Telegram credentials not configured' });
    return;
  }

  try {
    const body = req.body || await new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        if (!raw) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(error);
        }
      });
      req.on('error', reject);
    });

    const { message } = body || {};
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    const data = await telegramRes.json();
    if (!telegramRes.ok || !data.ok) {
      res.status(502).json({ error: 'Telegram API error', details: data });
      return;
    }

    res.status(200).json({ success: true, result: data.result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send Telegram message', details: error.message });
  }
}
