(function() {
    var q = location.search.replace(/^\?/, "").replace(/(^|&)wiz=\d(&|$)/, "$1");
    location.replace("/join" + (q ? "?" + q : ""));
})();
