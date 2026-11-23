// Runs in <head> before paint. Light is the default; only an explicit saved "dark" choice switches it.
(function () {
  var t = 'light';
  try { if (localStorage.getItem('ps-theme') === 'dark') t = 'dark'; } catch (e) { /* storage blocked: stay light */ }
  document.documentElement.setAttribute('data-theme', t);
})();
