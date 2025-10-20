(function () {
  var CLEAN_INTERVAL_MS = 1000;

  function clean() {
    try {
      var nodes = document.querySelectorAll('[inert]');
      if (!nodes || nodes.length === 0) return;
      nodes.forEach(function (el) {
        el.removeAttribute('inert');
      });
    } catch (e) {
      // swallow errors; best-effort cleaner
    }
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    clean();
    setInterval(clean, CLEAN_INTERVAL_MS);
  }
})();


