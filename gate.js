/* ──────────────────────────────────────────────────────────────
   sighlurskin — simple site password gate
   ──────────────────────────────────────────────────────────────
   A lightweight, on-brand overlay that blocks the page until the
   password is entered. Self-contained (injects its own styles), so
   it works the same on every page regardless of that page's CSS.

   NOTE: this is a CLIENT-SIDE gate. It keeps casual visitors out, but
   it is NOT cryptographically secure — the page HTML is still sent to
   the browser, so a technical visitor could bypass it via dev tools or
   by reading the source. For real protection, use server-side auth
   (Vercel deployment Password Protection, or Edge Middleware Basic Auth).
   ────────────────────────────────────────────────────────────── */
(function () {
  var KEY = 'ss_gate_ok';
  var PASSWORD = 'Heidi';

  // Already unlocked this browser? Do nothing.
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}

  // Hide the real page content immediately (before it paints), exempting
  // our overlay. This runs from <head>, so body children are hidden as
  // they parse — no flash of the protected content.
  var hide = document.createElement('style');
  hide.id = '__gateHide';
  hide.textContent =
    'body > *:not(#__gate){visibility:hidden !important}' +
    'html,body{overflow:hidden !important}';
  (document.head || document.documentElement).appendChild(hide);

  function build() {
    if (document.getElementById('__gate')) return;

    var style = document.createElement('style');
    style.textContent = [
      '#__gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#EFE9DA;padding:24px;font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;visibility:visible !important}',
      '#__gate *{visibility:visible !important;box-sizing:border-box}',
      '.__gate-card{width:100%;max-width:380px;text-align:center}',
      '.__gate-mark{width:56px;height:56px;margin:0 auto 18px;background:#1438A0;color:#F4EEDF;border-radius:50% 50% 50% 14%;display:flex;align-items:center;justify-content:center;font-family:"Bagel Fat One",system-ui,sans-serif;font-size:28px;padding-bottom:2px}',
      '.__gate-word{font-family:"Bagel Fat One",system-ui,sans-serif;font-size:30px;color:#1438A0;line-height:1;margin-bottom:14px;letter-spacing:-0.01em}',
      '.__gate-sub{color:rgba(16,23,48,.7);font-size:15px;margin:0 0 22px;line-height:1.5}',
      '#__gateForm{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
      '#__gateInput{flex:1;min-width:200px;padding:14px 18px;border:2px solid #1438A0;border-radius:999px;font-size:16px;background:#F4EEDF;color:#101730;font-family:inherit}',
      '#__gateInput:focus{outline:none;border-color:#0A1F5C;box-shadow:0 0 0 4px rgba(20,56,160,.15)}',
      '#__gateBtn{padding:14px 26px;border:none;border-radius:999px;background:#1438A0;color:#F4EEDF;font-weight:600;font-size:16px;font-family:inherit;cursor:pointer}',
      '#__gateBtn:hover{background:#0A1F5C}',
      '.__gate-err{color:#B00020;font-size:12px;min-height:18px;margin:14px 0 0;font-family:"JetBrains Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}'
    ].join('');

    var g = document.createElement('div');
    g.id = '__gate';
    g.innerHTML =
      '<div class="__gate-card">' +
        '<div class="__gate-mark">@</div>' +
        '<div class="__gate-word">sighlurskin</div>' +
        '<p class="__gate-sub">This site is private. Enter the password to continue.</p>' +
        '<form id="__gateForm">' +
          '<input id="__gateInput" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" />' +
          '<button id="__gateBtn" type="submit">Enter &rarr;</button>' +
        '</form>' +
        '<p id="__gateErr" class="__gate-err" aria-live="polite"></p>' +
      '</div>';
    g.appendChild(style);
    document.body.appendChild(g);

    var form = document.getElementById('__gateForm');
    var input = document.getElementById('__gateInput');
    var err = document.getElementById('__gateErr');
    input.focus();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === PASSWORD) {
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
        var h = document.getElementById('__gateHide');
        if (h) h.parentNode.removeChild(h);
        g.parentNode.removeChild(g);
      } else {
        err.textContent = 'Incorrect password — try again.';
        input.value = '';
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
