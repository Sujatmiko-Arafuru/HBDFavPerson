const patternGrid = document.getElementById('patternGrid');
const introSplash = document.getElementById('introSplash');
const introSplashContent = document.getElementById('introSplashContent');
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
const skipToNotificationBtn = document.getElementById('skipToNotification');
const notificationOverlay = document.getElementById('notificationOverlay');
const notificationReveal = document.getElementById('notificationReveal');
const notificationBarTop = document.getElementById('notificationBarTop');
const notificationBarBottom = document.getElementById('notificationBarBottom');
const notificationPanel = document.getElementById('notificationPanel');
const notificationGlitch = document.getElementById('notificationGlitch');
const notificationEnergy = notificationPanel?.querySelector('.notification-energy');
const notificationBox = document.getElementById('notificationBox');
const notificationInner = document.getElementById('notificationInner');
const notificationBody = document.getElementById('notificationBody');
const notificationButtonsWrap = document.querySelector('.notification-buttons');
const notificationCancel = document.getElementById('notificationCancel');
const notificationContinue = document.getElementById('notificationContinue');
const notificationSound = document.getElementById('notificationSound');
const notificationVideoOverlay = document.getElementById('notificationVideoOverlay');
const notificationVideo = document.getElementById('notificationVideo');
const videoFinishBtn = document.getElementById('videoFinishBtn');
const notificationFrameLines = notificationBox
  ? [...notificationBox.querySelectorAll('.notification-frame-line')]
  : [];
const notificationGlitchSlices = notificationGlitch
  ? [...notificationGlitch.querySelectorAll('.notification-glitch-slice')]
  : [];
const notificationParticles = notificationBox
  ? [...notificationBox.querySelectorAll('.notification-particle')]
  : [];
let notificationGlowTween = null;
let notificationEntranceTimeline = null;
let notificationBusy = false;

const NOTIFICATION_MESSAGES = {
  primary: 'Angelio Asa Triatmaja has sent a live birthday message, and you can watch it. Would you like to open it?',
  thankYou: 'Thank you for your answer! You can still access this website as many times as you like. Have a nice day!',
  afterVideo: 'Thank you for watching! Angelio Asa Triatmaja would really appreciate it, as he spent 2 months creating this website just for you. Have a great day!',
};

const REFUSE_THANKYOU_DISPLAY_MS = 4500;
const AFTER_VIDEO_EPILOGUE_DISPLAY_MS = 8500;

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
let typewriterRunId = 0;

const correctPattern = ['1', '2', '3', '4'];
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

function disableConfetti() {
  stopConfettiLoop();
  confettiParticles = [];
  try {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  } catch (_) {
    // ignore canvas errors
  }
  if (confettiCanvas) confettiCanvas.style.display = 'none';
}

// --- Typewriter ---
function stopTypewriter() {
  if (typewriterTimeline) {
    typewriterTimeline.kill();
    typewriterTimeline = null;
  }
}

function invalidateTypewriter() {
  typewriterRunId += 1;
  stopTypewriter();
  gsap.killTweensOf([typewriterText, typewriterStage, typewriterPanel]);
}

function resetTypewriterState() {
  invalidateTypewriter();
  sentenceIndex = 0;

  if (typewriterText) {
    typewriterText.textContent = '';
    gsap.set(typewriterText, { opacity: 1, clearProps: 'transform' });
  }

  typewriterStage?.classList.remove('hidden');
  messageComplete?.classList.add('hidden');
  typewriterPanel?.classList.remove('is-complete');
}

function resetNotificationVisualState() {
  stopNotificationEffects();

  gsap.killTweensOf([
    notificationOverlay,
    notificationReveal,
    notificationBarTop,
    notificationBarBottom,
    notificationPanel,
    notificationBox,
    notificationInner,
    notificationFrameLines,
    notificationGlitchSlices,
    notificationParticles,
    ...(notificationBox ? notificationBox.querySelectorAll('.notification-btn') : []),
  ]);

  notificationPanel?.classList.remove('is-glitching');
  notificationGlitch?.classList.remove('is-active');
  notificationEnergy?.classList.remove('is-live');
  notificationBarTop?.classList.remove('is-pulsing');
  notificationBarBottom?.classList.remove('is-pulsing');

  gsap.set(notificationOverlay, { opacity: 0 });
  gsap.set(notificationReveal, { opacity: 1, scale: 1 });
  gsap.set([notificationBarTop, notificationBarBottom], {
    opacity: 0,
    scaleX: 0.12,
    y: 0,
    filter: 'brightness(1.4)',
  });
  gsap.set(notificationPanel, { height: 0, opacity: 0 });
  gsap.set(notificationBox, { opacity: 0, x: 0, skewX: 0, filter: 'none' });
  gsap.set(notificationInner, { opacity: 0, y: 12 });
  gsap.set(notificationFrameLines, { opacity: 0, scaleY: 0 });
  gsap.set(notificationGlitchSlices, { opacity: 0, top: '20%' });
  gsap.set(notificationParticles, { opacity: 0 });
}

function runGlitchBurst() {
  if (!notificationPanel || !notificationBox) return;

  notificationPanel.classList.add('is-glitching');
  notificationGlitch?.classList.add('is-active');

  const glitchTl = gsap.timeline({
    onComplete: () => {
      notificationPanel.classList.remove('is-glitching');
      notificationGlitch?.classList.remove('is-active');
      gsap.set(notificationBox, { x: 0, skewX: 0 });
      gsap.set(notificationGlitchSlices, { opacity: 0 });
    },
  });

  for (let i = 0; i < 14; i += 1) {
    glitchTl.to(notificationBox, {
      x: gsap.utils.random(-14, 14),
      skewX: gsap.utils.random(-5, 5),
      duration: 0.035,
      ease: 'none',
    }, i * 0.04);
    glitchTl.to(notificationGlitchSlices, {
      opacity: gsap.utils.random(0.25, 0.95),
      top: `${gsap.utils.random(2, 88)}%`,
      duration: 0.03,
      ease: 'steps(1)',
    }, i * 0.04);
  }

  glitchTl.to(notificationBox, { x: 0, skewX: 0, duration: 0.05 });
  return glitchTl;
}

function clearNotificationGlitchAndBlink() {
  notificationPanel?.classList.remove('is-glitching');
  notificationGlitch?.classList.remove('is-active');
  gsap.set(notificationBox, { opacity: 1, x: 0, skewX: 0, filter: 'none' });
  gsap.set(notificationGlitchSlices, { opacity: 0 });
}

function finalizeNotificationEntrance() {
  clearNotificationGlitchAndBlink();
  startNotificationAmbientEffects();
}

function startNotificationAmbientEffects() {
  notificationBarTop?.classList.add('is-pulsing');
  notificationBarBottom?.classList.add('is-pulsing');
  notificationEnergy?.classList.add('is-live');

  if (notificationGlowTween) notificationGlowTween.kill();
  notificationGlowTween = gsap.to(notificationBox, {
    boxShadow: '0 0 48px rgba(123, 47, 247, 0.55), 0 0 90px rgba(0, 229, 255, 0.22), inset 0 0 70px rgba(30, 0, 255, 0.14)',
    repeat: -1,
    yoyo: true,
    duration: 2,
    ease: 'sine.inOut',
  });

  gsap.to(notificationParticles, {
    opacity: 0.7,
    y: '-=24',
    x: '+=16',
    repeat: -1,
    yoyo: true,
    duration: 3,
    stagger: 0.3,
    ease: 'power1.inOut',
  });
}

function stopNotificationEffects() {
  if (notificationEntranceTimeline) {
    notificationEntranceTimeline.kill();
    notificationEntranceTimeline = null;
  }
  if (notificationGlowTween) {
    notificationGlowTween.kill();
    notificationGlowTween = null;
  }

  gsap.killTweensOf(notificationParticles);
  notificationPanel?.classList.remove('is-glitching');
  notificationGlitch?.classList.remove('is-active');
  notificationEnergy?.classList.remove('is-live');
  notificationBarTop?.classList.remove('is-pulsing');
  notificationBarBottom?.classList.remove('is-pulsing');
}

function setNotificationButtonsVisible(visible) {
  notificationButtonsWrap?.classList.toggle('hidden', !visible);
}

function setNotificationButtonsDisabled(disabled) {
  if (notificationCancel) notificationCancel.disabled = disabled;
  if (notificationContinue) notificationContinue.disabled = disabled;
}

function playNotificationSound() {
  if (!notificationSound) return;
  notificationSound.currentTime = 0;
  notificationSound.play().catch(() => {});
}

function closeNotificationOverlay() {
  notificationOverlay?.classList.remove('is-visible');
  notificationOverlay?.classList.add('hidden');
  resetNotificationVisualState();
}

function animateNotificationOut() {
  return new Promise((resolve) => {
    if (!notificationOverlay) {
      resolve();
      return;
    }

    stopNotificationEffects();
    clearNotificationGlitchAndBlink();

    const buttons = notificationBox?.querySelectorAll('.notification-btn') ?? [];
    const panelHeight = notificationPanel.offsetHeight || measureNotificationPanelHeight();
    gsap.set(notificationPanel, { height: panelHeight });

    const tl = gsap.timeline({ onComplete: resolve });

    tl.to(buttons, { opacity: 0, y: 10, duration: 0.2, stagger: 0.05 });
    tl.to(notificationInner, { opacity: 0, y: 8, duration: 0.22 }, '-=0.12');
    tl.to(notificationFrameLines, { opacity: 0, scaleY: 0, duration: 0.28, stagger: 0.05 }, '-=0.15');
    tl.to(notificationBox, {
      opacity: 0,
      filter: 'blur(8px) brightness(0.8)',
      duration: 0.28,
    }, '-=0.2');
    tl.to(notificationPanel, {
      height: 0,
      opacity: 0,
      duration: 0.82,
      ease: 'power3.inOut',
    });
    tl.to([notificationBarTop, notificationBarBottom], {
      opacity: 0,
      scaleX: 0.08,
      filter: 'brightness(1.6)',
      duration: 0.38,
      ease: 'power2.in',
      stagger: 0.06,
    }, '-=0.42');
    tl.to(notificationOverlay, { opacity: 0, duration: 0.4, ease: 'power2.in' }, '-=0.12');
  });
}

function hideNotification() {
  if (!notificationOverlay || notificationBusy) return;

  notificationBusy = true;
  setNotificationButtonsDisabled(true);

  animateNotificationOut().then(() => {
    closeNotificationOverlay();
    setNotificationButtonsDisabled(false);
    notificationBusy = false;
  });
}

function hideIntroSplash() {
  document.body.classList.remove('intro-active');
  if (!introSplash) return;

  gsap.killTweensOf([introSplash, introSplashContent]);
  gsap.set(introSplash, { opacity: 0, display: 'none' });
  gsap.set(introSplashContent, { opacity: 0, y: 0 });
}

function playIntroSplashAnimation() {
  return new Promise((resolve) => {
    if (!introSplash || !introSplashContent) {
      resolve();
      return;
    }

    document.body.classList.add('intro-active');
    gsap.set(introSplash, { display: 'flex', opacity: 1 });
    gsap.set(introSplashContent, { opacity: 0, y: 14 });

    const tl = gsap.timeline({
      onComplete: () => {
        hideIntroSplash();
        resolve();
      },
    });

    tl.to(introSplashContent, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power2.out',
    });
    tl.to({}, { duration: 2.4 });
    tl.to(introSplashContent, {
      opacity: 0,
      y: -10,
      duration: 0.75,
      ease: 'power2.in',
    });
    tl.to(introSplash, {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.inOut',
    });
  });
}

function resetToLockScreen() {
  isUnlocked = false;
  resetTypewriterState();
  resetPattern();
  hideIntroSplash();

  if (notificationBody) notificationBody.textContent = NOTIFICATION_MESSAGES.primary;
  setNotificationButtonsVisible(true);

  typewriterPanel?.classList.add('hidden');
  lockCard?.classList.remove('hidden');
  mainContainer?.classList.remove('hidden');
  mainContainer?.classList.remove('is-unlocked', 'is-message-complete');

  gsap.set(mainContainer, { opacity: 1, clearProps: 'padding' });
  gsap.set(lockCard, {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    pointerEvents: 'auto',
    clearProps: 'transform',
  });
  gsap.set(typewriterPanel, { opacity: 0, x: 0, clearProps: 'transform' });

  skipToNotificationBtn?.classList.add('hidden');
}

function hideNotificationVideo() {
  return new Promise((resolve) => {
    if (!notificationVideoOverlay) {
      resolve();
      return;
    }

    notificationVideo?.pause();
    videoFinishBtn?.classList.add('hidden');

    gsap.to(notificationVideoOverlay, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        notificationVideoOverlay.classList.remove('is-visible');
        notificationVideoOverlay.classList.add('hidden');
        bgVideo?.play().catch(() => {});
        resolve();
      },
    });
  });
}

function showNotificationVideo() {
  if (!notificationVideoOverlay || !notificationVideo) return;

  skipToNotificationBtn?.classList.add('hidden');
  videoFinishBtn?.classList.remove('hidden');

  notificationVideoOverlay.classList.remove('hidden');
  notificationVideoOverlay.classList.add('is-visible');
  gsap.set(notificationVideoOverlay, { opacity: 0 });
  gsap.to(notificationVideoOverlay, { opacity: 1, duration: 0.85, ease: 'power2.out' });

  notificationVideo.currentTime = 0;
  notificationVideo.play().catch(() => {});
  bgVideo?.pause();
}

async function runEpilogueNotificationAndReturnToLock(message, displayMs = REFUSE_THANKYOU_DISPLAY_MS) {
  await showNotification({
    message,
    showButtons: false,
    playSound: true,
  });

  await new Promise((resolve) => {
    gsap.delayedCall(displayMs / 1000, resolve);
  });

  await animateNotificationOut();
  closeNotificationOverlay();

  mainContainer?.classList.add('hidden');
  typewriterPanel?.classList.add('hidden');
  lockCard?.classList.add('hidden');

  await playIntroSplashAnimation();
  resetToLockScreen();

  setNotificationButtonsVisible(true);
  setNotificationButtonsDisabled(false);
}

async function handleNotificationRefuse() {
  if (notificationBusy) return;
  notificationBusy = true;
  setNotificationButtonsDisabled(true);

  await animateNotificationOut();
  closeNotificationOverlay();

  await new Promise((resolve) => {
    gsap.delayedCall(0.45, resolve);
  });

  await runEpilogueNotificationAndReturnToLock(NOTIFICATION_MESSAGES.thankYou);
  notificationBusy = false;
}

async function handleVideoFinish() {
  if (notificationBusy) return;
  notificationBusy = true;

  await hideNotificationVideo();

  await new Promise((resolve) => {
    gsap.delayedCall(0.4, resolve);
  });

  await runEpilogueNotificationAndReturnToLock(
    NOTIFICATION_MESSAGES.afterVideo,
    AFTER_VIDEO_EPILOGUE_DISPLAY_MS,
  );
  notificationBusy = false;
}

async function handleNotificationAccept() {
  if (notificationBusy) return;
  notificationBusy = true;
  setNotificationButtonsDisabled(true);

  await animateNotificationOut();
  closeNotificationOverlay();

  await new Promise((resolve) => {
    gsap.delayedCall(0.35, resolve);
  });

  showNotificationVideo();
  notificationBusy = false;
}

function measureNotificationPanelHeight() {
  gsap.set(notificationPanel, { height: 'auto', visibility: 'hidden', opacity: 1 });
  const panelHeight = notificationPanel.offsetHeight;
  gsap.set(notificationPanel, { height: 0, visibility: 'visible', opacity: 0 });
  return panelHeight;
}

function skipToNotification() {
  isUnlocked = true;
  resetTypewriterState();
  disableConfetti();

  gsap.killTweensOf([lockCard, typewriterPanel, mainContainer]);
  lockCard.classList.add('hidden');
  typewriterPanel.classList.add('hidden');
  mainContainer.classList.add('hidden');
  gsap.set([lockCard, typewriterPanel, mainContainer], { opacity: 0 });

  skipToNotificationBtn?.classList.add('hidden');
  showNotification();
}

function showNotification(options = {}) {
  const {
    message = NOTIFICATION_MESSAGES.primary,
    showButtons = true,
    playSound = true,
  } = options;

  if (!notificationOverlay || !notificationBox || !notificationPanel) {
    return Promise.resolve();
  }

  if (notificationBody) notificationBody.textContent = message;
  setNotificationButtonsVisible(showButtons);

  resetNotificationVisualState();
  skipToNotificationBtn?.classList.add('hidden');

  notificationOverlay.classList.remove('hidden');
  notificationOverlay.classList.add('is-visible');

  const panelHeight = measureNotificationPanelHeight();
  const notificationButtons = notificationBox.querySelectorAll('.notification-btn');
  gsap.set(notificationButtons, { opacity: 0, y: 20 });

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        finalizeNotificationEntrance();
        resolve();
      },
    });
    notificationEntranceTimeline = tl;

    tl.to(notificationOverlay, { opacity: 1, duration: 0.45, ease: 'power2.out' });

    tl.fromTo(
      [notificationBarTop, notificationBarBottom],
      { opacity: 0, scaleX: 0.1, filter: 'brightness(2)' },
      {
        opacity: 1,
        scaleX: 1,
        filter: 'brightness(1.25)',
        duration: 0.38,
        ease: 'power2.out',
        stagger: 0.06,
        onStart: () => {
          if (playSound) playNotificationSound();
        },
      },
      '-=0.1',
    );

    tl.to(
      notificationPanel,
      {
        height: panelHeight,
        opacity: 1,
        duration: 0.95,
        ease: 'power3.inOut',
      },
      '+=0.08',
    );

    tl.fromTo(
      notificationBox,
      { opacity: 0, filter: 'blur(8px) brightness(1.6)' },
      { opacity: 1, filter: 'blur(0px) brightness(1)', duration: 0.35, ease: 'power2.out' },
      '-=0.55',
    );
    tl.add(runGlitchBurst, '-=0.2');

    tl.to(
      notificationFrameLines,
      { opacity: 0.9, scaleY: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      '-=0.15',
    );
    tl.to(
      notificationInner,
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' },
      '-=0.35',
    );

    if (showButtons) {
      tl.to(
        notificationButtons,
        {
          opacity: 1,
          y: 0,
          stagger: 0.18,
          duration: 0.55,
          ease: 'back.out(1.7)',
        },
        '-=0.25',
      );
    }

    tl.add(() => runGlitchBurst(), '+=0.15');
  });
}

function showCompleteMessage() {
  const runId = typewriterRunId;
  stopTypewriter();
  disableConfetti();

  gsap.to(typewriterPanel, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      if (runId !== typewriterRunId) return;

      typewriterPanel.classList.add('hidden');
      mainContainer.classList.add('hidden');
      gsap.delayedCall(0.6, () => {
        if (runId !== typewriterRunId) return;
        showNotification({
          message: NOTIFICATION_MESSAGES.primary,
          showButtons: true,
          playSound: true,
        });
      });
    },
  });
}

function playTypewriterSentence() {
  const runId = typewriterRunId;

  if (runId !== typewriterRunId) return;

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
      if (runId !== typewriterRunId) return;

      gsap.to(typewriterText, {
        opacity: 0,
        duration: 2.2,
        ease: 'power1.inOut',
        delay: 1.4,
        onComplete: () => {
          if (runId !== typewriterRunId) return;

          if (isLastSentence) {
            showCompleteMessage();
          } else {
            gsap.delayedCall(0.9, () => {
              if (runId !== typewriterRunId) return;
              playTypewriterSentence();
            });
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
  invalidateTypewriter();
  sentenceIndex = 0;

  if (typewriterText) {
    typewriterText.textContent = '';
    gsap.set(typewriterText, { opacity: 1 });
  }

  typewriterStage?.classList.remove('hidden');
  messageComplete?.classList.add('hidden');
  typewriterPanel?.classList.remove('is-complete');

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
  // user requested: no particle/confetti effects after correct pattern
  disableConfetti();

  skipToNotificationBtn?.classList.remove('hidden');
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

function initNotification() {
  if (skipToNotificationBtn) {
    skipToNotificationBtn.addEventListener('click', skipToNotification);
  }
  if (notificationCancel) {
    notificationCancel.addEventListener('click', handleNotificationRefuse);
  }
  if (notificationContinue) {
    notificationContinue.addEventListener('click', handleNotificationAccept);
  }
  if (videoFinishBtn) {
    videoFinishBtn.addEventListener('click', handleVideoFinish);
  }
}

function runIntroSplash() {
  if (!introSplash || !introSplashContent) {
    document.body.classList.remove('intro-active');
    return Promise.resolve();
  }

  return playIntroSplashAnimation();
}

function init() {
  resizeConfettiCanvas();
  resizeCanvas();
  initBackgroundVideo();
  initNotification();
}

async function boot() {
  await runIntroSplash();
  init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
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