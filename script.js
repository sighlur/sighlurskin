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

// Button animation (states live in styles.css):
//   idle → loading: the pill squeezes into a circle with a spinner
//   loading → done: a check draws in, droplets burst out, cobalt floods the screen,
//                   then /welcome lifts that cobalt panel away (html.arriving)
//   loading → idle: back to a pill; errors give it a little shake
const form = document.querySelector('form.signup');
if (form) {
  const status = form.querySelector('.signup-status');
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('.btn-label');
  const MIN_LOADING_MS = 750; // long enough to see the morph, even when the API is quick

  const show = (msg, isError = false) => {
    status.textContent = msg;
    status.classList.toggle('error', isError);
    restart(status, 'pop');
  };

  // Re-run a one-shot CSS animation class.
  const restart = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (button.dataset.state !== 'idle') return;
    const email = form.email.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      restart(form.email, 'shake');
      return show("Hmm — that email doesn't look right.", true);
    }

    setState('loading');
    show('');

    const [result] = await Promise.all([
      subscribe(email, form.leave_blank.value),
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
    } else {
      show(result && result.status === 400
        ? "Hmm — that email doesn't look right."
        : 'Something went wrong — try again in a sec?', true);
      if (!reduceMotion) setTimeout(() => restart(button, 'shake'), 280); // after it springs back to a pill
    }
  });

  async function celebrate() {
    setState('done');
    if (reduceMotion) return;
    const r = button.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    await sleep(260); // let the check start drawing
    burst(x, y);
    await sleep(240);
    await flood(x, y, r.height / 2);
    try { sessionStorage.setItem('ss-arrive', '1'); } catch (e) {}
  }

  // Back button from /welcome can restore this page from the bfcache mid-celebration.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelectorAll('.fx-wipe, .fx-layer').forEach((el) => el.remove());
    setState('idle');
    form.reset();
    show('');
  });
}

async function subscribe(email, leaveBlank) {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, leave_blank: leaveBlank }),
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch (err) {
    console.error('Signup request failed:', err);
    return null;
  }
}

// ── Celebration effects ─────────────────────────────────────
// Cobalt/azure read on the cream page; butter/sky light up once the cobalt flood is behind them.
const BURST_COLORS = ['var(--cobalt)', 'var(--butter)', 'var(--azure)', 'var(--sky)', 'var(--cobalt)', 'var(--butter)', 'var(--azure)'];
const SHAPES = ['drop', 'dot', 'ring'];

// Droplets, dots and bubbles fly out from (x, y), then drift down and fade.
function burst(x, y) {
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  document.body.append(layer);
  const N = 22;
  for (let i = 0; i < N; i++) {
    const p = document.createElement('span');
    const shape = SHAPES[i % SHAPES.length];
    p.className = `fx-p ${shape}`;
    p.style.setProperty('--c', BURST_COLORS[i % BURST_COLORS.length]);
    const size = { drop: 10, dot: 7, ring: 13 }[shape] + Math.random() * 8;
    p.style.width = p.style.height = `${size}px`;
    layer.append(p);

    const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 64 + Math.random() * 80;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
    // Droplets point their tip back at the button, like they were flung off it.
    const spin = shape === 'drop' ? `rotate(${(angle * 180) / Math.PI + 45}deg)` : '';
    const at = (tx, ty, s) => `translate(${x - size / 2 + tx}px, ${y - size / 2 + ty}px) ${spin} scale(${s})`;
    p.animate([
      // Pop out fast…
      { transform: at(0, 0, 0.2), opacity: 1, easing: 'cubic-bezier(.15,.8,.3,1)' },
      // …then drift down and fade, like a little gravity.
      { transform: at(dx, dy, 1), opacity: 1, offset: 0.4, easing: 'cubic-bezier(.45,0,.7,.5)' },
      { transform: at(dx * 1.08, dy * 1.08 + 44, 0.6), opacity: 0 },
    ], { duration: 1100 + Math.random() * 300, fill: 'forwards' });
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


