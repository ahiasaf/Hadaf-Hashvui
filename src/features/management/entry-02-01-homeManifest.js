function homeManifest() {
    var q = String(location.search || "");
    var grab = function(n) {
        var m = q.match(new RegExp("[?&]" + n + "=([^&#]*)"));
        return m ? decodeURIComponent(m[1]).trim() : "";
    };
    var inst = grab("m");
    if (!inst) {
        try {
            inst = localStorage.getItem("dfInst") || "";
            if (!inst) {
                var r = JSON.parse(localStorage.getItem("dfReg") || "null");
                if (r && r.code && r.code !== "other") inst = r.code;
            }
        } catch (e) {
            inst = "";
        }
    }
    if (!/^[a-z]+$/.test(inst)) inst = "";
    var masa = /[?&]masa=(1|go)\b/.test(q) ? "-masa" : "";
    if (inst) return "mh/" + inst + masa + ".json";
    return masa ? "manifest-masa.json" : "manifest.json";
}

(function() {
    var adm = /\/admin\/?$/.test(location.pathname) || /^#admin(-acc|-help)?$/.test(location.hash);
    var icon = adm ? "icon-admin-192.png" : "icon-192.png";
    document.write('<link rel="manifest" href="' + (adm ? "admin-manifest.json" : homeManifest()) + '">' + '<link rel="apple-touch-icon" href="' + icon + '">' + '<link rel="apple-touch-icon" sizes="180x180" href="' + icon + '">' + '<link rel="apple-touch-icon-precomposed" href="' + icon + '">' + '<link rel="apple-touch-icon-precomposed" sizes="180x180" href="' + icon + '">' + '<meta name="apple-mobile-web-app-title" content="' + (adm ? "ניהול" : "הדף השבועי") + '">' + '<meta name="theme-color" content="' + (adm ? "#7A5610" : "#0E2E63") + '">');
})();
