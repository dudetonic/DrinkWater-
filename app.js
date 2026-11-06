/* Hydration Buddy — app logic
   ------------------------------------------
   Stage 1: logging with localStorage, daily reset at midnight,
   progress ring, encouragement lines, service worker registration,
   notification permission request. */

const DAILY_GOAL = 8;

/* ---------- localStorage helpers ---------- */

const STORE_KEY = 'hydrationBuddyData';

// Today's date as YYYY-MM-DD in the device's local time zone.
// This is the key trick behind the midnight reset: every read/write
// is keyed to "today", so when the date changes the old count is
// simply abandoned and a fresh 0 begins.
function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadToday() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data.date === todayKey() ? (data.count || 0) : 0;
  } catch {
    return 0;
  }
}

function saveToday(count) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ date: todayKey(), count }));
}

/* ---------- encouragement lines ---------- */

const ENCOURAGEMENT = [
  "Let's get started — first glass of the day! 💧",
  'Nice! One down, seven to go 💙',
  'Two glasses — you\'re on a roll 🌊',
  'Three! Your body is already thanking you 💧',
  'Halfway there — four of eight! 🎉',
  'Five glasses. Look at you go 💙',
  'Six — future you is so proud right now 🌊',
  'Seven! Just one more 💧',
  'EIGHT GLASSES! Goal crushed! 🎉💙',
];

/* ---------- DOM refs ---------- */

const ringFg = document.getElementById('ringFg');
const countTodayEl = document.getElementById('countToday');
const encourageEl = document.getElementById('encourageLine');
const logBtn = document.getElementById('logBtn');
const enableBtn = document.getElementById('enableBtn');
const statusLine = document.getElementById('statusLine');

/* ---------- rendering ---------- */

// Circle math: circumference of r=84 circle in the 200x200 SVG viewBox.
const CIRCUMFERENCE = 2 * Math.PI * 84;

function render() {
  const count = loadToday();
  countTodayEl.textContent = count;
  encourageEl.textContent = ENCOURAGEMENT[Math.min(count, ENCOURAGEMENT.length - 1)];
  ringFg.style.strokeDasharray = CIRCUMFERENCE;
  ringFg.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(count, DAILY_GOAL) / DAILY_GOAL);
}

/* ---------- events ---------- */

logBtn.addEventListener('click', () => {
  const count = loadToday();
  if (count < DAILY_GOAL) {
    saveToday(count + 1);
  }
  render();

  // Tiny splash animation so the tap feels alive.
  logBtn.classList.remove('splash');
  void logBtn.offsetWidth; // force reflow so the animation restarts
  logBtn.classList.add('splash');
});

/* Midnight-robust reset: we never need a timer. Whenever the app becomes
   visible again (opened, tab refocused, screen unlocked), we re-read the
   count, and loadToday() automatically returns 0 if the date rolled over. */
document.addEventListener('visibilitychange', render);
window.addEventListener('focus', render);

/* ---------- Enable Reminders ---------- */

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('service-worker.js');
}

enableBtn.addEventListener('click', async () => {
  statusLine.textContent = 'One moment…';

  // 1. Register the service worker (required before iOS allows push).
  try {
    await registerServiceWorker();
  } catch (err) {
    statusLine.textContent = 'Couldn\'t register the app. Are you opening it from the Home Screen icon?';
    return;
  }

  // 2. Ask for notification permission.
  //    NOTE: iOS only shows this prompt if the PWA was launched from the
  //    Home Screen icon — never from a regular Safari tab.
  if (!('Notification' in window)) {
    statusLine.textContent = 'This device doesn\'t support notifications.';
    return;
  }

  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch (err) {
    permission = Notification.permission;
  }

  if (permission === 'granted') {
    statusLine.textContent = 'Reminders enabled! 💙 (Hourly nudges arrive in Stage 2.)';
    enableBtn.disabled = true;
    enableBtn.textContent = 'Reminders Enabled ✓';
  } else if (permission === 'denied') {
    statusLine.textContent = 'Notifications are blocked. Fix: Settings → your app → turn Notifications on.';
  } else {
    statusLine.textContent = 'No worries — you can tap the button again anytime.';
  }
});

/* ---------- boot ---------- */

render();

// Register the service worker on launch too, so caching works even if she
// never taps Enable Reminders.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
