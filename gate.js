/* ──────────────────────────────────────────────────────────────
   sighlurskin — simple site password gate
   ──────────────────────────────────────────────────────────────
   A lightweight, on-brand overlay that blocks the page until the
   password is entered. Self-contained (injects its own styles), so
   it works the same on every page regardless of that page's CSS.

   Once you enter the password correctly, this remembers you for
   REMEMBER_DAYS on that browser — so moving between pages (or coming
   back tomorrow) does not prompt again. To make it forget, run
   __gateReset() in the browser console.

   NOTE: this is a CLIENT-SIDE gate. It keeps casual visitors out, but
   it is NOT cryptographically secure — the page HTML is still sent to
   the browser, so a technical visitor could bypass it. For a real lock,
   use server-side auth (Vercel Password Protection or Edge Middleware).
   ────────────────────────────────────────────────────────────── */
(function () {
  var PASSWORD = 'Heidi';
  var REMEMBER_DAYS = 30;
  var KEY = '__sighlurGate';
  var MAX_AGE = REMEMBER_DAYS * 24 * 60 * 60 * 1000;

  /* Short fingerprint of the current password. This is NOT security —
     the password sits in this file either way. It does two useful things:
     the plaintext never gets written to the visitor's disk, and changing
     PASSWORD above automatically re-prompts everyone previously let in. */
  function stamp(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return String(h >>> 0);
  }

  /* Some privacy settings (blocked cookies, certain private-window modes)
     make localStorage throw on access or write. Probe it once; if it's not
     usable we simply fall back to prompting on every load. */
  var store = null;
  try {
    store = window.localStorage;
    store.setItem(KEY + ':probe', '1');
    store.removeItem(KEY + ':probe');
  } catch (e) {
    store = null;
  }

  function isUnlocked() {
    if (!store) return false;
    try {
      var raw = store.getItem(KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      if (!saved || saved.p !== stamp(PASSWORD)) return false; // password changed
      if (Date.now() - saved.t > MAX_AGE) {                    // grant expired
        store.removeItem(KEY);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function remember() {
    if (!store) return;
    try {
      store.setItem(KEY, JSON.stringify({ p: stamp(PASSWORD), t: Date.now() }));
    } catch (e) {}
  }

  // Escape hatch for testing: re-lock this browser from the console.
  window.__gateReset = function () {
    try { if (store) store.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  // Already let in — leave the page completely alone. Bailing out before
  // the hide-style below is what avoids any flash of hidden content.
  if (isUnlocked()) return;

  // Hide the real page content immediately (before it paints), exempting
  // our overlay. Runs from <head>, so content is hidden as it parses —
  // no flash of the protected page.
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
        remember();
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
