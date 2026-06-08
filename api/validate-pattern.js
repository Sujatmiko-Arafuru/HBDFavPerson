const correctPattern = ['1', '8', '5', '3'];

const TYPEWRITER_SENTENCES = [
  'Kalau pesan ini sampai ke kamu makasih ya buat siapapun yang nerusin!',
  'Hallo Oin ^_^, lama ngga ketemu...',
  'Selamat ulang tahun yaa Oin. Udah 21 nihhh wkwkwkwk. Tapi bentar jangan tutup dulu...',
  'Dari kecil sampai kuliah, kita pernah jalan bareng di satu cerita sek panjang walaupun endingnya ytta wkwk.',
  'Kesalahan semuanya memang di aku, aku juga menyesal dan berproses untuk kembali ke Tuhan yang tentunya bakal duowo perjalanan e.',
  'Aku itu domba hilang tapi aku juga bakal ngingatin domba hilang lainnya, kalau Yesus itu gembala yang setia.',
  '"Seperti pelangi setelah hujan, kiranya hidupmu penuh warna kasih dan pengharapan."',
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { pattern } = body || {};

    if (!pattern || !Array.isArray(pattern)) {
      res.status(400).json({ error: 'Pattern is required and must be an array' });
      return;
    }

    const isMatch = pattern.length === correctPattern.length &&
      pattern.every((val, idx) => val === correctPattern[idx]);

    if (isMatch) {
      res.status(200).json({
        success: true,
        sentences: TYPEWRITER_SENTENCES,
        assets: SECRET_ASSETS
      });
    } else {
      res.status(200).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
