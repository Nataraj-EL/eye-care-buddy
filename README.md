# EyeCare Buddy 👁️

**EyeCare Buddy** is a modern, privacy-focused Chrome Extension (Manifest V3) designed to help you follow the **20-20-20 rule** and reduce eye strain while working on your computer.

The 20-20-20 rule states: *Every 20 minutes, look at something at least 20 feet away for at least 20 seconds.*

---

## Features

- **Active Browsing Time Tracker:** Tracks active tab browsing time and resets statistics daily.
- **Break Reminders:** Displays native system notifications prompting you to take a break.
- **Adaptive Break Intervals (Biofeedback):** Rates your current eye strain after each break to automatically adjust the next break duration:
  - 😄 **No strain:** Extends the interval to **25 minutes**.
  - 😐 **Mild strain:** Maintains the default **20 minutes** interval.
  - 😣 **Severe strain:** Shortens the interval to **15 minutes** for more frequent rest.
- **Modern Premium UI:** Designed with a sleek dark theme, glassmorphic card styles, status badges, and smooth interactive hover states.
- **Privacy First:** All data is stored locally in your browser (`chrome.storage.local`). No browsing history or personal data is collected or sent to external servers.

---

## Directory Structure

```text
eyecare-buddy-extension/
├── icons/                  # Extension PNG icons (16px, 32px, 48px, 128px)
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js           # Background service worker for alarms/notifications
├── popup.html              # Extension popup user interface
├── popup.css               # Premium styles for the popup UI
├── popup.js                # Frontend controller for popup logic and updates
├── .gitignore              # Files to ignore in git version control
└── LICENSE                 # Open-source license (MIT)
```

---

## Installation

Since this extension is in development, you can load it as an "unpacked" extension in Google Chrome:

1. **Download/Clone** this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the `eyecare-buddy-extension` directory.
6. The EyeCare Buddy icon will now appear in your extensions list! Pin it to your toolbar for quick access.

---

## How It Works

1. Once installed, EyeCare Buddy starts tracking your browsing time and schedules your first break.
2. When the alarm fires, a native notification asks you to look away.
3. Open the extension popup to view today's active browsing duration, total breaks taken, and a countdown timer.
4. If a break was recently triggered, you'll be prompted to rate your eye strain. Clicking a rating will instantly reschedule your next break and update the timer badge.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
