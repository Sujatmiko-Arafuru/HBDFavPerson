const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../frontend');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

function sendTelegramMessage(message) {
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(responseBody);
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json });
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const correctPattern = ['1', '8', '5', '3'];

const TYPEWRITER_SENTENCES = [
  'Kalau pesan ini sampai ke kamu makasih ya buat siapapun yang nerusin!',
  'Hallo Oin ^_^, lama ngga ketemu...',
  'Selamat ulang tahun yaa Oin. Udah 21 nihhh wkwkwkwk. Tapi bentar jangan tutup dulu...',
  'Dari kecil sampai kuliah, kita pernah jalan bareng di satu cerita sek panjang walaupun endingnya ytta wkwk.',
  'Kesalahan semuanya memang di aku, aku juga menyesal dan berproses untuk kembali ke Tuhan yang tentunya bakal duowo perjalanan e.',
  'Aku itu domba hilang tapi aku juga bakal ngingatin domba hilang lainnya, kalau Yesus itu gembala yang setia.',
  '"Such a rainbow after rain, may your life be full of color, love, and hope."',
  'Aku selalu di ingatin Pastorku (PS Sam) kalau kasih Kristus itu lebih besar dari segala luka, dan Ia akan selalu menjagamu.',
  'Happy Birthday, my first and my last love ^^',
  'Btw aku juga ada diary di X sek cmn kamu yang bisa liat kalau mau... walaupun aku ragu wkwkw... HBD!!!!!',
  'From the worst person you have ever known... "Angelio Asa Triatmaja"',
];

const SECRET_ASSETS = {
  photoUrl: '/secret_assets/jesus_b4a1c5d6e2.png',
  videoUrl: '/secret_assets/system_vid_9f8d7c.mp4',
  audioUrl: '/secret_assets/yorushika_liar_2e1a3b.mp3'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // POST /api/validate-pattern
  if (req.method === 'POST' && parsedUrl.pathname === '/api/validate-pattern') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const { pattern } = JSON.parse(body || '{}');
        const isMatch = pattern && Array.isArray(pattern) &&
          pattern.length === correctPattern.length &&
          pattern.every((val, idx) => val === correctPattern[idx]);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (isMatch) {
          res.end(JSON.stringify({
            success: true,
            sentences: TYPEWRITER_SENTENCES,
            assets: SECRET_ASSETS
          }));
        } else {
          res.end(JSON.stringify({ success: false }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to validate pattern', details: error.message }));
      }
    });
    return;
  }

  // POST /api/telegram-log
  if (req.method === 'POST' && parsedUrl.pathname === '/api/telegram-log') {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Telegram credentials not configured' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body || '{}');
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'message is required' }));
          return;
        }

        const telegramResponse = await sendTelegramMessage(message);
        const telegramData = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Telegram API error', details: telegramData }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result: telegramData.result }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to send Telegram message', details: error.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(PUBLIC_DIR, parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname);

  if (!path.extname(filePath)) {
    filePath += '.html';
  }

  serveStaticFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
