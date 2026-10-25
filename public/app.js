let currentInputMode = 'photo';
let currentEffort = 'couch';
let currentDiet = 'None';
let currentBase64Image = null;
let presetsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  checkBackendHealth();
  setupDropzone();
  await loadPresets();
});

async function checkBackendHealth() {
  const telemetryPill = document.getElementById('telemetryPill');
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.online) {
      telemetryPill.innerHTML = `
        <span class="status-dot online"></span>
        <span class="telemetry-text">Connected: <strong>${data.recommendedModel}</strong> (Local Ollama)</span>
        <span class="privacy-badge">🔒 0 Bytes Cloud Egress</span>
      `;
    } else {
      telemetryPill.innerHTML = `
        <span class="status-dot"></span>
        <span class="telemetry-text">Ollama Offline (${data.error || 'Check 127.0.0.1:11434'})</span>
      `;
    }
  } catch (err) {
    telemetryPill.innerHTML = `
      <span class="status-dot"></span>
      <span class="telemetry-text">Local Server Offline</span>
    `;
  }
}

async function loadPresets() {
  try {
    const res = await fetch('presets.json');
    presetsData = await res.json();
    renderPresets();
  } catch (err) {
    console.warn('Could not load presets:', err);
  }
}

function renderPresets() {
  const container = document.getElementById('presetCardsContainer');
  if (!container) return;
  container.innerHTML = presetsData.map(p => `
    <div class="preset-chip-card" onclick="applyPreset('${p.id}')">
      <div class="p-title">${p.name}</div>
      <div class="p-desc">${p.tagline}</div>
    </div>
  `).join('');
}

function applyPreset(presetId) {
  const preset = presetsData.find(p => p.id === presetId);
  if (!preset) return;
  
  // Switch to text tab
  switchInputMode('text');
  
  const textarea = document.getElementById('ingredientsText');
  textarea.value = preset.items;
  
  if (preset.effort) selectEffort(preset.effort);
  if (preset.diet) selectDiet(preset.diet);

  // Auto-scroll or subtle highlight
  textarea.focus();
}

function switchInputMode(mode) {
  currentInputMode = mode;
  const photoBtn = document.getElementById('tabPhotoBtn');
  const textBtn = document.getElementById('tabTextBtn');
  const photoSec = document.getElementById('photoModeSection');
  const textSec = document.getElementById('textModeSection');

  if (mode === 'photo') {
    photoBtn.classList.add('active');
    textBtn.classList.remove('active');
    photoSec.style.display = 'block';
    textSec.style.display = 'none';
  } else {
    photoBtn.classList.remove('active');
    textBtn.classList.add('active');
    photoSec.style.display = 'none';
    textSec.style.display = 'block';
  }
}

function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-green)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border-color)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (PNG, JPG, WebP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentBase64Image = e.target.result;
    showImagePreview(currentBase64Image);
  };
  reader.readAsDataURL(file);
}

function showImagePreview(src) {
  const empty = document.getElementById('dropzoneEmpty');
  const preview = document.getElementById('dropzonePreview');
  const img = document.getElementById('previewImg');
  
  img.src = src;
  empty.style.display = 'none';
  preview.style.display = 'block';
}

function clearPhoto(e) {
  if (e) e.stopPropagation();
  currentBase64Image = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('previewImg').src = '';
  document.getElementById('dropzoneEmpty').style.display = 'block';
  document.getElementById('dropzonePreview').style.display = 'none';
}

// Generate realistic synthetic fridge snapshots via canvas for instant testing!
function loadSampleImage(type) {
  switchInputMode('photo');
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Background fridge shelf
  const grad = ctx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, '#e5e7eb');
  grad.addColorStop(1, '#9ca3af');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 400);

  // Glass shelf lines
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(20, 220, 560, 10);
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(20, 222, 560, 4);

  // Draw items based on sample type
  if (type === 'midnight') {
    // Egg carton
    ctx.fillStyle = '#d97706';
    ctx.roundRect(50, 150, 160, 70, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🥚 FARM EGGS', 70, 190);

    // Milk / cheese
    ctx.fillStyle = '#fef08a';
    ctx.roundRect(240, 130, 90, 90, 6);
    ctx.fill();
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('🧀 CHEDDAR', 246, 180);

    // Sriracha bottle
    ctx.fillStyle = '#dc2626';
    ctx.roundRect(360, 100, 50, 120, 12);
    ctx.fill();
    ctx.fillStyle = '#16a34a'; // green cap
    ctx.fillRect(375, 80, 20, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SRIRACHA', 362, 160);

    // Leftover rice box
    ctx.fillStyle = '#f3f4f6';
    ctx.roundRect(440, 140, 110, 80, 6);
    ctx.fill();
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('🍚 RICE BOX', 455, 185);

  } else if (type === 'veggies') {
    // Spinach bag
    ctx.fillStyle = '#15803d';
    ctx.roundRect(60, 140, 140, 80, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('🥬 SPINACH', 85, 185);

    // Tofu block
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(230, 150, 100, 70, 4);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('TOFU', 260, 190);

    // Soy sauce bottle
    ctx.fillStyle = '#1c1917';
    ctx.roundRect(360, 110, 45, 110, 10);
    ctx.fill();
    ctx.fillStyle = '#ea580c'; // orange label
    ctx.fillRect(360, 140, 45, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('SOY', 372, 165);

    // Bell pepper
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(480, 180, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('PEPPER', 458, 185);

  } else {
    // Pantry scrape
    // Canned beans
    ctx.fillStyle = '#475569';
    ctx.roundRect(70, 130, 80, 90, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('🥫 BEANS', 82, 180);

    // Tortilla bag
    ctx.fillStyle = '#fde68a';
    ctx.roundRect(180, 160, 150, 60, 10);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('🌮 TORTILLAS', 205, 195);

    // Salsa jar
    ctx.fillStyle = '#b91c1c';
    ctx.roundRect(360, 130, 70, 90, 8);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(360, 155, 70, 35);
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SALSA', 375, 178);

    // Jalapeño jar
    ctx.fillStyle = '#15803d';
    ctx.roundRect(460, 140, 60, 80, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('JALAPEÑO', 463, 185);
  }

  // Label watermark
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 360, 600, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Fridge Snapshot: ${type.toUpperCase()} · Scanned locally by Gemma 3 Vision`, 16, 385);

  currentBase64Image = canvas.toDataURL('image/jpeg', 0.9);
  showImagePreview(currentBase64Image);
}

function selectEffort(level) {
  currentEffort = level;
  document.querySelectorAll('.effort-card').forEach(card => {
    if (card.dataset.effort === level) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

function selectDiet(diet) {
  currentDiet = diet;
  document.querySelectorAll('.diet-btn').forEach(btn => {
    if (btn.dataset.diet === diet) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

async function generateMeal() {
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const resultContent = document.getElementById('resultContent');
  const generateBtn = document.getElementById('generateBtn');

  const textIngredients = document.getElementById('ingredientsText').value.trim();

  if (currentInputMode === 'photo' && !currentBase64Image && !textIngredients) {
    alert('Please upload a fridge photo, click one of the snapshot chips, or switch to the Text tab.');
    return;
  }

  if (currentInputMode === 'text' && !textIngredients) {
    alert('Please type in some ingredients or select an Instant Sloth Scenario.');
    return;
  }

  // UI transition
  emptyState.style.display = 'none';
  resultContent.style.display = 'none';
  loadingState.style.display = 'flex';
  generateBtn.disabled = true;
  generateBtn.style.opacity = '0.6';

  const loadingMsg = document.getElementById('loadingMsg');
  if (currentBase64Image && currentInputMode === 'photo') {
    loadingMsg.innerText = 'Scanning fridge photo locally with Gemma 3 Vision...';
  } else {
    loadingMsg.innerText = 'Consulting local Gemma open weights for minimum-motion recipe...';
  }

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: currentInputMode === 'photo' ? currentBase64Image : null,
        textIngredients: textIngredients,
        effortLevel: currentEffort,
        diet: currentDiet
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    renderResult(data);
  } catch (err) {
    alert(`Generation error: ${err.message}. Ensure Ollama is running at http://127.0.0.1:11434`);
    emptyState.style.display = 'flex';
  } finally {
    loadingState.style.display = 'none';
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
  }
}

function renderResult(data) {
  const resultContent = document.getElementById('resultContent');

  document.getElementById('resEffortBadge').innerText = data.effortBadge || 'Level 1: Couch Sloth';
  document.getElementById('resLazinessScore').innerText = `${data.lazinessScore || 96}%`;
  document.getElementById('resDishName').innerText = data.dishName || 'Sloth Comfort Feast';
  document.getElementById('resTagline').innerText = data.tagline || 'Minimum motion, maximum satisfaction.';

  document.getElementById('resPrepTime').innerText = data.prepTime || '2 mins';
  document.getElementById('resCookTime').innerText = data.cookTime || '5 mins';
  document.getElementById('resDishes').innerText = data.dishesToWash || '1 Pan, 1 Fork';
  document.getElementById('resInferenceTime').innerText = `${(data.inferenceTimeMs / 1000).toFixed(1)}s (Local)`;

  // Ingredients chips
  const chipsContainer = document.getElementById('resIngredientsChips');
  const ingredients = data.detectedIngredients || [];
  chipsContainer.innerHTML = ingredients.map(ing => `<span class="ing-chip">${ing}</span>`).join('');

  // Steps
  const stepsList = document.getElementById('resStepsList');
  const steps = data.steps || [];
  stepsList.innerHTML = steps.map(step => `<li>${step}</li>`).join('');

  // Grocery list
  const groceryContainer = document.getElementById('resGroceryList');
  const groceryItems = data.lazyGroceryList || [];
  groceryContainer.innerHTML = groceryItems.map((item, idx) => `
    <div class="grocery-row">
      <input type="checkbox" id="groc_${idx}">
      <span class="aisle-tag">${item.aisle || 'Aisle'}</span>
      <label for="groc_${idx}">${item.item}</label>
    </div>
  `).join('');

  // Sloth wisdom
  document.getElementById('resSlothWisdom').innerText = data.slothWisdom || "Why rush when food tastes twice as good when you didn't have to break a sweat?";

  // Telemetry
  document.getElementById('resModelUsed').innerText = `${data.modelUsed || 'gemma3:4b'} (Open Weights via Ollama)`;

  resultContent.style.display = 'flex';
  resultContent.scrollIntoView({ behavior: 'smooth' });
}

function copyGroceryList() {
  const rows = document.querySelectorAll('.grocery-row');
  if (rows.length === 0) return;

  const lines = ['🛒 FridgeSloth Lazy Restock List:'];
  rows.forEach(r => {
    const aisle = r.querySelector('.aisle-tag').innerText;
    const label = r.querySelector('label').innerText;
    lines.push(`• [${aisle}] ${label}`);
  });

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const copyBtn = document.querySelector('.copy-btn');
    const oldText = copyBtn.innerText;
    copyBtn.innerText = '✅ Copied!';
    setTimeout(() => { copyBtn.innerText = oldText; }, 2000);
  });
}
