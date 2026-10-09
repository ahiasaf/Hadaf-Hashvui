// Removes only what this app wrote to the device. Other same-origin data stays untouched.
const serviceWorkerPath = "/sw.js";
const cachePrefix = "hadaf-";
const voiceDatabase = "df-voice";
const localPrefixes = ["df:", "boardKey:"];

export type DeviceState = {
  admin: boolean;
  tester: boolean;
  head: boolean;
  name: string;
};

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function deviceState(): DeviceState {
  let name = "";
  try {
    const me = JSON.parse(read("df:me") || "null");
    if (me?.first) name = [me.first, me.last].filter(Boolean).join(" ");
  } catch {
    /* A broken record reads as unregistered. */
  }
  return {
    admin: read("df:admOk") === "1",
    tester: read("df:tester") === "1",
    head: read("df:head") !== null || read("df:headSeen") !== null,
    name,
  };
}

export function setTester(on: boolean) {
  try {
    if (on) localStorage.setItem("df:tester", "1");
    else localStorage.removeItem("df:tester");
  } catch {
    /* Storage is optional. */
  }
}

async function dropServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    const worker =
      registration.active || registration.waiting || registration.installing;
    if (!worker || new URL(worker.scriptURL).pathname !== serviceWorkerPath)
      continue;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription && !(await subscription.unsubscribe()))
      throw new Error("unsubscribe refused");
    if (!(await registration.unregister()))
      throw new Error("unregister refused");
  }
}

async function dropCaches() {
  if (!("caches" in window)) return;
  for (const key of await caches.keys()) {
    if (key.startsWith(cachePrefix) && !(await caches.delete(key)))
      throw new Error("cache delete refused");
  }
}

function dropVoiceDatabase() {
  if (!("indexedDB" in window)) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(voiceDatabase);
    const timer = setTimeout(() => reject(new Error("blocked")), 5000);
    request.onsuccess = () => {
      clearTimeout(timer);
      resolve();
    };
    request.onerror = () => {
      clearTimeout(timer);
      reject(request.error);
    };
  });
}

function dropStorage(keepTester: boolean) {
  for (const key of Object.keys(localStorage)) {
    if (localPrefixes.some((prefix) => key.startsWith(prefix)))
      localStorage.removeItem(key);
  }
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("df:")) sessionStorage.removeItem(key);
  }
  if (keepTester) localStorage.setItem("df:tester", "1");
}

const steps: [string, (keepTester: boolean) => Promise<void> | void][] = [
  ["התראות ועובד הרקע", dropServiceWorkers],
  ["קבצים שמורים לעבודה בלי רשת", dropCaches],
  ["הקלטות קוליות", dropVoiceDatabase],
  ["ההרשמה, הסימונים וההגדרות", dropStorage],
];

// Every step runs even when an earlier one fails; the names of failed steps come back for a retry.
export async function resetDevice(keepTester: boolean): Promise<string[]> {
  const failed: string[] = [];
  for (const [label, run] of steps) {
    try {
      await run(keepTester);
    } catch {
      failed.push(label);
    }
  }
  return failed;
}
