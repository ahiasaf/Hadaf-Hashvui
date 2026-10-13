/* First-use setup preserves the requested lesson without adding a framework. */
(function () {
  var path = location.pathname.replace(/\.html$/, '');
  if (path !== '/app' && path !== '/learn' && path !== '/lesson-tools') return;
  var params = new URLSearchParams(location.search);
  if (params.get('embed') === '1' || params.get('rec') === '1' || params.has('demo')) return;
  try {
    var person = JSON.parse(localStorage.getItem('df:me') || 'null');
    var standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
    var installed = localStorage.getItem('df:installed') === 'true';
    var browserReady = localStorage.getItem('df:browserSetup') === 'true';
    if (person && person.id && (standalone || installed || browserReady)) {
      if (path === '/app') {
        var pending = JSON.parse(localStorage.getItem('df:setupNext') || 'null');
        if (typeof pending === 'string' && /^\/(learn|lesson-tools)(\?|$)/.test(pending)) {
          localStorage.removeItem('df:setupNext');
          location.replace(pending);
        }
      }
      return;
    }
    if (localStorage.getItem('df:admOk') === '1' || localStorage.getItem('df:head') || localStorage.getItem('df:ram')) return;
    var target = path + location.search + location.hash;
    localStorage.setItem('df:setupNext', JSON.stringify(target));
    location.replace((person && person.id ? '/start?next=' : '/join?next=') + encodeURIComponent(target));
  } catch {
    location.replace('/join?next=' + encodeURIComponent(path + location.search + location.hash));
  }
})();
