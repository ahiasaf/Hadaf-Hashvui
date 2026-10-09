function stuDevice() {
    try {
        if (localStorage.getItem("df:admOk") === "1") return null;
        if (localStorage.getItem("df:head") || localStorage.getItem("df:headSeen") === "1") return null;
        if (localStorage.getItem("df:ram")) return null;
        var me = JSON.parse(localStorage.getItem("df:me") || "null");
        return me && me.first ? me : null;
    } catch (e) {
        return null;
    }
}

function stuHomeGo(me) {
    location.replace("join.html" + (me.inst ? "?inst=" + encodeURIComponent(me.inst) : ""));
}

(function() {
    var me = stuDevice();
    if (me && (!location.hash || location.hash === "#")) stuHomeGo(me);
})();
