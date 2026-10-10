type ReadSheet = (tab: string, fresh?: boolean) => Promise<string[][]>;
type Copy = {
  error: string;
  loading: string;
  live: string;
  empty: string;
  open: string;
};
export function chip(name: string, index: number, open = false) {
  const item = document.createElement("li");
  item.textContent = name;
  item.style.setProperty("--i", String(Math.min(index, 24)));
  if (open) item.className = "is-open";
  return item;
}
export function initializeInstitutions(read: ReadSheet) {
  const root = document.querySelector<HTMLElement>("[data-institutions]");
  if (!root) return;
  const copy: Copy = JSON.parse(root.dataset.copy || "{}");
  const status = root.querySelector<HTMLElement>("[data-inst-status]")!;
  const retry = root.querySelector<HTMLButtonElement>("[data-inst-retry]")!;
  let pending = false;
  async function load(fresh = false) {
    if (pending) return;
    pending = true;
    retry.hidden = true;
    status.textContent = copy.loading;
    root!.setAttribute("aria-busy", "true");
    try {
      const rows = await read("מוסדות", fresh);
      if (
        !rows.length ||
        rows[0].length < 4 ||
        !/^(code|קוד)$/i.test(rows[0][0]) ||
        !/^(name|שם|ישיבה)$/i.test(rows[0][1] || "")
      )
        throw new Error("Invalid institutions schema");
      const joined = rows
        .slice(1)
        .filter((row) => /^(true|1|כן)$/i.test((row[3] || "").trim()));
      const list = root!.querySelector<HTMLElement>("[data-inst-list]")!;
      const total = rows.length - 1;
      const items = joined.map((row, index) => chip(row[1], index));
      if (total > joined.length)
        items.push(
          chip(
            copy.open.replace("{n}", String(total - joined.length)),
            joined.length,
            true,
          ),
        );
      list.classList.remove("is-in");
      void list.offsetWidth;
      list.replaceChildren(...items);
      list.classList.add("is-in");
      root!.querySelector<HTMLElement>("[data-inst-count]")!.textContent =
        joined.length + " מתוך " + total;
      status.textContent = joined.length ? copy.live : copy.empty;
    } catch {
      status.textContent = copy.error;
      retry.hidden = false;
    } finally {
      pending = false;
      root!.removeAttribute("aria-busy");
    }
  }
  retry.addEventListener("click", () => void load(true));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void load();
      }
    });
    observer.observe(root);
  } else void load();
}
