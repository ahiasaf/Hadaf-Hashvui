// Install flow decisions: which single step the device still needs.
export type Device = {
  standalone: boolean;
  ios: boolean;
  iosSafari: boolean;
  inApp: boolean;
  promptReady: boolean;
  notifications: "granted" | "denied" | "default" | "unsupported";
  remindersOn: boolean;
};
export type InstallStep =
  | "install-prompt"
  | "install-ios"
  | "open-safari"
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
    notifications: permission,
    remindersOn,
  };
}

// One step at a time: install first where it matters, then notifications, then nothing.
export function nextStep(device: Device): InstallStep {
  if (!device.standalone) {
    if (device.inApp) return "open-browser";
    if (device.ios) return device.iosSafari ? "install-ios" : "open-safari";
    if (device.promptReady) return "install-prompt";
  }
  if (device.notifications === "unsupported") return "done";
  if (device.ios && !device.standalone) return "done";
  if (device.remindersOn && device.notifications === "granted") return "done";
  if (device.notifications === "denied") return "done";
  return "notify";
}
