const patternGrid = document.getElementById('patternGrid');
const patternCanvas = document.getElementById('patternCanvas');
const patternFrame = document.querySelector('.pattern-frame');
const statusText = document.getElementById('statusText');
const clearButton = document.getElementById('clearButton');
const messageCard = document.getElementById('messageCard');
const lockCard = document.querySelector('.lock-card');

const correctPattern = ['1', '8', '5', '3'];
let currentPattern = [];
let isDrawing = false;
let pointerPos = null;
const ctx = patternCanvas.getContext('2d');

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? '#ff7a8a' : '#b5b6c3';
}

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

  ctx.strokeStyle = 'rgba(247, 183, 51, 0.95)';
  ctx.lineWidth = 6;
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
  document.querySelectorAll('.dot.active').forEach((dot) => dot.classList.remove('active'));
  drawPattern();
}

function addDot(dot) {
  const value = dot.dataset.value;
  if (!value || currentPattern.includes(value)) return;
  currentPattern.push(value);
  dot.classList.add('active');
  setStatus(`Pola: ${currentPattern.length} dari 4 titik.`);
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

function handlePatternEnd() {
  if (!currentPattern.length) {
    isDrawing = false;
    return;
  }

  if (currentPattern.length !== correctPattern.length) {
    setStatus('Pola tidak lengkap. Tarik ulang.', true);
    resetPattern();
    return;
  }

  const isMatch = currentPattern.every((value, index) => value === correctPattern[index]);
  if (isMatch) {
    lockCard.classList.add('hidden');
    messageCard.classList.remove('hidden');
  } else {
    setStatus('Pola salah. Tarik ulang.', true);
    resetPattern();
  }
}

patternGrid.addEventListener('pointerdown', (event) => {
  const dot = event.target.closest('.dot');
  if (!dot) return;
  event.preventDefault();
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

clearButton.addEventListener('click', () => {
  resetPattern();
  setStatus('Tarik pola yang benar.');
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
setStatus('Tarik pola melalui titik yang benar.');
