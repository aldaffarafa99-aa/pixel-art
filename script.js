const gridContainer = document.getElementById('grid');
const gridSizeSelect = document.getElementById('gridSize');
const colorPicker = document.getElementById('colorPicker');
const eraserBtn = document.getElementById('eraserBtn');
const bucketBtn = document.getElementById('bucketBtn');
const symmetryBtn = document.getElementById('symmetryBtn');
const gridLinesBtn = document.getElementById('gridLinesBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const templateSelect = document.getElementById('templateSelect');
const swatches = document.querySelectorAll('.color-swatch');

let isDrawing = false;
let isEraser = false;
let isBucket = false;
let isSymmetry = false;
let currentColor = colorPicker.value;
let audioContext;

function playRetroSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(660, now);
  oscillator.frequency.exponentialRampToValueAtTime(330, now + 0.07);
  gain.gain.setValueAtTime(0.045, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.08);
}

document.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', playRetroSound);
});

function getPixels() {
  return Array.from(gridContainer.querySelectorAll('.pixel'));
}

function getPixelColor(pixel) {
  return pixel.style.backgroundColor || '#ffffff';
}

function getPaintColor() {
  return isEraser ? '#ffffff' : currentColor;
}

// 1. Fungsi Bikin Grid
function createGrid(size) {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  // Sesuaikan ukuran kanvas tampilan
  const containerSize = Math.min(window.innerWidth - 80, 400);
  gridContainer.style.width = `${containerSize}px`;
  gridContainer.style.height = `${containerSize}px`;

  for (let i = 0; i < size * size; i++) {
    const pixel = document.createElement('div');
    pixel.classList.add('pixel');
    pixel.style.backgroundColor = '#ffffff';
    pixel.dataset.index = i;

    // Event Klik & Drag
    pixel.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDrawing = true;
      if (isBucket) fillArea(Number(pixel.dataset.index));
      else paintPixel(Number(pixel.dataset.index));
    });

    pixel.addEventListener('mouseenter', () => {
      if (isDrawing && !isBucket) paintPixel(Number(pixel.dataset.index));
    });

    gridContainer.appendChild(pixel);
  }
}

// 2. Fungsi Mewarnai Pixel
function paintPixel(index) {
  const size = parseInt(gridSizeSelect.value, 10);
  const pixels = getPixels();
  const row = Math.floor(index / size);
  const column = index % size;
  const color = getPaintColor();
  pixels[index].style.backgroundColor = color;

  if (isSymmetry) {
    const mirroredIndex = row * size + (size - 1 - column);
    pixels[mirroredIndex].style.backgroundColor = color;
  }

  playRetroSound();
}

function fillArea(startIndex) {
  const size = parseInt(gridSizeSelect.value, 10);
  const pixels = getPixels();
  const startColor = getPixelColor(pixels[startIndex]);
  const fillColor = getPaintColor();
  if (startColor === fillColor) return;

  const queue = [startIndex];
  const visited = new Set([startIndex]);
  const filledIndices = [];

  while (queue.length > 0) {
    const index = queue.shift();
    if (getPixelColor(pixels[index]) !== startColor) continue;
    filledIndices.push(index);

    const row = Math.floor(index / size);
    const column = index % size;
    const neighbors = [];
    if (row > 0) neighbors.push(index - size);
    if (row < size - 1) neighbors.push(index + size);
    if (column > 0) neighbors.push(index - 1);
    if (column < size - 1) neighbors.push(index + 1);

    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }

  filledIndices.forEach(index => {
    pixels[index].style.backgroundColor = fillColor;
    if (isSymmetry) {
      const row = Math.floor(index / size);
      const column = index % size;
      pixels[row * size + (size - 1 - column)].style.backgroundColor = fillColor;
    }
  });
  playRetroSound();
}

function loadTemplate(template) {
  const size = parseInt(gridSizeSelect.value, 10);
  const pixels = getPixels();
  const colors = pixels.map(() => '#ffffff');

  if (template === 'smile') {
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const x = (column - (size - 1) / 2) / size;
        const y = (row - (size - 1) / 2) / size;
        const index = row * size + column;
        if (x * x + y * y <= 0.19) colors[index] = '#facc15';

        const eyeY = -size * 0.1;
        const eyeX = size * 0.13;
        const isEye = Math.abs(row - ((size - 1) / 2 + eyeY)) < Math.max(1, size * 0.045)
          && Math.abs(Math.abs(column - (size - 1) / 2) - eyeX) < Math.max(1, size * 0.045);
        const mouthY = size * 0.11 + Math.pow(x * size, 2) / size * 0.12;
        const isMouth = y > 0 && Math.abs(row - ((size - 1) / 2 + mouthY)) < Math.max(1, size * 0.04)
          && Math.abs(x) < 0.22;
        if (isEye || isMouth) colors[index] = '#1f2937';
      }
    }
  } else if (template === 'heart') {
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const x = (column / (size - 1) * 2 - 1) * 1.25;
        const y = 0.9 - row / (size - 1) * 1.8;
        const heartShape = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
        if (heartShape <= 0) colors[row * size + column] = '#ef4444';
      }
    }
  }

  pixels.forEach((pixel, index) => {
    pixel.style.backgroundColor = colors[index];
  });
  playRetroSound();
}

// Global Mouse Up Event (Biar pas lepas klik di luar grid tetep berhenti melukis)
window.addEventListener('mouseup', () => {
  isDrawing = false;
});

// 3. Event Listeners Kontrol
gridSizeSelect.addEventListener('change', (e) => {
  createGrid(parseInt(e.target.value));
  playRetroSound();
});

templateSelect.addEventListener('change', (e) => {
  loadTemplate(e.target.value);
});

colorPicker.addEventListener('input', (e) => {
  currentColor = e.target.value;
  isEraser = false;
  eraserBtn.classList.remove('active');
});

swatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    currentColor = swatch.dataset.color;
    colorPicker.value = currentColor;
    isEraser = false;
    eraserBtn.classList.remove('active');
  });
});

eraserBtn.addEventListener('click', () => {
  isEraser = !isEraser;
  isBucket = false;
  eraserBtn.classList.toggle('active', isEraser);
  bucketBtn.classList.remove('active');
  bucketBtn.setAttribute('aria-pressed', 'false');
});

bucketBtn.addEventListener('click', () => {
  isBucket = !isBucket;
  isEraser = false;
  bucketBtn.classList.toggle('active', isBucket);
  bucketBtn.setAttribute('aria-pressed', String(isBucket));
  eraserBtn.classList.remove('active');
});

symmetryBtn.addEventListener('click', () => {
  isSymmetry = !isSymmetry;
  symmetryBtn.textContent = `Mode Cermin: ${isSymmetry ? 'On' : 'Off'}`;
  symmetryBtn.classList.toggle('active', isSymmetry);
  symmetryBtn.setAttribute('aria-pressed', String(isSymmetry));
});

gridLinesBtn.addEventListener('click', () => {
  const hidden = gridContainer.classList.toggle('no-grid-lines');
  gridLinesBtn.textContent = hidden ? 'Tampilkan Garis Grid' : 'Sembunyikan Garis Grid';
  gridLinesBtn.classList.toggle('active', hidden);
  gridLinesBtn.setAttribute('aria-pressed', String(hidden));
});

clearBtn.addEventListener('click', () => {
  const pixels = getPixels();
  pixels.forEach(pixel => pixel.style.backgroundColor = '#ffffff');
  templateSelect.value = 'blank';
});

// 4. Fitur Download PNG (Resolusi Tajam HD)
downloadBtn.addEventListener('click', () => {
  const size = parseInt(gridSizeSelect.value);
  const canvas = document.getElementById('exportCanvas');
  const ctx = canvas.getContext('2d');
  const scale = 32; // Setiap piksel grid dirender jadi 32px di gambar agar HD

  canvas.width = size * scale;
  canvas.height = size * scale;

  const pixels = getPixels();
  pixels.forEach((pixel, index) => {
    const x = (index % size) * scale;
    const y = Math.floor(index / size) * scale;
    ctx.fillStyle = pixel.style.backgroundColor || '#ffffff';
    ctx.fillRect(x, y, scale, scale);
  });

  const link = document.createElement('a');
  link.download = 'pixel-avatar.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Inisialisasi awal (Default 16x16)
createGrid(16);