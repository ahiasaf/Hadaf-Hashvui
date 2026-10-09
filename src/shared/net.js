/* Shared public reads. No credentials, private rows, or persistent raw cache. */
(function (root) {
  if (!root.fetch || root.DFNet) return;
  var original = root.fetch.bind(root), owner = root;
  try { if (root.parent !== root && root.parent.location.origin === root.location.origin && root.parent.DFNet) owner = root.parent; } catch (e) {}
  var pending = {}, cached = {}, fresh = {};
  function csv(text) {
    var rows = [], row = [], field = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (quoted) { if (ch === '"' && text.charAt(i + 1) === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch; }
      else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    if (rows.length && rows[0].length) rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
    return rows;
  }
  function read(url, options) {
    var key = url.replace(/([?&])t=\d+(&|$)/, '$1').replace(/[?&]$/, '');
    if (cached[key] && Date.now() - cached[key].at < 15000 && !(options && options.cache === 'reload')) return Promise.resolve(cached[key].response.clone());
    if (pending[key]) return pending[key].then(function (r) { return r.clone(); });
    var timer, controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var requestOptions = {}; for (var option in options) requestOptions[option] = options[option];
    if (controller) requestOptions.signal = controller.signal;
    var task = Promise.race([original(url, requestOptions), new Promise(function (_, reject) { timer = setTimeout(function () { if (controller) controller.abort(); reject(new Error('Public read timed out')); }, 8000); })]);
    pending[key] = task.then(function (response) {
      clearTimeout(timer); delete pending[key];
      if (response.ok) cached[key] = { at: Date.now(), response: response.clone() };
      return response;
    }, function (error) { clearTimeout(timer); delete pending[key]; throw error; });
    return pending[key].then(function (response) { return response.clone(); });
  }
  function sharedFetch(input, options) {
    var url = typeof input === 'string' ? input : input.url;
    if (options && options.method && options.method.toUpperCase() !== 'GET') {
      try { var body = JSON.parse(options.body || '{}'); if (body.tab) { cached = {}; fresh[body.tab] = Date.now(); } } catch (e) {}
      return original(input, options);
    }
    if (typeof input !== 'string') return original(input, options);
    var match = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]+)\/gviz\/tq\?/.exec(url);
    if (match && root.DF_SHEET_ID && match[1] === root.DF_SHEET_ID) {
      var parsed = new URL(url), tab = parsed.searchParams.get('sheet') || '';
      var allowed = root.DF_PUBLIC_TABS || [];
      if (allowed.indexOf(tab) >= 0) {
        url = '/api/sheets?tab=' + encodeURIComponent(tab);
        ['tq', 'headers'].forEach(function (name) { if (parsed.searchParams.has(name)) url += '&' + name + '=' + encodeURIComponent(parsed.searchParams.get(name)); });
        if (fresh[tab]) url += '&fresh=' + fresh[tab];
        return owner !== root ? owner.DFNet.read(url, options) : read(url, options);
      }
    }
    if (url.indexOf('/api/sheets?') === 0) return owner !== root ? owner.DFNet.read(url, options) : read(url, options);
    return original(input, options);
  }
  root.DFNet = { read: read, csv: csv, clear: function () { cached = {}; } };
  root.fetch = sharedFetch;
})(window);
