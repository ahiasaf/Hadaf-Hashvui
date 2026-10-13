// Install flow decisions: which single step the device still needs.
export type Device = {
  standalone: boolean;
  ios: boolean;
  iosSafari: boolean;
  inApp: boolean;
  promptReady: boolean;
  canInstall: boolean;
  notifications: "granted" | "denied" | "default" | "unsupported";
  remindersOn: boolean;
};
export type InstallStep =
  | "install-prompt"
  | "install-ios"
  | "install-browser"
  | "browser-only"
  | "open-browser"
  | "notify"
  | "done";

export function readDevice(
  nav: {
    userAgent: string;
    standalone?: boolean;
    maxTouchPoints?: number;
    platform?: string;
  },
  standaloneMedia: boolean,
  promptReady: boolean,
  permission: Device["notifications"],
  remindersOn: boolean,
): Device {
  const ua = nav.userAgent || "";
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (nav.platform === "MacIntel" && (nav.maxTouchPoints || 0) > 1);
  const iosOther = ios && /CriOS|FxiOS|EdgiOS|OPT\//.test(ua);
  const inApp =
    /; wv\)|FBAN|FBAV|Instagram|Line\/|MicroMessenger|OKApp/.test(ua) ||
    (ios && !iosOther && typeof nav.standalone === "undefined");
  return {
    standalone: nav.standalone === true || standaloneMedia,
    ios,
    iosSafari: ios && !iosOther && !inApp,
    inApp,
    promptReady,
    canInstall:
      ios || /Android|Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua),
    notifications: permission,
    remindersOn,
  };
}

// One step at a time: install first where it matters, then notifications, then nothing.
export function nextStep(device: Device): InstallStep {
  if (!device.standalone) {
    if (device.inApp) return "open-browser";
    if (device.ios) return "install-ios";
    if (device.promptReady) return "install-prompt";
    return device.canInstall ? "install-browser" : "browser-only";
  }
  if (device.notifications === "unsupported") return "done";
  if (device.ios && !device.standalone) return "done";
  if (device.remindersOn && device.notifications === "granted") return "done";
  if (device.notifications === "denied") return "done";
  return "notify";
}

export function setupNext(input: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) return "/app";
  try {
    const url = new URL(input, "https://hadaf.invalid");
    if (
      url.origin !== "https://hadaf.invalid" ||
      !["/app", "/learn", "/lesson-tools"].includes(url.pathname)
    )
      return "/app";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/app";
  }
}
