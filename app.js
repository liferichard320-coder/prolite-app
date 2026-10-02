const STORAGE_LIMIT_MB = 110;
const STORAGE_KEY = 'prolite-storage-used-mb';

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const addStorageBtn = document.getElementById('addStorageBtn');
const clearStorageBtn = document.getElementById('clearStorageBtn');
const usedSpaceEl = document.getElementById('usedSpace');
const freeSpaceEl = document.getElementById('freeSpace');
const storageFillEl = document.getElementById('storageFill');
const usagePercentEl = document.getElementById('usagePercent');
const toastEl = document.getElementById('toast');
const installBtn = document.getElementById('installBtn');

let deferredPrompt = null;

function formatMb(value) {
  return `${value.toFixed(2)} MB`;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('visible');

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 1800);
}

function getUsedStorage() {
  const saved = Number(localStorage.getItem(STORAGE_KEY) || '0');
  if (!Number.isFinite(saved) || saved < 0) {
    return 0;
  }
  return Math.min(saved, STORAGE_LIMIT_MB);
}

function setUsedStorage(value) {
  const bounded = Math.min(Math.max(value, 0), STORAGE_LIMIT_MB);
  localStorage.setItem(STORAGE_KEY, String(bounded));
  renderStorage();
}

function renderStorage() {
  const used = getUsedStorage();
  const remaining = Math.max(STORAGE_LIMIT_MB - used, 0);
  const percent = Math.min((used / STORAGE_LIMIT_MB) * 100, 100);

  usedSpaceEl.textContent = formatMb(used);
  freeSpaceEl.textContent = formatMb(remaining);
  storageFillEl.style.width = `${percent}%`;
  usagePercentEl.textContent = `${Math.round(percent)}%`;
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files || []);

  if (!files.length) {
    return;
  }

  let added = 0;

  files.forEach((file) => {
    const sizeMb = file.size / (1024 * 1024);
    added += sizeMb;
  });

  const current = getUsedStorage();
  const next = current + added;

  if (next > STORAGE_LIMIT_MB) {
    const overflow = next - STORAGE_LIMIT_MB;
    showToast(`Not enough space. ${formatMb(overflow)} exceeds the 110 MB limit.`);
    setUsedStorage(STORAGE_LIMIT_MB);
  } else {
    setUsedStorage(next);
    showToast(`Added ${formatMb(added)} to storage.`);
  }

  fileInput.value = '';
}

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelection);

addStorageBtn.addEventListener('click', () => {
  const current = getUsedStorage();
  const increment = 12;

  if (current + increment > STORAGE_LIMIT_MB) {
    setUsedStorage(STORAGE_LIMIT_MB);
    showToast('Storage limit reached at 110 MB.');
    return;
  }

  setUsedStorage(current + increment);
  showToast('Added 12 MB of storage usage.');
});

clearStorageBtn.addEventListener('click', () => {
  setUsedStorage(0);
  showToast('Storage cleared.');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    showToast('This browser does not support install prompts.');
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

renderStorage();
window.addEventListener('storage', renderStorage);
