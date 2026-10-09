var LAB_VER = "0.3";

document.getElementById("ver").textContent = "v" + LAB_VER;

var TARGET_W = 1500;

var API = (window.APPS_SCRIPT_URL || "").trim();

try {
    var cfg = JSON.parse(localStorage.getItem("df:cfg") || "{}");
    if (cfg.api) API = cfg.api;
    var a2 = localStorage.getItem("dfApi");
    if (a2) API = a2;
} catch (e) {}

var D = null, PDF = null, CACHE = {};

function $(id) {
    return document.getElementById(id);
}

function say(t, bad) {
    var e = $("stat");
    e.className = bad ? "bad" : "";
    e.textContent = t;
}

function dafKey(d) {
    return String(d).replace(/["'׳״\s]/g, "");
}

function fileId(u) {
    var m = /\/d\/([-\w]{20,})/.exec(u || "");
    return m ? m[1] : null;
}

function fillSel(el, items) {
    el._items = items;
    el.innerHTML = items.map(function(v, i) {
        return '<option value="' + i + '">' + v[1] + "</option>";
    }).join("");
    el.disabled = items.length < 2;
}

function selVal(id) {
    var el = $(id), it = el._items && el._items[+el.value];
    return it ? it[0] : "";
}

function jsonp(url) {
    return new Promise(function(ok, fail) {
        var n = "__lab" + Date.now(), sc = document.createElement("script");
        var done = function(v) {
            try {
                delete window[n];
            } catch (e) {
                window[n] = undefined;
            }
            clearTimeout(t);
            sc.remove();
            v ? ok(v) : fail(new Error("timeout"));
        };
        var t = setTimeout(function() {
            done(null);
        }, 6e4);
        window[n] = done;
        sc.onerror = function() {
            done(null);
        };
        sc.src = url + "&callback=" + n;
        document.body.appendChild(sc);
    });
}

function grab(id) {
    if (CACHE[id]) return Promise.resolve(CACHE[id]);
    if (!API) return Promise.reject(new Error("אין כתובת שרת"));
    var url = API + (API.indexOf("?") < 0 ? "?" : "&") + "file=" + encodeURIComponent(id);
    return fetch(url).then(function(r) {
        return r.json();
    }).catch(function() {
        return jsonp(url);
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.data) throw new Error("no data");
        var bin = atob(d.data), buf = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        CACHE[id] = buf;
        return buf;
    });
}

function pdfReady() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise(function(ok) {
        window.addEventListener("pdfjs-ready", function() {
            ok();
        }, {
            once: true
        });
    });
}

function openDaf() {
    var mas = selVal("mas"), daf = selVal("daf");
    var links = ((window.DAF_LINKS || {})[mas] || {})[dafKey(daf)] || [];
    var id = fileId(links[0]);
    if (!id) {
        say("אין קובץ צורת הדף לדף הזה.", 1);
        return;
    }
    say("מביא " + daf + "…");
    grab(id).then(function(buf) {
        return pdfReady().then(function() {
            return buf;
        });
    }).then(function(buf) {
        return pdfjsLib.getDocument({
            data: buf.slice(0)
        }).promise;
    }).then(function(doc) {
        PDF = doc;
        var pages = [];
        for (var i = 1; i <= doc.numPages; i++) pages.push([ i, doc.numPages === 2 ? i === 1 ? "ע״א" : "ע״ב" : "עמוד " + i ]);
        fillSel($("pg"), pages);
        return showPage(1);
    }).catch(function(e) {
        say("לא הצלחתי: " + e.message, 1);
    });
}

function showPage(n) {
    if (!PDF) return Promise.resolve();
    say("מצייר…");
    return PDF.getPage(n).then(function(pg) {
        var base = pg.getViewport({
            scale: 1
        });
        var vp = pg.getViewport({
            scale: TARGET_W / base.width
        });
        var c = document.createElement("canvas");
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        return pg.render({
            canvasContext: c.getContext("2d", {
                willReadFrequently: true
            }),
            viewport: vp
        }).promise.then(function() {
            var px = c.getContext("2d", {
                willReadFrequently: true
            }).getImageData(0, 0, c.width, c.height).data;
            D = {
                m: ink(px, c.width, c.height),
                w: c.width,
                h: c.height
            };
            $("page").src = c.toDataURL("image/webp", .85);
            run();
        });
    });
}

function ink(data, w, h) {
    var m = new Uint8Array(w * h);
    for (var i = 0, p = 0; i < m.length; i++, p += 4) m[i] = data[p] * .299 + data[p + 1] * .587 + data[p + 2] * .114 < 150 ? 1 : 0;
    return m;
}

function median(a) {
    if (!a.length) return 0;
    var v = a.slice().sort(function(p, q) {
        return p - q;
    });
    return v[v.length >> 1];
}

function stripRuns(m, w, x0, x1, y0, y1) {
    var out = [], s = null;
    for (var y = y0; y < y1; y++) {
        var n = 0;
        for (var x = x0; x < x1; x++) if (m[y * w + x]) n++;
        var on = n > (x1 - x0) * .06;
        if (on && s === null) s = y; else if (!on && s !== null) {
            if (y - s >= 3) out.push([ s, y ]);
            s = null;
        }
    }
    if (s !== null && y1 - s >= 3) out.push([ s, y1 ]);
    return out;
}

function split2(vals) {
    if (vals.length < 2) return {
        cut: 0,
        lo: 0,
        hi: 0
    };
    var v = vals.slice().sort(function(a, b) {
        return a - b;
    });
    var lo = v[Math.floor(v.length * .2)], hi = v[Math.floor(v.length * .8)];
    for (var it = 0; it < 12; it++) {
        var A = [], B = [];
        v.forEach(function(x) {
            (Math.abs(x - lo) <= Math.abs(x - hi) ? A : B).push(x);
        });
        var nlo = A.length ? median(A) : lo, nhi = B.length ? median(B) : hi;
        if (nlo === lo && nhi === hi) break;
        lo = nlo;
        hi = nhi;
    }
    return {
        cut: (lo + hi) / 2,
        lo: lo,
        hi: hi
    };
}

function detect() {
    var m = D.m, w = D.w, h = D.h;
    var rows = new Uint32Array(h), cols = new Uint32Array(w);
    for (var y = 0; y < h; y++) {
        var o = y * w, n = 0;
        for (var x = 0; x < w; x++) if (m[o + x]) {
            n++;
            cols[x]++;
        }
        rows[y] = n;
    }
    var lim = w * .004;
    var y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
    while (y0 < h && rows[y0] < lim) y0++;
    while (y1 > y0 && rows[y1] < lim) y1--;
    var clim = (y1 - y0) * .004;
    while (x0 < w && cols[x0] < clim) x0++;
    while (x1 > x0 && cols[x1] < clim) x1--;
    if (x1 - x0 < 50 || y1 - y0 < 50) return null;
    var SW = Math.max(6, Math.round((x1 - x0) / 90));
    var strips = [];
    for (var sx = x0; sx + SW <= x1; sx += SW) {
        var rs = stripRuns(m, w, sx, sx + SW, y0, y1);
        var hs = rs.map(function(r) {
            return r[1] - r[0];
        }).filter(function(v) {
            return v >= 3 && v < (y1 - y0) * .1;
        });
        strips.push({
            x0: sx,
            x1: sx + SW,
            runs: rs,
            hm: median(hs),
            n: hs.length
        });
    }
    var have = strips.filter(function(s) {
        return s.n >= 4;
    });
    if (have.length < 6) return null;
    var sp = split2(have.map(function(s) {
        return s.hm;
    }));
    sp.cut = sp.lo + (sp.hi - sp.lo) * .62;
    strips.forEach(function(s) {
        s.big = s.n >= 4 && s.hm >= sp.cut;
    });
    var NS = strips.length, NH = y1 - y0;
    var big = new Uint8Array(NH * NS);
    strips.forEach(function(s, si) {
        var hs = s.runs.map(function(r) {
            return r[1] - r[0];
        });
        s.runs.forEach(function(r, ri) {
            var h3 = median([ hs[ri - 2], hs[ri - 1], hs[ri], hs[ri + 1], hs[ri + 2] ].filter(function(v) {
                return v != null;
            }));
            if (h3 < sp.cut) return;
            for (var y = Math.max(y0, r[0]); y < Math.min(y1, r[1]); y++) big[(y - y0) * NS + si] = 1;
        });
    });
    var solid = new Uint8Array(NH * NS);
    for (var yy = 0; yy < NH; yy++) {
        var b0 = yy * NS;
        for (var si2 = 0; si2 < NS; si2++) {
            var n2 = (big[b0 + si2] ? 1 : 0) + (si2 > 0 ? big[b0 + si2 - 1] : 0) + (si2 < NS - 1 ? big[b0 + si2 + 1] : 0);
            solid[b0 + si2] = n2 >= 2 ? 1 : 0;
        }
    }
    var MINW = Math.max(3, Math.round(NS * .04));
    var lines = [], st = null;
    for (var y2 = 0; y2 < NH; y2++) {
        var cnt = 0, o2 = y2 * NS;
        for (var i2 = 0; i2 < NS; i2++) if (solid[o2 + i2]) cnt++;
        var any = cnt >= MINW;
        if (any && st === null) st = y2; else if (!any && st !== null) {
            if (y2 - st >= 3) lines.push([ st, y2 ]);
            st = null;
        }
    }
    if (st !== null && NH - st >= 3) lines.push([ st, NH ]);
    lines.forEach(function(ln) {
        var use = new Uint8Array(NS);
        for (var y3 = ln[0]; y3 < ln[1]; y3++) {
            var o3 = y3 * NS;
            for (var i3 = 0; i3 < NS; i3++) if (big[o3 + i3]) use[i3] = 1;
        }
        for (var i5 = 0; i5 < NS; i5++) {
            if (!use[i5]) continue;
            if (i5 > 0 && use[i5 - 1] || i5 < NS - 1 && use[i5 + 1]) continue;
            use[i5] = 0;
        }
        var bs = -1, be = -1, cs = -1;
        for (var i4 = 0; i4 <= NS; i4++) {
            var on = i4 < NS && use[i4];
            if (on && cs < 0) cs = i4; else if (!on && cs >= 0) {
                if (be < 0 || i4 - cs > be - bs) {
                    bs = cs;
                    be = i4;
                }
                cs = -1;
            }
        }
        ln.push(bs, be);
    });
    lines = lines.filter(function(ln) {
        return ln[2] >= 0;
    });
    var pit = median(lines.map(function(l) {
        return l[1] - l[0];
    })) * 2.2 || 20;
    var overlap = function(a, b) {
        var lo = Math.max(a[0], b[0]), hi = Math.min(a[1], b[1]);
        var big2 = Math.max(a[1] - a[0], b[1] - b[0]);
        return big2 > 0 ? Math.max(0, hi - lo) / big2 : 0;
    };
    var out = [], cz = null;
    lines.forEach(function(ln) {
        if (ln[3] <= ln[2]) return;
        var hcz = cz ? median(cz.hs) : 0, hln = ln[1] - ln[0];
        if (cz && overlap(cz.sp, [ ln[2], ln[3] ]) >= .78 && ln[0] - cz.last < pit * 2.2 && Math.abs(hcz - hln) <= Math.max(hcz, hln) * .35) {
            cz.y1 = y0 + ln[1];
            cz.last = ln[1];
            cz.n++;
            cz.hs.push(ln[1] - ln[0]);
            cz.sp[0] = Math.min(cz.sp[0], ln[2]);
            cz.sp[1] = Math.max(cz.sp[1], ln[3]);
            return;
        }
        if (cz) out.push(cz);
        cz = {
            y0: y0 + ln[0],
            y1: y0 + ln[1],
            last: ln[1],
            n: 1,
            sp: [ ln[2], ln[3] ],
            hs: [ ln[1] - ln[0] ]
        };
    });
    if (cz) out.push(cz);
    var inside = function(a, b) {
        return a[0] >= b[0] - 1 && a[1] <= b[1] + 1;
    };
    for (var q = 0; q < out.length; q++) {
        var z = out[q];
        if (z.n >= 3) continue;
        var pv = out[q - 1], nx = out[q + 1];
        var host = pv && inside(z.sp, pv.sp) ? pv : nx && inside(z.sp, nx.sp) ? nx : null;
        if (!host) continue;
        host.y0 = Math.min(host.y0, z.y0);
        host.y1 = Math.max(host.y1, z.y1);
        host.n += z.n;
        out.splice(q, 1);
        q--;
    }
    out = out.filter(function(z) {
        return z.n >= 3;
    });
    var merged = true;
    while (merged) {
        merged = false;
        for (var q2 = 0; q2 < out.length - 1; q2++) {
            var A = out[q2], B = out[q2 + 1];
            if (overlap(A.sp, B.sp) < .78) continue;
            if (B.y0 - A.y1 > pit * 2.5) continue;
            var ha = median(A.hs), hb = median(B.hs);
            if (Math.abs(ha - hb) > Math.max(ha, hb) * .25) continue;
            A.y1 = Math.max(A.y1, B.y1);
            A.n += B.n;
            A.hs = A.hs.concat(B.hs);
            A.sp = [ Math.min(A.sp[0], B.sp[0]), Math.max(A.sp[1], B.sp[1]) ];
            out.splice(q2 + 1, 1);
            merged = true;
            q2--;
        }
    }
    out.forEach(function(z) {
        z.a = strips[z.sp[0]].x0;
        z.b = strips[Math.min(z.sp[1], NS) - 1].x1;
    });
    return {
        strips: strips,
        split: sp,
        zones: out,
        bbox: [ x0, y0, x1, y1 ],
        sw: SW,
        pitch: pit
    };
}

var R = null;

function run() {
    var t = performance.now();
    R = detect();
    var ov = $("ov");
    ov.setAttribute("viewBox", "0 0 " + D.w + " " + D.h);
    if (!R) {
        ov.innerHTML = "";
        say("לא זוהה דבר.", 1);
        return;
    }
    var s = "";
    s += '<rect x="' + R.bbox[0] + '" y="' + R.bbox[1] + '" width="' + (R.bbox[2] - R.bbox[0]) + '" height="' + (R.bbox[3] - R.bbox[1]) + '" fill="none" stroke="#3B7D57" ' + 'stroke-width="2" stroke-dasharray="14 10" opacity=".5"/>';
    R.zones.forEach(function(z, i) {
        s += '<rect x="' + z.a + '" y="' + z.y0 + '" width="' + (z.b - z.a) + '" height="' + (z.y1 - z.y0) + '" fill="rgba(192,143,43,.15)" stroke="#C08F2B" stroke-width="5"/>' + '<text x="' + (z.a + z.b) / 2 + '" y="' + (z.y0 + R.pitch * 1.2) + '" text-anchor="middle" ' + 'font-size="' + R.pitch * 1.3 + '" font-weight="700" fill="#8A5A00">' + (i + 1) + "</text>";
    });
    ov.innerHTML = s;
    $("stats").innerHTML = st("אזורים", R.zones.length) + st("רצועות", R.strips.length) + st("גובה גמרא", Math.round(R.split.hi)) + st("גובה פירוש", Math.round(R.split.lo)) + st("יחס", (R.split.hi / (R.split.lo || 1)).toFixed(2)) + st("זמן", Math.round(performance.now() - t) + "ms");
    $("hist").innerHTML = R.strips.map(function(x) {
        var mx = R.split.hi * 1.6;
        return '<i class="' + (x.big ? "big" : "") + '" style="height:' + Math.max(4, Math.min(100, x.hm / mx * 100)) + '%"></i>';
    }).join("");
    say(selVal("mas") + " · דף " + selVal("daf") + " · " + R.zones.length + " אזורים · יחס גדלים " + (R.split.hi / (R.split.lo || 1)).toFixed(2));
    paintTally();
}
