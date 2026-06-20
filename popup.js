if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
  const urlParams = new URLSearchParams(window.location.search);
  const isFeedback = urlParams.get('feedback') === 'true';
  globalThis.chrome = {
    storage: {
      local: {
        get: (keys, callback) => {
          const mockData = {
            browsingTime: 4522, // 1h 15m 22s
            breaksTaken: 1,
            currentInterval: 25,
            pendingRating: isFeedback,
            lastActiveTabTime: Date.now() - 34000,
            activeTimeSinceLastBreak: 538
          };
          const result = {};
          keys.forEach(k => result[k] = mockData[k]);
          setTimeout(() => callback(result), 0);
        },
        set: (data, callback) => {
          if (callback) callback();
        }
      }
    },
    alarms: {
      get: (name, callback) => {
        callback(null);
      }
    },
    notifications: {
      create: (id, options, callback) => {
        if (callback) callback();
      }
    }
  };
}

const BREAK_PHRASES = [
  "Look at something 20 feet away for 20 seconds.",
  "Blink your eyes rapidly 10 times to keep them moist.",
  "Close your eyes and let them rest for 20 seconds.",
  "Roll your eyes slowly in circles to stretch the muscles.",
  "Focus on a distant object for 10 seconds, then near for 10 seconds.",
  "Massage your eyelids gently with clean fingers for 15 seconds.",
  "Look far left, then far right, then up and down several times."
];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatCountdown(remainingSeconds) {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

async function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['browsingTime', 'breaksTaken', 'currentInterval', 'pendingRating', 'lastActiveTabTime', 'activeTimeSinceLastBreak'],
      resolve
    );
  });
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'success-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

let currentData = null;

async function syncData() {
  currentData = await loadData();
  renderUI();
}

function renderUI() {
  if (!currentData) return;

  let totalSeconds = currentData.browsingTime || 0;
  let activeTime = currentData.activeTimeSinceLastBreak || 0;
  let lastActive = currentData.lastActiveTabTime;

  if (!lastActive) {
    lastActive = Date.now();
    chrome.storage.local.set({ lastActiveTabTime: lastActive });
    currentData.lastActiveTabTime = lastActive;
  }

  const elapsed = Math.floor((Date.now() - lastActive) / 1000);
  if (elapsed > 0) {
    const validElapsed = Math.min(elapsed, 300);
    totalSeconds += validElapsed;
    activeTime += validElapsed;
  }

  document.getElementById('browsingTime').textContent = formatTime(totalSeconds);
  document.getElementById('breaksTaken').textContent = String(currentData.breaksTaken || 0);
  document.getElementById('intervalBadge').textContent = `${currentData.currentInterval || 20} min`;

  // Calculate countdown synchronously from active browsing time
  const intervalSeconds = (currentData.currentInterval || 20) * 60;
  const remaining = Math.max(0, intervalSeconds - activeTime);
  document.getElementById('nextBreak').textContent = formatCountdown(remaining);

  const ratingSection = document.getElementById('ratingSection');
  const noRating = document.getElementById('noRating');

  if (currentData.pendingRating) {
    ratingSection.classList.remove('hidden');
    noRating.style.display = 'none';
  } else {
    ratingSection.classList.add('hidden');
    noRating.style.display = '';
  }
}

async function applyRating(nextInterval) {
  await new Promise((resolve) => {
    chrome.storage.local.set({ 
      currentInterval: nextInterval, 
      pendingRating: false,
      activeTimeSinceLastBreak: 0,
      lastActiveTabTime: Date.now()
    }, resolve);
  });

  showToast(`Interval set to ${nextInterval} min ✓`);
  await syncData();
}

document.querySelectorAll('.rating-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = parseInt(btn.dataset.next, 10);
    applyRating(next);
  });
});

document.getElementById('testBreak').addEventListener('click', () => {
  const message = BREAK_PHRASES[Math.floor(Math.random() * BREAK_PHRASES.length)];
  chrome.notifications.create({
    type: 'basic',
    title: 'EyeCare Buddy - Take a Break !',
    message: message,
    iconUrl: 'icons/icon-48.png',
    priority: 2
  });
  showToast('Test notification sent!');
});

syncData();
const interval = setInterval(renderUI, 1000);
window.addEventListener('unload', () => clearInterval(interval));

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      syncData();
    }
  });
}
