// sighlurskin — single-screen landing
// 1) Typewriter word in "For all your ___ questions."
// 2) Email signup → /api/subscribe (adds the contact in Resend).

// ── Typewriter ──────────────────────────────────────────────
// Words appear in this order, then loop back to the start.
const WORDS = [
  'acne', 'retinoid', 'azelaic acid', 'layering', 'skin barrier',
  'breakout', 'moisturizer', 'adapalene', 'tretinoin', 'dark spot',
  'sensitive skin', 'rosacea', 'SPF', 'vitamin C', 'hormonal acne',
  'oily skin', 'dry skin', 'sulfur', 'body care', 'scalp care',
];

const typedEl = document.getElementById('typed');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TYPE_MS = 85, DELETE_MS = 45, HOLD_MS = 1600, GAP_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cycle() {
  let i = 0;
  while (true) {
    const word = WORDS[i];
    if (reduceMotion) {
      typedEl.textContent = word;
      await sleep(2200);
    } else {
      for (let n = typedEl.textContent.length + 1; n <= word.length; n++) {
        typedEl.textContent = word.slice(0, n);
        await sleep(TYPE_MS);
      }
      await sleep(HOLD_MS);
      for (let n = word.length - 1; n >= 0; n--) {
        typedEl.textContent = word.slice(0, n);
        await sleep(DELETE_MS);
      }
      await sleep(GAP_MS);
    }
    i = (i + 1) % WORDS.length;
  }
}
if (typedEl) {
  // "acne" sits in the HTML as a no-JS fallback; clear it and type it in.
  typedEl.textContent = '';
  cycle();
}

// ── Email signup ────────────────────────────────────────────
// The Resend API key lives only in the serverless function (api/subscribe.js).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Button animation (states live in styles.css):
//   idle → loading: the pill squeezes into a circle with a spinner
//   loading → done: a check draws in, then a cobalt circle floods the screen from the
//                   button, and /welcome lifts that cobalt panel away (html.arriving)
//   loading → idle: back to a pill; errors give it a little shake
const form = document.querySelector('form.signup');
if (form) {
  const status = form.querySelector('.signup-status');
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('.btn-label');
  const consent = form.querySelector('input[name="consent"]');
  const consentRow = consent.closest('.consent');
  const CONSENT_MSG = "Please check the box so I know it's okay to email you.";
  const BAD_EMAIL_MSG = "Hmm... that email doesn't look right.";
  const MIN_LOADING_MS = 750; // long enough to see the morph, even when the API is quick

  // Re-run a one-shot CSS animation class, and drop it once it has played.
  const restart = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  };

  const show = (msg, isError = false) => {
    status.textContent = msg;
    status.classList.toggle('error', isError);
    restart(status, 'pop');
  };

  const flagConsent = (on) => {
    consentRow.classList.toggle('error', on);
    if (on) consent.setAttribute('aria-invalid', 'true');
    else consent.removeAttribute('aria-invalid');
  };

  const setState = (state) => {
    if (state !== 'idle' && button.dataset.state === 'idle') {
      // Measure while it's still a pill: squeeze each side in until width == height.
      button.style.setProperty('--squeeze', `${(button.offsetWidth - button.offsetHeight) / 2}px`);
    }
    button.dataset.state = state;
    button.disabled = state !== 'idle';
    button.setAttribute('aria-busy', String(state === 'loading'));
    const text = state === 'idle' ? 'Sign up' : state === 'loading' ? 'Signing up…' : 'Signed up!';
    // The visible label is faded out while animating; changing its text would resize the
    // button mid-morph. Only with reduced motion (no morph) does the label itself change.
    if (reduceMotion) label.textContent = text;
    else if (state === 'idle') button.removeAttribute('aria-label');
    else button.setAttribute('aria-label', text);
  };

  // Ticking the box clears its error straight away.
  consent.addEventListener('change', () => {
    if (consent.checked && consentRow.classList.contains('error')) {
      flagConsent(false);
      show('');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (button.dataset.state !== 'idle') return;
    const email = form.email.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      restart(form.email, 'shake');
      return show(BAD_EMAIL_MSG, true);
    }
    if (!consent.checked) {
      flagConsent(true);
      consent.focus();
      return show(CONSENT_MSG, true);
    }

    setState('loading');
    show('');

    const [result] = await Promise.all([
      subscribe(email, consent.checked, form.leave_blank.value),
      sleep(reduceMotion ? 0 : MIN_LOADING_MS),
    ]);

    if (result && result.ok && result.data.status !== 'already') {
      await celebrate();
      window.location.assign('/welcome');
      return;
    }

    setState('idle');
    if (result && result.ok) {
      show("You're already on the list. ✿");
      form.reset();
    } else if (result && result.status === 400 && result.data.error === 'consent_required') {
      flagConsent(true);
      show(CONSENT_MSG, true);
    } else {
      show(result && result.status === 400
        ? BAD_EMAIL_MSG
        : 'Something went wrong — try again in a sec?', true);
      if (!reduceMotion) setTimeout(() => restart(button, 'shake'), 280); // after it springs back to a pill
    }
  });

  async function celebrate() {
    setState('done');
    if (reduceMotion) return;
    const r = button.getBoundingClientRect();
    await sleep(450); // let the check draw in and the circle pop
    await flood(r.left + r.width / 2, r.top + r.height / 2, r.height / 2);
    try { sessionStorage.setItem('ss-arrive', '1'); } catch (e) {}
  }

  // Back button from /welcome can restore this page from the bfcache mid-celebration.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelectorAll('.fx-wipe').forEach((el) => el.remove());
    setState('idle');
    form.reset();
    flagConsent(false);
    show('');
  });
}

async function subscribe(email, consent, leaveBlank) {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, consent, leave_blank: leaveBlank }),
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch (err) {
    console.error('Signup request failed:', err);
    return null;
  }
}

// A cobalt circle grows from the button until it covers the whole screen.
function flood(x, y, r0) {
  const el = document.createElement('div');
  el.className = 'fx-wipe';
  document.body.append(el);
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const DURATION = 700;
  const anim = el.animate([
    { clipPath: `circle(${r0}px at ${x}px ${y}px)` },
    { clipPath: `circle(${R}px at ${x}px ${y}px)` },
  ], { duration: DURATION, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' });
  // Animations don't tick in a background tab; never let that hold up the redirect.
  return Promise.race([anim.finished, sleep(DURATION + 150)]);
}
