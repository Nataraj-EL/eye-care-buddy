const DEFAULT_INTERVAL = 20;

const BREAK_PHRASES = [
  "Look at something 20 feet away for 20 seconds.",
  "Blink your eyes rapidly 10 times to keep them moist.",
  "Close your eyes and let them rest for 20 seconds.",
  "Roll your eyes slowly in circles to stretch the muscles.",
  "Focus on a distant object for 10 seconds, then near for 10 seconds.",
  "Massage your eyelids gently with clean fingers for 15 seconds.",
  "Look far left, then far right, then up and down several times."
];

function getTodayKey() {
  return new Date().toDateString();
}

function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function setStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

async function checkDailyReset() {
  const today = getTodayKey();
  const data = await getStorage(['lastReset', 'currentInterval']);
  if (data.lastReset !== today) {
    await setStorage({
      browsingTime: 0,
      activeTimeSinceLastBreak: 0,
      breaksTaken: 0,
      lastReset: today,
      pendingRating: false,
      currentInterval: data.currentInterval || DEFAULT_INTERVAL,
      lastActiveTabTime: Date.now()
    });
    return true;
  }
  return false;
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        // Find the first active tab that is NOT our extension popup
        const activeTab = tabs.find(t => t.url && !t.url.startsWith('chrome-extension://'));
        resolve(activeTab || null);
      } else {
        resolve(null);
      }
    });
  });
}

async function triggerBreakNotification() {
  const data = await getStorage(['breaksTaken']);
  await setStorage({
    breaksTaken: (data.breaksTaken || 0) + 1,
    pendingRating: true
  });

  const message = BREAK_PHRASES[Math.floor(Math.random() * BREAK_PHRASES.length)];

  chrome.notifications.create({
    type: 'basic',
    title: 'EyeCare Buddy - Take a Break !',
    message: message,
    iconUrl: 'icons/icon-48.png',
    priority: 2,
    requireInteraction: true
  });
}

async function updateBrowsingTime() {
  const resetPerformed = await checkDailyReset();
  if (resetPerformed) return;

  const now = Date.now();
  const data = await getStorage(['browsingTime', 'activeTimeSinceLastBreak', 'currentInterval', 'lastActiveTabTime']);
  const lastActive = data.lastActiveTabTime;
  let elapsed = 0;
  if (lastActive) {
    elapsed = Math.floor((now - lastActive) / 1000); // elapsed in seconds
  }

  const tab = await getActiveTab();
  const isActive = tab && tab.url;

  if (isActive && elapsed > 0) {
    const validElapsed = Math.min(elapsed, 300);
    const newBrowsingTime = (data.browsingTime || 0) + validElapsed;
    
    // Increment active time since last break
    let activeTime = (data.activeTimeSinceLastBreak || 0) + validElapsed;
    const intervalSeconds = (data.currentInterval || DEFAULT_INTERVAL) * 60;
    
    let triggerBreak = false;
    if (activeTime >= intervalSeconds) {
      triggerBreak = true;
      activeTime = 0; // Reset active break timer
    }

    await setStorage({
      browsingTime: newBrowsingTime,
      activeTimeSinceLastBreak: activeTime,
      lastActiveTabTime: now
    });

    if (triggerBreak) {
      await triggerBreakNotification();
    }
    console.log(`Tracked ${validElapsed}s of active browsing time. Total: ${newBrowsingTime}s | Since last break: ${activeTime}s`);
  } else {
    // If not active, just advance the baseline so we don't count idle time later
    await setStorage({ lastActiveTabTime: now });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const today = getTodayKey();
  const data = await getStorage(['lastReset', 'currentInterval']);
  if (data.lastReset !== today) {
    await setStorage({
      browsingTime: 0,
      activeTimeSinceLastBreak: 0,
      breaksTaken: 0,
      lastReset: today,
      pendingRating: false,
      currentInterval: DEFAULT_INTERVAL,
      lastActiveTabTime: Date.now()
    });
  } else {
    await setStorage({ lastActiveTabTime: Date.now() });
    if (!data.currentInterval) {
      await setStorage({ currentInterval: DEFAULT_INTERVAL });
    }
  }

  chrome.alarms.create('trackTime', { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  await checkDailyReset();
  await setStorage({ lastActiveTabTime: Date.now() });
  const alarms = await chrome.alarms.getAll();
  const hasTrack = alarms.some(a => a.name === 'trackTime');
  if (!hasTrack) chrome.alarms.create('trackTime', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'trackTime') {
    await updateBrowsingTime();
  }
});

// Real-time tracking triggers
chrome.tabs.onActivated.addListener(async () => {
  await updateBrowsingTime();
});

chrome.windows.onFocusChanged.addListener(async () => {
  await updateBrowsingTime();
});

chrome.notifications.onButtonClicked.addListener(async (notifId) => {
  chrome.notifications.clear(notifId);
});
