import { finishWithEffect } from "./effect-motion";
const pending = new WeakMap<
  HTMLElement,
  {
    key: string;
    animations: Animation[];
    controller: AbortController;
    task: Promise<void>;
  }
>();

function focusRemaining(root: HTMLElement) {
  const next =
    (root.isConnected && !root.hidden
      ? root.querySelector<HTMLButtonElement>('[role="tab"]:not([hidden])')
      : null) ||
    document.querySelector<HTMLAnchorElement>(
      '[data-continue], [data-open], .celebrate > a[href="/app"]',
    );
  next?.focus();
}

export function updateCommunity(
  root: HTMLElement | null,
  joined: boolean,
  notified: boolean,
  apply: () => void,
) {
  if (!root) {
    apply();
    return Promise.resolve();
  }
  const key = String(joined) + String(notified);
  const previous = pending.get(root);
  const bounds = root.getBoundingClientRect();
  const immediate =
    document.hidden ||
    bounds.bottom <= 0 ||
    bounds.top >= innerHeight ||
    !root.isConnected ||
    root.hidden ||
    (root.hasAttribute("data-reveal") && !root.classList.contains("is-in")) ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (previous?.key === key && !immediate) return previous.task;
  const interrupted =
    previous && !immediate
      ? {
          height: root.getBoundingClientRect().height,
          opacity: Number(getComputedStyle(root).opacity),
        }
      : null;
  if (previous) {
    previous.controller.abort();
    previous.animations.forEach((animation) => animation.cancel());
    pending.delete(root);
    root.style.opacity = "";
    root.style.height = "";
    root.inert = false;
  }
  const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  const removing = (joined && !tabs[0].hidden) || (notified && !tabs[1].hidden);
  if (immediate) {
    const focused = removing && root.contains(document.activeElement);
    apply();
    if (focused)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => focusRemaining(root)),
      );
    return Promise.resolve();
  }
  if (!removing) {
    apply();
    return Promise.resolve();
  }
  const entry = {
    key,
    animations: [] as Animation[],
    controller: new AbortController(),
    task: Promise.resolve(),
  };
  pending.set(root, entry);
  const focused = root.contains(document.activeElement);
  const height = interrupted?.height ?? root.getBoundingClientRect().height;
  const style = getComputedStyle(root);
  const opacity = interrupted?.opacity ?? Number(style.opacity);
  root.inert = true;
  const animate = async (frames: Keyframe[], duration: number) => {
    const animation = root.animate(frames, {
      duration,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "forwards",
    });
    entry.animations.push(animation);
    await finishWithEffect(animation, entry.controller.signal);
  };
  const painted = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  entry.task = (async () => {
    try {
      if (joined && notified) {
        await animate(
          [
            {
              height: height + "px",
              opacity,
              marginTop: style.marginTop,
              marginBottom: style.marginBottom,
            },
            {
              height: height + "px",
              opacity: 0,
              offset: 0.4,
              marginTop: style.marginTop,
              marginBottom: style.marginBottom,
            },
            {
              height: "0px",
              opacity: 0,
              marginTop: "0px",
              marginBottom: "0px",
              borderWidth: "0px",
            },
          ],
          360,
        );
        if (pending.get(root) !== entry) return;
        apply();
        await painted();
      } else {
        await animate(
          [{ opacity }, { opacity: 0, transform: "translateY(-4px)" }],
          150,
        );
        if (pending.get(root) !== entry) return;
        root.style.opacity = "0";
        root.style.height = height + "px";
        entry.animations.forEach((animation) => animation.cancel());
        apply();
        await painted();
        if (pending.get(root) !== entry) return;
        root.style.height = "";
        const nextHeight = root.getBoundingClientRect().height;
        root.style.height = height + "px";
        await animate(
          [
            { height: height + "px", opacity: 0, transform: "translateY(4px)" },
            { height: nextHeight + "px", opacity: 1, transform: "none" },
          ],
          260,
        );
      }
      root.inert = false;
      if (focused) {
        focusRemaining(root);
      }
    } catch {
      if (pending.get(root) === entry && root.isConnected) apply();
    } finally {
      if (pending.get(root) === entry) {
        entry.animations.forEach((animation) => animation.cancel());
        root.style.opacity = "";
        root.style.height = "";
        root.inert = false;
        pending.delete(root);
      }
    }
  })();
  return entry.task;
}
