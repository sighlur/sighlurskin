// sighlurskin — single-screen landing
// 1) Typewriter word in "For all your ___ needs."
// 2) Email signup → /api/subscribe (adds the contact in Resend).

// ── Typewriter ──────────────────────────────────────────────
// Order is hand-shuffled so similar words don't sit next to each other.
const WORDS = [
  'acne', 'SPF', 'rosacea', 'morning routine', 'dark spot', 'retinol',
  'sensitive skin', 'night routine', 'hyperpigmentation', 'vitamin C',
  'eczema', 'cleanser', 'oily skin', 'skin barrier', 'fine line',
  'niacinamide', 'melasma', 'lip care', 'dry skin', 'exfoliation',
  'blackhead', 'moisturizer', 'redness', 'body care', 'dark circle',
  'sun damage', 'scalp care', 'keratosis pilaris', 'dandruff', 'glow-up',
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

const form = document.querySelector('form.signup');
if (form) {
  const status = form.querySelector('.signup-status');
  const button = form.querySelector('button[type="submit"]');
  const consent = form.querySelector('input[name="consent"]');
  const consentRow = consent.closest('.consent');
  const CONSENT_MSG = "Please check the box so I know it's okay to email you.";
  const show = (msg, isError = false) => {
    status.textContent = msg;
    status.classList.toggle('error', isError);
  };
  const flagConsent = (on) => {
    consentRow.classList.toggle('error', on);
    if (on) consent.setAttribute('aria-invalid', 'true');
    else consent.removeAttribute('aria-invalid');
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
    const email = form.email.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return show("Hmm — that email doesn't look right.", true);
    if (!consent.checked) {
      flagConsent(true);
      consent.focus();
      return show(CONSENT_MSG, true);
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Signing up…';
    show('');

    let result = null;
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: consent.checked, leave_blank: form.leave_blank.value }),
      });
      result = { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
    } catch (err) {
      console.error('Signup request failed:', err);
    }

    button.disabled = false;
    button.textContent = label;

    if (result && result.ok && result.data.status === 'already') {
      show("You're already on the list. ✿");
      form.reset();
    } else if (result && result.ok) {
      window.location.assign('/welcome');
    } else if (result && result.status === 400 && result.data.error === 'consent_required') {
      flagConsent(true);
      show(CONSENT_MSG, true);
    } else if (result && result.status === 400) {
      show("Hmm — that email doesn't look right.", true);
    } else {
      show('Something went wrong — try again in a sec?', true);
    }
  });
}


