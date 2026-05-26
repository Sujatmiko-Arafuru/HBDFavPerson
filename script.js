const patternGrid = document.getElementById('patternGrid');
const patternCanvas = document.getElementById('patternCanvas');
const patternFrame = document.querySelector('.pattern-frame');
const mainContainer = document.getElementById('mainContainer');
const typewriterPanel = document.getElementById('typewriterPanel');
const typewriterStage = document.getElementById('typewriterStage');
const typewriterText = document.getElementById('typewriterText');
const messageComplete = document.getElementById('messageComplete');
const messageParagraph = document.getElementById('messageParagraph');
const lockCard = document.querySelector('.lock-card');
const bgVideo = document.querySelector('.bg-video');

const TYPEWRITER_SENTENCES = [
  'Kalau pesan ini sampai ke kamu makasih ya buat siapapun yang nerusin!',
  'Hallo Oin ^_^, lama ngga ketemu...',
  'Selamat ulang tahun yaa Oin. Udah 21 nihhh wkwkwkwk. Tapi bentar jangan tutup dulu...',
  'Dari kecil sampai kuliah, kita pernah jalan bareng di satu cerita sek panjang walaupun endingnya ytta wkwkwkw',
  'Kesalahan semuanya memang di aku, aku juga menyesal dan berproses untuk kembali ke Tuhan yang tentunya bakal duowo perjalanan e.',
  'Aku itu domba hilang tapi aku juga bakal ngingatin domba hilang lainnya, kalau Yesus itu gembala yang setia.',
  '"Seperti pelangi setelah hujan, kiranya hidupmu penuh warna kasih dan pengharapan."',
  'Aku selalu di ingatin Pastorku (PS Sam) kalau kasih Kristus itu lebih besar dari segala luka, dan Ia akan selalu menjagamu.',
  'Happy Birthday, my first and my last love ^^',
  'Btw aku juga ada diary di X sek cmn kamu yang bisa liat kalau mau... walaupun aku ragu wkwkw... HBD!!!!!',
  'From the worst person you have ever known... "Angelio Asa Triatmaja"',
];

const dots = [...patternGrid.querySelectorAll('.dot')];

let typewriterTimeline = null;
let sentenceIndex = 0;

const correctPattern = ['1', '8', '5', '3'];
let currentPattern = [];
let isDrawing = false;
let pointerPos = null;
let activePointerId = null;
let patternState = 'drawing';
let isUnlocked = false;
let isAnimatingError = false;
let dotCenters = {};
let frameRectCache = null;
let drawScheduled = false;
let confettiTickerActive = false;

const ctx = patternCanvas.getContext('2d');

// --- Confetti System ---
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
const confettiColors = ['#ffd700', '#ff5e62', '#ff9966', '#ffb347', '#ff4b5c', '#48dbfb', '#1dd1a1'];

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

class ConfettiParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = gsap.utils.random(8, 14);
    const angle = gsap.utils.random(-Math.PI * 0.15, -Math.PI * 0.85);
    const speed = gsap.utils.random(10, 24);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.gravity = 0.35;
    this.friction = 0.97;
    this.color = gsap.utils.random(confettiColors);
    this.opacity = 1;
    this.rotation = gsap.utils.random(0, 360);
    this.rotationSpeed = gsap.utils.random(-8, 8);
    this.shape = gsap.utils.random(['circle', 'square', 'triangle']);
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.opacity -= 0.012;
  }

  draw() {
    confettiCtx.save();
    confettiCtx.translate(this.x, this.y);
    confettiCtx.rotate((this.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = this.opacity;
    confettiCtx.fillStyle = this.color;

    confettiCtx.beginPath();
    if (this.shape === 'circle') {
      confettiCtx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    } else if (this.shape === 'square') {
      confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      confettiCtx.moveTo(0, -this.size / 2);
      confettiCtx.lineTo(this.size / 2, this.size / 2);
      confettiCtx.lineTo(-this.size / 2, this.size / 2);
      confettiCtx.closePath();
      confettiCtx.fill();
    }
    confettiCtx.restore();
  }
}

function startConfettiLoop() {
  if (confettiTickerActive) return;
  confettiTickerActive = true;
  gsap.ticker.add(updateConfetti);
}

function stopConfettiLoop() {
  if (!confettiTickerActive) return;
  confettiTickerActive = false;
  gsap.ticker.remove(updateConfetti);
}

function spawnConfetti(x, y, count = 100) {
  startConfettiLoop();
  for (let i = 0; i < count; i++) {
    confettiParticles.push(new ConfettiParticle(x, y));
  }
}

function updateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.update();
    p.draw();
    if (p.opacity <= 0 || p.y > confettiCanvas.height) {
      confettiParticles.splice(i, 1);
    }
  }

  if (!confettiParticles.length) {
    stopConfettiLoop();
  }
}

// --- Typewriter ---
function stopTypewriter() {
  if (typewriterTimeline) {
    typewriterTimeline.kill();
    typewriterTimeline = null;
  }
}

function showCompleteMessage() {
  stopTypewriter();
  messageParagraph.textContent = TYPEWRITER_SENTENCES.join(' ');
  typewriterPanel.classList.add('is-complete');
  mainContainer.classList.add('is-message-complete');

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.to(typewriterStage, {
    opacity: 0,
    duration: 0.8,
    onComplete: () => {
      typewriterStage.classList.add('hidden');
    },
  });
  tl.set(messageComplete, { opacity: 0 });
  tl.call(() => messageComplete.classList.remove('hidden'));
  tl.to(messageComplete, { opacity: 1, duration: 1.1 }, '-=0.15');
}

function playTypewriterSentence() {
  if (sentenceIndex >= TYPEWRITER_SENTENCES.length) {
    showCompleteMessage();
    return;
  }

  const sentence = TYPEWRITER_SENTENCES[sentenceIndex];
  sentenceIndex += 1;

  stopTypewriter();
  typewriterText.textContent = '';

  const typingProxy = { progress: 0 };
  const isLastSentence = sentenceIndex >= TYPEWRITER_SENTENCES.length;
  typewriterTimeline = gsap.timeline({
    onComplete: () => {
      gsap.to(typewriterText, {
        opacity: 0,
        duration: 2.2,
        ease: 'power1.inOut',
        delay: 1.4,
        onComplete: () => {
          if (isLastSentence) {
            showCompleteMessage();
          } else {
            gsap.delayedCall(0.9, playTypewriterSentence);
          }
        },
      });
    },
  });

  typewriterTimeline
    .set(typewriterText, { opacity: 0 })
    .to(typewriterText, { opacity: 1, duration: 1.4, ease: 'power2.out' })
    .to(typingProxy, {
      progress: 1,
      duration: sentence.length * 0.048,
      ease: 'none',
      onUpdate: () => {
        const count = Math.floor(typingProxy.progress * sentence.length);
        typewriterText.textContent = sentence.slice(0, count);
      },
    }, '-=0.6')
    .to({}, { duration: 2.8 });
}

function startTypewriter() {
  sentenceIndex = 0;
  stopTypewriter();
  playTypewriterSentence();
}

// --- Pattern Canvas Core ---
function cacheLayout() {
  frameRectCache = patternFrame.getBoundingClientRect();
  const hitRadius = Math.max(22, (frameRectCache.width / 3) * 0.28);
  dotCenters = {};

  dots.forEach((dot) => {
    const dotRect = dot.getBoundingClientRect();
    dotCenters[dot.dataset.value] = {
      x: dotRect.left + dotRect.width / 2 - frameRectCache.left,
      y: dotRect.top + dotRect.height / 2 - frameRectCache.top,
      hitRadius,
    };
  });
}

function resizeCanvas() {
  cacheLayout();
  const rect = frameRectCache;
  patternCanvas.width = rect.width * window.devicePixelRatio;
  patternCanvas.height = rect.height * window.devicePixelRatio;
  patternCanvas.style.width = `${rect.width}px`;
  patternCanvas.style.height = `${rect.height}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  drawPattern();
}

function getPointerCoords(event) {
  return { x: event.clientX, y: event.clientY };
}

function getDotFromCoords(clientX, clientY) {
  if (!frameRectCache) cacheLayout();
  const localX = clientX - frameRectCache.left;
  const localY = clientY - frameRectCache.top;

  for (const dot of dots) {
    const center = dotCenters[dot.dataset.value];
    if (!center) continue;
    const dx = localX - center.x;
    const dy = localY - center.y;
    const radius = center.hitRadius;
    if (dx * dx + dy * dy <= radius * radius) {
      return dot;
    }
  }
  return null;
}

function drawPattern() {
  const w = patternCanvas.width / window.devicePixelRatio;
  const h = patternCanvas.height / window.devicePixelRatio;
  ctx.clearRect(0, 0, w, h);
  if (!currentPattern.length) return;

  if (patternState === 'success') {
    ctx.strokeStyle = 'rgba(29, 209, 161, 0.95)';
  } else if (patternState === 'error') {
    ctx.strokeStyle = 'rgba(255, 95, 122, 0.95)';
  } else {
    ctx.strokeStyle = 'rgba(38, 198, 218, 0.95)';
  }
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  const points = currentPattern
    .map((value) => dotCenters[value])
    .filter(Boolean);

  if (!points.length) return;
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));

  if (pointerPos) {
    ctx.lineTo(pointerPos.x, pointerPos.y);
  }

  ctx.stroke();
}

function schedulePatternRedraw() {
  if (drawScheduled) return;
  drawScheduled = true;
  requestAnimationFrame(() => {
    drawScheduled = false;
    drawPattern();
  });
}

function resetPattern() {
  currentPattern = [];
  isDrawing = false;
  pointerPos = null;
  patternState = 'drawing';
  dots.forEach((dot) => {
    dot.classList.remove('active', 'success', 'error');
  });
  drawPattern();
}

function releasePointerCapture(event) {
  if (activePointerId === null) return;
  try {
    if (patternGrid.hasPointerCapture(activePointerId)) {
      patternGrid.releasePointerCapture(activePointerId);
    }
  } catch (_) {
    // pointer may already be released
  }
  activePointerId = null;
}

function addDot(dot) {
  const value = dot.dataset.value;
  if (!value || currentPattern.includes(value)) return;
  currentPattern.push(value);
  dot.classList.add('active');
  schedulePatternRedraw();
}

function updatePointerPosition(event) {
  if (!frameRectCache) cacheLayout();
  const { x, y } = getPointerCoords(event);
  pointerPos = {
    x: x - frameRectCache.left,
    y: y - frameRectCache.top,
  };
}

function endDrawing(event) {
  if (!isDrawing) return;
  releasePointerCapture(event);
  isDrawing = false;
  pointerPos = null;
  drawPattern();
  handlePatternEnd();
}

// --- Transitions ---
function showMessageWithTransition() {
  spawnConfetti(window.innerWidth / 2, window.innerHeight * 0.55, 130);
  setTimeout(() => {
    spawnConfetti(0, window.innerHeight, 70);
    spawnConfetti(window.innerWidth, window.innerHeight, 70);
  }, 250);

  mainContainer.classList.add('is-unlocked');
  typewriterPanel.classList.remove('hidden');
  gsap.set(typewriterPanel, { opacity: 0, x: -40 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to(lockCard, {
    opacity: 0,
    scale: 0.9,
    y: -30,
    duration: 0.65,
    pointerEvents: 'none',
    onComplete: () => {
      lockCard.classList.add('hidden');
    },
  });

  tl.to(typewriterPanel, {
    opacity: 1,
    x: 0,
    duration: 1.1,
    onComplete: startTypewriter,
  }, '-=0.25');
}

function triggerPatternSuccess() {
  isUnlocked = true;
  patternState = 'success';
  isDrawing = false;
  pointerPos = null;
  drawPattern();

  dots.filter((dot) => dot.classList.contains('active')).forEach((dot) => {
    dot.classList.add('success');
  });

  gsap.to('.dot.active', {
    scale: 1.15,
    duration: 0.2,
    yoyo: true,
    repeat: 1,
    ease: 'power1.inOut',
  });

  setTimeout(() => {
    console.log('pattern success - calling sendTelegramLog');
    showMessageWithTransition();
    sendTelegramLog();
  }, 400);
}

function triggerPatternError() {
  if (isAnimatingError) return;
  isAnimatingError = true;
  patternState = 'error';
  isDrawing = false;
  pointerPos = null;
  drawPattern();

  dots.filter((dot) => dot.classList.contains('active')).forEach((dot) => {
    dot.classList.add('error');
  });

  gsap.fromTo(
    lockCard,
    { x: -8 },
    {
      x: 8,
      duration: 0.08,
      repeat: 5,
      yoyo: true,
      onComplete: () => {
        lockCard.style.transform = 'none';
        isAnimatingError = false;
        resetPattern();
      },
    },
  );
}

function handlePatternEnd() {
  if (!currentPattern.length) return;

  if (currentPattern.length !== correctPattern.length) {
    triggerPatternError();
    return;
  }

  const isMatch = currentPattern.every((value, index) => value === correctPattern[index]);
  if (isMatch) {
    triggerPatternSuccess();
  } else {
    triggerPatternError();
  }
}

// --- Event Listeners ---
patternGrid.addEventListener('pointerdown', (event) => {
  if (isUnlocked || isAnimatingError) return;

  const { x, y } = getPointerCoords(event);
  const dot = getDotFromCoords(x, y) || event.target.closest('.dot');
  if (!dot) return;

  event.preventDefault();
  patternState = 'drawing';
  resetPattern();
  isDrawing = true;
  activePointerId = event.pointerId;

  try {
    patternGrid.setPointerCapture(event.pointerId);
  } catch (_) {
    // capture not supported; window listeners still work
  }

  addDot(dot);
});

patternGrid.addEventListener('pointermove', (event) => {
  if (!isDrawing || event.pointerId !== activePointerId) return;
  event.preventDefault();
  updatePointerPosition(event);
  const { x, y } = getPointerCoords(event);
  const dot = getDotFromCoords(x, y);
  if (dot) addDot(dot);
  schedulePatternRedraw();
});

patternGrid.addEventListener('pointerup', (event) => {
  if (!isDrawing || (activePointerId !== null && event.pointerId !== activePointerId)) return;
  endDrawing(event);
});

patternGrid.addEventListener('pointercancel', (event) => {
  if (!isDrawing || (activePointerId !== null && event.pointerId !== activePointerId)) return;
  releasePointerCapture(event);
  isDrawing = false;
  resetPattern();
});

window.addEventListener('pointerup', (event) => {
  if (!isDrawing || activePointerId === null || event.pointerId !== activePointerId) return;
  endDrawing(event);
});

window.addEventListener('pointercancel', (event) => {
  if (!isDrawing || activePointerId === null || event.pointerId !== activePointerId) return;
  releasePointerCapture(event);
  isDrawing = false;
  resetPattern();
});

let resizeRaf = null;
window.addEventListener('resize', () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    resizeCanvas();
    resizeConfettiCanvas();
  });
});

function initBackgroundVideo() {
  if (!bgVideo) return;
  const playVideo = () => {
    bgVideo.play().catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(playVideo, { timeout: 1500 });
  } else {
    setTimeout(playVideo, 300);
  }
}

function init() {
  resizeConfettiCanvas();
  resizeCanvas();
  initBackgroundVideo();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Bot Alert Telegram
async function sendTelegramLog() {
  console.log('sendTelegramLog started');
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    console.log('ipapi returned', data);

    const device = navigator.userAgent;
    const time = new Date().toLocaleString();

    const message = `
🔓 Pattern Unlock Berhasil

🌍 IP: ${data.ip}
🏙 Kota: ${data.city}
🌎 Negara: ${data.country_name}

💻 Device:
${device}

⏰ Jam:
${time}
    `;

    const telegramResponse = await fetch('/api/telegram-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    console.log('telegram api request status', telegramResponse.status);

    if (!telegramResponse.ok) {
      const errorBody = await telegramResponse.text();
      console.error('Telegram proxy error:', telegramResponse.status, errorBody);
    }
  } catch (error) {
    console.error('sendTelegramLog failed:', error);
  }
}