var REF_W = 2539;

var IMG = null, D = null, S = null;

function ink(data, w, h) {
    var m = new Uint8Array(w * h);
    for (var i = 0, p = 0; i < m.length; i++, p += 4) {
        m[i] = data[p] * .299 + data[p + 1] * .587 + data[p + 2] * .114 < 150 ? 1 : 0;
    }
    return m;
}

function colSum(m, w, h, x) {
    var s = 0;
    for (var y = 0; y < h; y++) s += m[y * w + x];
    return s;
}

function rowMean(m, w, y, a, b) {
    if (b <= a) return 0;
    var s = 0, o = y * w;
    for (var x = a; x < b; x++) s += m[o + x];
    return s / (b - a);
}

function runs(arr, hmin) {
    var out = [], s = null;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] && s === null) s = i; else if (!arr[i] && s !== null) {
            if (i - s >= hmin) out.push([ s, i ]);
            s = null;
        }
    }
    if (s !== null && arr.length - s >= hmin) out.push([ s, arr.length ]);
    return out;
}

function smooth3(a) {
    var o = new Float32Array(a.length);
    for (var i = 0; i < a.length; i++) {
        var s = a[i], n = 1;
        if (i) {
            s += a[i - 1];
            n++;
        }
        if (i < a.length - 1) {
            s += a[i + 1];
            n++;
        }
        o[i] = s / n;
    }
    return o;
}

function median(v) {
    if (!v.length) return 0;
    var s = v.slice().sort(function(a, b) {
        return a - b;
    });
    return s[s.length >> 1];
}

function pitchOf(m, w, a, b, y0, y1) {
    if (y1 - y0 < 4) return null;
    var p = new Float32Array(y1 - y0);
    for (var y = y0; y < y1; y++) p[y - y0] = rowMean(m, w, y, a, b);
    p = smooth3(p);
    var st = [], on = false;
    for (var i = 0; i < p.length; i++) {
        var v = p[i] > .02;
        if (v && !on) st.push(i);
        on = v;
    }
    if (st.length < 4) return null;
    var d = [];
    for (var i = 1; i < st.length; i++) {
        var q = st[i] - st[i - 1];
        if (q > 6 && q < 70) d.push(q);
    }
    return d.length ? median(d) : null;
}

function isFloating(m, w, a, b, t, bt) {
    var wide = b - a, cover = 0, xs = -1, xe = -1;
    for (var x = a; x < b; x++) {
        var any = 0;
        for (var y = t; y < bt && !any; y++) if (m[y * w + x]) any = 1;
        if (any) {
            cover++;
            if (xs < 0) xs = x;
            xe = x;
        }
    }
    if (!cover) return true;
    var span = xe - xs + 1;
    return cover / wide < .25 && span / wide < .34;
}

function linesIn(m, w, a, b, y0, y1, pit, vilna) {
    if (y1 - y0 < 2) return [];
    var p = new Float32Array(y1 - y0);
    for (var y = y0; y < y1; y++) p[y - y0] = rowMean(m, w, y, a, b);
    p = smooth3(p);
    var on = new Uint8Array(p.length);
    for (var i = 0; i < p.length; i++) on[i] = p[i] > .02 ? 1 : 0;
    var out = [];
    runs(on, 6).forEach(function(r) {
        var s = r[0], e = r[1], h = e - s;
        var n = pit ? Math.max(1, Math.round(h / pit)) : 1;
        if (n === 1 || h < pit * 1.45) {
            out.push([ s + y0, e + y0 ]);
            return;
        }
        var cuts = [ s ];
        for (var k = 1; k < n; k++) {
            var t = s + Math.round(h * k / n);
            var lo = Math.max(s + 3, t - Math.round(pit * .3)), hi = Math.min(e - 3, t + Math.round(pit * .3));
            if (hi <= lo) {
                cuts.push(t);
                continue;
            }
            var bi = lo, bv = Infinity;
            for (var q = lo; q < hi; q++) if (p[q] < bv) {
                bv = p[q];
                bi = q;
            }
            cuts.push(bi);
        }
        cuts.push(e);
        for (var i = 0; i < cuts.length - 1; i++) if (cuts[i + 1] - cuts[i] >= 5) out.push([ cuts[i] + y0, cuts[i + 1] + y0 ]);
    });
    if (!vilna) return out;
    return out.filter(function(l) {
        return !isFloating(m, w, a, b, l[0], l[1]);
    });
}

function K(pit) {
    return {
        win: Math.max(9, Math.round(pit * 2.1)) | 1,
        wmin: Math.max(6, Math.round(pit * .6)),
        cmin: Math.round(pit * 2.7),
        gmin: Math.max(4, Math.round(pit * .3))
    };
}

function analyse(m, w, h, pit0) {
    var sc = w / REF_W;
    if (!pit0) {
        var first = analyse(m, w, h, 33 * sc);
        if (first && Math.abs(first.gpitch - 33 * sc) > 2) {
            var second = analyse(m, w, h, first.gpitch);
            if (second) return second;
        }
        return first;
    }
    var C = K(pit0);
    var rs = [], cs = [];
    for (var y = 0; y < h; y++) {
        var s = 0, o = y * w;
        for (var x = 0; x < w; x++) s += m[o + x];
        rs.push(s);
    }
    for (var x = 0; x < w; x++) cs.push(colSum(m, w, h, x));
    var y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
    while (y0 < h && rs[y0] <= w * .004) y0++;
    while (y1 > y0 && rs[y1] <= w * .004) y1--;
    while (x0 < w && cs[x0] <= h * .004) x0++;
    while (x1 > x0 && cs[x1] <= h * .004) x1--;
    var win = C.win, half = win >> 1;
    var emptyCnt = new Int32Array(w);
    var empt = new Uint8Array(w * h);
    for (var x = x0; x <= x1; x++) {
        var acc = 0;
        for (var y = 0; y <= half && y < h; y++) acc += m[y * w + x];
        for (var y = 0; y < h; y++) {
            var t = y - half, bt = t + win;
            if (y > 0) {
                if (bt - 1 < h) acc += m[(bt - 1) * w + x];
                if (t - 1 >= 0) acc -= m[(t - 1) * w + x];
            }
            var e = acc / win < .004 ? 1 : 0;
            empt[y * w + x] = e;
            if (e && y >= y0 && y <= y1) emptyCnt[x]++;
        }
    }
    var gcand = new Uint8Array(w);
    for (var x = x0; x <= x1; x++) gcand[x] = emptyCnt[x] > (y1 - y0) * .25 ? 1 : 0;
    var guts = runs(gcand, C.gmin);
    var edges = [ [ x0, x0 ] ].concat(guts).concat([ [ x1, x1 ] ]);
    var cols = [];
    for (var i = 0; i < edges.length - 1; i++) {
        var a = edges[i][1], b = edges[i + 1][0];
        if (b - a < C.cmin) continue;
        var pt = pitchOf(m, w, a, b, y0, y1);
        if (pt) cols.push({
            a: a,
            b: b,
            pitch: pt
        });
    }
    if (cols.length < 3) return null;
    var pmax = Math.max.apply(null, cols.map(function(c) {
        return c.pitch;
    }));
    var core = cols.filter(function(c) {
        return c.pitch > pmax * .8;
    });
    var bx0 = Math.min.apply(null, core.map(function(c) {
        return c.a;
    }));
    var bx1 = Math.max.apply(null, core.map(function(c) {
        return c.b;
    }));
    var mid = (bx0 + bx1) / 2;
    var spine = core.slice().sort(function(p, q) {
        return Math.abs((p.a + p.b) / 2 - mid) - Math.abs((q.a + q.b) / 2 - mid);
    })[0];
    var cw = bx1 - bx0, gA = spine.a, gB = spine.b;
    var nomA = Math.round(bx0 + cw * .298), nomB = Math.round(bx0 + cw * .702);
    var tol = cw * .06;
    if (Math.abs(gA - nomA) > tol) gA = nomA;
    if (Math.abs(gB - nomB) > tol) gB = nomB;
    var wmin = C.wmin;
    var L = new Uint8Array(h), R = new Uint8Array(h);
    var rowInk = new Float32Array(h);
    for (var y = y0; y <= y1; y++) rowInk[y] = rowMean(m, w, y, bx0, bx1);
    var thinInk = median(Array.prototype.slice.call(rowInk, y0, y1 + 1).filter(function(v) {
        return v > .004;
    })) * .22;
    for (var y = y0; y <= y1; y++) {
        var row = [];
        var s = null;
        for (var x = x0; x <= x1; x++) {
            var e = empt[y * w + x];
            if (e && s === null) s = x; else if (!e && s !== null) {
                if (x - s >= wmin) row.push([ s, x ]);
                s = null;
            }
        }
        if (s !== null && x1 - s >= wmin) row.push([ s, x1 ]);
        row.forEach(function(g) {
            if (Math.abs(g[1] - gA) <= wmin * 2 && g[0] >= bx0 - wmin) L[y] = 1;
            if (Math.abs(g[0] - gB) <= wmin * 2 && g[1] <= bx1 + wmin) R[y] = 1;
        });
        if (rowInk[y] < thinInk) {
            L[y] = 2;
            R[y] = 2;
        }
    }
    var gpit = spine.pitch;
    var mm = Math.round(gpit * 1.2);
    function sm(v) {
        var o = new Uint8Array(h), acc = 0, cnt = 0, half = mm >> 1;
        var add = function(y, k) {
            if (y < 0 || y >= h || v[y] === 2) return;
            acc += k * v[y];
            cnt += k;
        };
        for (var y = 0; y < h + half; y++) {
            add(y, 1);
            add(y - mm, -1);
            var c = y - half;
            if (c >= 0 && c < h) o[c] = cnt ? acc / cnt > .45 ? 1 : 0 : 0;
        }
        return o;
    }
    L = sm(L);
    R = sm(R);
    var gtop = y0;
    for (var y = y0; y <= y1; y++) if (L[y] && R[y]) {
        gtop = y;
        break;
    }
    var zones = [], cur = null, st = gtop;
    for (var y = gtop; y <= y1 + 1; y++) {
        var k = y <= y1 ? (L[y] ? 1 : 0) * 2 + (R[y] ? 1 : 0) : -1;
        if (cur === null) {
            cur = k;
            st = y;
        } else if (k !== cur) {
            zones.push({
                y0: st,
                y1: y - 1,
                k: cur
            });
            cur = k;
            st = y;
        }
    }
    zones = zones.filter(function(z) {
        return z.y1 - z.y0 > gpit;
    });
    zones.forEach(function(z) {
        z.inA = !!(z.k & 2);
        z.inB = !!(z.k & 1);
        z.a = z.inA ? gA : bx0;
        z.b = z.inB ? gB : bx1;
        z.pitch = pitchOf(m, w, z.a, z.b, z.y0, z.y1) || gpit;
    });
    var others = core.filter(function(c) {
        return c !== spine;
    });
    var cpit = median(others.map(function(c) {
        return c.pitch;
    })) || gpit * .88;
    zones = zones.filter(function(z) {
        if (z.k !== 0) return true;
        return Math.abs(z.pitch - gpit) <= Math.abs(z.pitch - cpit) * 1.35;
    });
    snapZones(m, w, zones, gpit, bx0, gA, gB, bx1);
    zones = zones.filter(function(z) {
        return z.y1 > z.y0;
    });
    return {
        w: w,
        h: h,
        sc: sc,
        bbox: [ x0, y0, x1, y1 ],
        outer: [ bx0, bx1 ],
        inner: [ gA, gB ],
        core: [ bx0, bx1 ],
        spine: [ gA, gB ],
        gpitch: gpit,
        cpitch: cpit,
        zones: zones,
        grid: [ bx0, gA, gB, bx1 ]
    };
}

function inkIn(m, w, x0, x1, t, b) {
    if (x1 - x0 < 3 || b <= t) return 0;
    var s = 0;
    for (var y = t; y < b; y++) s += rowMean(m, w, y, x0, x1);
    return s / (b - t);
}

function snapZones(m, w, zones, pit, bx0, gA, gB, bx1) {
    for (var i = 0; i < zones.length - 1; i++) {
        var up = zones[i], dn = zones[i + 1];
        if (up.k === dn.k) continue;
        var wide = up.b - up.a >= dn.b - dn.a ? up : dn;
        var narrow = wide === up ? dn : up;
        var L = [ Math.min(wide.a, narrow.a), Math.max(wide.a, narrow.a) ];
        var R = [ Math.min(wide.b, narrow.b), Math.max(wide.b, narrow.b) ];
        if (L[1] - L[0] < 3 && R[1] - R[0] < 3) continue;
        var bnd = up.y1;
        var lines = linesIn(m, w, wide.a, wide.b, Math.max(0, bnd - Math.round(pit * 2.5)), bnd + Math.round(pit * 2.5), pit, true);
        if (!lines.length) continue;
        var hit = null;
        for (var j = 0; j < lines.length; j++) {
            var l = lines[j];
            if (l[0] <= bnd && bnd <= l[1]) {
                hit = l;
                break;
            }
        }
        if (!hit) {
            var best = Infinity;
            lines.forEach(function(l) {
                var d = Math.min(Math.abs(l[0] - bnd), Math.abs(l[1] - bnd));
                if (d < best) {
                    best = d;
                    hit = l;
                }
            });
            if (best > pit) continue;
        }
        var core = inkIn(m, w, Math.max(gA, wide.a), Math.min(gB, wide.b), hit[0], hit[1]);
        if (core < .01) continue;
        var out = Math.max(inkIn(m, w, L[0], L[1], hit[0], hit[1]), inkIn(m, w, R[0], R[1], hit[0], hit[1]));
        var isWide = out > core * .25;
        var y = isWide === (wide === up) ? hit[1] : hit[0] - 1;
        if (Math.abs(y - bnd) > pit * 1.5) continue;
        if (y <= up.y0 || y >= dn.y1) continue;
        up.y1 = y;
        dn.y0 = y + 1;
    }
}
