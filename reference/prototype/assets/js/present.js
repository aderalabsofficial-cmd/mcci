/* present.js — presentation setup for the live MCCI demo (member portal + admin panel).
   Everything works. The public website and the development plan are not part of this demo.
   First visit (or "Start the demo fresh" on the start page) begins with an empty application. */
(function () {
  'use strict';
  const M = window.M, D = document;
  const FLAG = 'mcci10.present.v1';
  try {
    if (localStorage.getItem(FLAG) !== '1') { M.db = M.seed('new'); M.persist(); localStorage.setItem(FLAG, '1'); }
  } catch (e) { /* storage blocked: default demo data is used */ }

  /* Presenter shortcut: Shift + Alt + R starts the demo again with an empty application */
  D.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      try { M.db = M.seed('new'); M.persist(); localStorage.setItem(FLAG, '1'); sessionStorage.clear(); } catch (er) { /* ignore */ }
      M.go(M.ROLE === 'admin' ? 'dashboard.html' : 'join.html');
    }
  }, true);

  /* links added later (dropdowns, async content) still get folder addresses */
  let q = false;
  new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; M.fixLinks(); }); }).observe(D.body, { childList: true, subtree: true });
})();
