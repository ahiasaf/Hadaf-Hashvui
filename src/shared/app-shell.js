/* Account-aware navigation and safe background updates for installed apps. */
(function () {
  function account() {
    var person = null;
    try { person = JSON.parse(localStorage.getItem('df:me') || 'null'); } catch (e) {}
    var signed = !!(person && typeof person.id === 'string' && person.id);
    document.documentElement.classList.toggle('signed-in', signed);
    Array.prototype.forEach.call(document.querySelectorAll('[data-guest-only]'), function (el) {
      el.hidden = signed;
    });
  }
  window.addEventListener('storage', function (e) { if (e.key === 'df:me' || e.key === null) account(); });
  window.addEventListener('df-account-change', account);
  window.addEventListener('pageshow', account);
  account();

  var started = false, hadController = false, pending = false, refreshing = false;
  var edited = false, leaving = false, registration = null;
  function installed() {
    return !!navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  }
  function reloadLater() {
    if (!pending || !installed() || !navigator.onLine || !document.hidden || edited || leaving || refreshing) return;
    setTimeout(function () {
      if (!pending || !navigator.onLine || !document.hidden || edited || leaving || refreshing) return;
      refreshing = true;
      location.reload();
    }, 400);
  }
  function check() {
    if (registration && navigator.onLine) registration.update()['catch'](function () {});
  }
  function update() {
    if (started || !('serviceWorker' in navigator)) return;
    started = true;
    hadController = !!navigator.serviceWorker.controller;
    document.addEventListener('input', function () { edited = true; }, true);
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('form,[data-update-draft]')) edited = true;
    }, true);
    document.addEventListener('change', function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) edited = true;
    }, true);
    window.addEventListener('pagehide', function () { leaving = true; });
    window.addEventListener('beforeunload', function () { leaving = true; });
    window.addEventListener('pageshow', function () { leaving = false; check(); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!navigator.serviceWorker.controller) return;
      if (!hadController) { hadController = true; return; }
      pending = true;
      reloadLater();
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { leaving = false; check(); }
      else reloadLater();
    });
    window.addEventListener('online', function () { check(); reloadLater(); });
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function (reg) {
      registration = reg;
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      check();
      setInterval(check, 3600000);
    })['catch'](function () {});
  }
  window.DF_APP = { update: update };
  update();
})();
