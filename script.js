// sighlurskin — single-screen landing
// 1) Typewriter word in "For all your ___ needs."
// 2) Email signup → Supabase `signups` table.

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
// The publishable key is safe in the browser; row-level security on the
// table controls what it can do.
const SUPABASE_URL = 'https://nbhzcxznbredybhgftdf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E-SX57dvqy6TndFNnkSM1w_DR2WqKln';
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = document.querySelector('form.signup');
if (form) {
  const status = form.querySelector('.signup-status');
  const button = form.querySelector('button[type="submit"]');
  const show = (msg, isError = false) => {
    status.textContent = msg;
    status.classList.toggle('error', isError);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return show("Hmm — that email doesn't look right.", true);
    if (!sb) return show('Something went wrong — try again in a sec?', true);

    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Signing up…';
    show('');

    const { error } = await sb.from('signups').insert({ email, source: 'landing' });

    button.disabled = false;
    button.textContent = label;

    if (!error) {
      show("You're on the list. Talk soon. ✿");
      form.reset();
    } else if (error.code === '23505') {
      show("You're already on the list. ✿");
      form.reset();
    } else {
      console.error('Supabase insert error:', error);
      show('Something went wrong — try again in a sec?', true);
    }
  });
}


