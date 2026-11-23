(function () {
  var root = document.documentElement, body = document.body;
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('ps-theme', t); } catch (e) { /* ignore */ }
    var b = document.getElementById('theme-btn');
    if (b) { b.setAttribute('aria-pressed', t === 'dark'); b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
  }
  var tb = document.getElementById('theme-btn');
  if (tb) { setTheme(root.getAttribute('data-theme') || 'light'); tb.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }); }

  var mb = document.getElementById('menu-btn');
  function menu(open) { body.classList.toggle('nav-open', open); if (mb) { mb.setAttribute('aria-expanded', String(open)); mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); } }
  if (mb) mb.addEventListener('click', function () { menu(!body.classList.contains('nav-open')); });
  var scrim = document.querySelector('.scrim'); if (scrim) scrim.addEventListener('click', function () { menu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
  document.querySelectorAll('.side a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  window.matchMedia('(min-width:960px)').addEventListener('change', function (m) { if (m.matches) menu(false); });

  function copy(text, btn) {
    var done = function () { btn.classList.add('done'); var l = btn.querySelector('.lbl'); if (l) l.textContent = 'Copied'; setTimeout(function () { btn.classList.remove('done'); if (l) l.textContent = 'Copy'; }, 1600); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () {});
    else { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } t.remove(); }
  }
  document.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { copy(b.getAttribute('data-copy'), b); }); });
  document.querySelectorAll('.codewrap').forEach(function (w) {
    var pre = w.querySelector('pre'); if (!pre) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'copy'; b.setAttribute('aria-label', 'Copy code');
    var s = document.createElement('span'); s.className = 'lbl'; s.textContent = 'Copy'; b.appendChild(s); b.addEventListener('click', function () { copy(pre.innerText.replace(/\n$/, ''), b); }); w.appendChild(b);
  });

  var links = document.querySelectorAll('.toc-r a');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove('on'); }); var a = map[e.target.id]; if (a) a.classList.add('on'); } });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
