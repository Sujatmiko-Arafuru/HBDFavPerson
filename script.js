const patternGrid = document.getElementById('patternGrid');
const patternCanvas = document.getElementById('patternCanvas');
const patternFrame = document.querySelector('.pattern-frame');
const mainContainer = document.getElementById('mainContainer');
const typewriterPanel = document.getElementById('typewriterPanel');
const typewriterText = document.getElementById('typewriterText');
const lockCard = document.querySelector('.lock-card');

const TYPEWRITER_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
];

let typewriterTimeline = null;
let sentenceIndex = 0;

const correctPattern = ['1', '8', '5', '3'];
let currentPattern = [];
let isDrawing = false;
let pointerPos = null;
let patternState = 'drawing'; // 'drawing', 'success', 'error'
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
    const angle = gsap.utils.random(-Math.PI * 0.15, -Math.PI * 0.85); // shoot upwards
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
    } else { // triangle
      confettiCtx.moveTo(0, -this.size / 2);
      confettiCtx.lineTo(this.size / 2, this.size / 2);
      confettiCtx.lineTo(-this.size / 2, this.size / 2);
      confettiCtx.closePath();
      confettiCtx.fill();
    }
    confettiCtx.restore();
  }
}

function spawnConfetti(x, y, count = 100) {
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
}

// --- Typewriter ---
function stopTypewriter() {
  if (typewriterTimeline) {
    typewriterTimeline.kill();
    typewriterTimeline = null;
  }
}

function playTypewriterSentence() {
  const sentence = TYPEWRITER_SENTENCES[sentenceIndex];
  sentenceIndex = (sentenceIndex + 1) % TYPEWRITER_SENTENCES.length;

  stopTypewriter();
  typewriterText.textContent = '';

  const typingProxy = { progress: 0 };
  typewriterTimeline = gsap.timeline({
    onComplete: () => {
      gsap.to(typewriterText, {
        opacity: 0,
        duration: 2.2,
        ease: 'power1.inOut',
        delay: 1.4,
        onComplete: () => {
          gsap.delayedCall(0.9, playTypewriterSentence);
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
function resizeCanvas() {
  const rect = patternFrame.getBoundingClientRect();
  patternCanvas.width = rect.width * window.devicePixelRatio;
  patternCanvas.height = rect.height * window.devicePixelRatio;
  patternCanvas.style.width = `${rect.width}px`;
  patternCanvas.style.height = `${rect.height}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  drawPattern();
}

function getDotCenter(dot) {
  const dotRect = dot.getBoundingClientRect();
  const frameRect = patternFrame.getBoundingClientRect();
  return {
    x: dotRect.left + dotRect.width / 2 - frameRect.left,
    y: dotRect.top + dotRect.height / 2 - frameRect.top,
  };
}

function drawPattern() {
  ctx.clearRect(0, 0, patternCanvas.width, patternCanvas.height);
  if (!currentPattern.length) return;

  if (patternState === 'success') {
    ctx.strokeStyle = 'rgba(29, 209, 161, 0.95)';
  } else if (patternState === 'error') {
    ctx.strokeStyle = 'rgba(255, 95, 122, 0.95)';
  } else {
    ctx.strokeStyle = 'rgba(38, 198, 218, 0.95)'; // Turquoise/Cyan active line
  }
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  const points = currentPattern.map((value) => {
    const dot = document.querySelector(`.dot[data-value="${value}"]`);
    return dot ? getDotCenter(dot) : null;
  }).filter(Boolean);

  if (!points.length) return;
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));

  if (pointerPos) {
    ctx.lineTo(pointerPos.x, pointerPos.y);
  }

  ctx.stroke();
}

function resetPattern() {
  currentPattern = [];
  isDrawing = false;
  pointerPos = null;
  document.querySelectorAll('.dot').forEach((dot) => {
    dot.classList.remove('active', 'success', 'error');
  });
  drawPattern();
}

function addDot(dot) {
  const value = dot.dataset.value;
  if (!value || currentPattern.includes(value)) return;
  currentPattern.push(value);
  dot.classList.add('active');
  drawPattern();
}

function getDotFromPointer(event) {
  const point = event.type.startsWith('touch')
    ? event.touches[0] || event.changedTouches[0]
    : event;
  const element = document.elementFromPoint(point.clientX, point.clientY);
  return element ? element.closest('.dot') : null;
}

function updatePointerPosition(event) {
  const point = event.type.startsWith('touch')
    ? event.touches[0] || event.changedTouches[0]
    : event;
  const frameRect = patternFrame.getBoundingClientRect();
  pointerPos = {
    x: point.clientX - frameRect.left,
    y: point.clientY - frameRect.top,
  };
  drawPattern();
}

// --- Transitions ---
function showMessageWithTransition() {
  gsap.ticker.add(updateConfetti);

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
  patternState = 'success';
  isDrawing = false;
  pointerPos = null;
  drawPattern();

  document.querySelectorAll('.dot.active').forEach(dot => {
    dot.classList.add('success');
  });

  gsap.to('.dot.active', {
    scale: 1.15,
    duration: 0.2,
    yoyo: true,
    repeat: 1,
    ease: 'power1.inOut'
  });

  setTimeout(showMessageWithTransition, 500);
}

function triggerPatternError() {
  patternState = 'error';
  isDrawing = false;
  pointerPos = null;
  drawPattern();

  document.querySelectorAll('.dot.active').forEach(dot => {
    dot.classList.add('error');
  });

  gsap.fromTo(lockCard, 
    { x: -8 }, 
    { x: 8, duration: 0.08, repeat: 5, yoyo: true, onComplete: () => {
      lockCard.style.transform = 'none';
      resetPattern();
    }}
  );
}

function handlePatternEnd() {
  if (!currentPattern.length) {
    isDrawing = false;
    return;
  }

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
  const dot = event.target.closest('.dot');
  if (!dot) return;
  event.preventDefault();
  patternState = 'drawing';
  resetPattern();
  isDrawing = true;
  addDot(dot);
});

window.addEventListener('pointermove', (event) => {
  if (!isDrawing) return;
  updatePointerPosition(event);
  const dot = getDotFromPointer(event);
  if (dot) addDot(dot);
});

window.addEventListener('pointerup', () => {
  if (!isDrawing) return;
  isDrawing = false;
  pointerPos = null;
  drawPattern();
  handlePatternEnd();
});

window.addEventListener('pointercancel', () => {
  if (!isDrawing) return;
  isDrawing = false;
  resetPattern();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  resizeConfettiCanvas();
});

// Init
resizeCanvas();
resizeConfettiCanvas();
