// Register service worker and manage meal reminder notifications

const SCHEDULE_KEY = "nutrisg_notif_schedule_v1";

export async function registerSW() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope:"/" });
    console.log("SW registered:", reg.scope);
    startReminderLoop();
    return true;
  } catch(e) {
    console.error("SW registration failed:", e);
    return false;
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

// Ping SW every minute to check if it's time to fire a notification
let loopInterval = null;
export function startReminderLoop() {
  if (loopInterval) return;
  loopInterval = setInterval(() => {
    const schedule = loadSchedule();
    if (!schedule?.enabled) return;
    if (!navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: "CHECK_REMINDERS",
      schedule,
    });
  }, 60_000); // every 60 seconds
}

export function stopReminderLoop() {
  clearInterval(loopInterval);
  loopInterval = null;
}

export function loadSchedule() {
  try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || null; } catch { return null; }
}

export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}
