/* Shared public reads. No credentials, private rows, or persistent raw cache. */
(function (root) {
  if (!root.fetch || root.DFNet) return;
  var original = root.fetch.bind(root), owner = root;
  try { if (root.parent !== root && root.parent.location.origin === root.location.origin && root.parent.DFNet) owner = root.parent; } catch (e) {}
  var pending = {}, cached = {}, fresh = {}, notificationRequests = {};
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
  /* Legacy tools address the Apps Script URL. Every such call goes through the same-origin API,
     which serves it from the authoritative backend: Apps Script before cutover, Neon after.
     Drive file downloads stay direct because they are not database operations. */
  function isApi(url) {
    return !!root.DF_API && (url === root.DF_API || url.indexOf(root.DF_API + '?') === 0);
  }
  function isFile(url) {
    try { return new URL(url).searchParams.has('file'); } catch (e) { return false; }
  }
  function legacy(payload) {
    return original('/api/action', {method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({operation:'legacy',payload:payload})});
  }
  function sharedFetch(input, options) {
    var url = typeof input === 'string' ? input : input.url;
    if (options && options.method && options.method.toUpperCase() !== 'GET') {
      try { var body = JSON.parse(options.body || '{}'); if (body.tab) { cached = {}; fresh[body.tab] = Date.now(); } } catch (e) {}
      if (typeof input === 'string' && isApi(url)) return legacy({method:'POST',body:typeof options.body === 'string' ? options.body : '{}'});
      return original(input, options);
    }
    if (typeof input !== 'string') return original(input, options);
    if (isApi(url) && !isFile(url)) {
      var query = new URL(url);
      if (query.searchParams.get('fire') !== 'say') return legacy({method:'GET',query:query.search.slice(1)});
      var payload = {}; query.searchParams.forEach(function (value, name) { payload[name] = value; });
      var identity = JSON.stringify(payload);
      if (!notificationRequests[identity]) notificationRequests[identity] = {id: crypto.randomUUID(), at: Date.now()};
      if (Date.now() - notificationRequests[identity].at > 300000) notificationRequests[identity] = {id: crypto.randomUUID(), at: Date.now()};
      payload.requestId = notificationRequests[identity].id;
      return original('/api/action', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'notify',payload:payload})});
    }

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
  /* JSONP fallbacks set script.src to the Apps Script URL. Serve those through the same route and
     call the page's callback, so no fallback can reach a retired backend directly. */
  var source = root.HTMLScriptElement && Object.getOwnPropertyDescriptor(root.HTMLScriptElement.prototype, 'src');
  if (source && source.set) Object.defineProperty(root.HTMLScriptElement.prototype, 'src', {
    configurable: true, enumerable: source.enumerable, get: source.get,
    set: function (value) {
      var url = String(value), script = this;
      if (!isApi(url) || isFile(url)) return source.set.call(this, value);
      var query = new URL(url), name = query.searchParams.get('callback') || query.searchParams.get('cb');
      query.searchParams.delete('callback'); query.searchParams.delete('cb');
      sharedFetch(query.href).then(function (response) {
        if (!response.ok) throw new Error('Legacy request failed');
        return response.json();
      }).then(function (data) {
        if (name && typeof root[name] === 'function') root[name](data);
      }).catch(function () {
        if (typeof script.onerror === 'function') script.onerror(new Event('error'));
      });
    }
  });
})(window);
