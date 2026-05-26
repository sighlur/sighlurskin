// ──────────────────────────────────────────────────────────────
// sighlurskin landing page — client logic
// ──────────────────────────────────────────────────────────────

// Supabase client setup
// The publishable key is safe to ship to the browser — RLS protects the table.
const SUPABASE_URL = 'https://nbhzcxznbredybhgftdf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E-SX57dvqy6TndFNnkSM1w_DR2WqKln';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Smooth-scroll anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Email signup — writes to Supabase `signups` table
const form = document.getElementById('emailForm');
const statusEl = document.getElementById('emailStatus');

function showStatus(msg, tone = 'ok') {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.color = tone === 'error' ? '#B00020' : '#0A1F5C';
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim().toLowerCase();

    // Basic client-side validation
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      showStatus("Hmm — that email doesn't look right.", 'error');
      return;
    }

    // Disable button while submitting
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Reserving…';
    showStatus('Sending…');

    const { error } = await supabase
      .from('signups')
      .insert({ email, source: 'site_preorder' });

    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;

    if (!error) {
      showStatus("You're in. We'll text you the second pre-orders open. ✿");
      form.reset();
      return;
    }

    // Postgres unique-violation = email already signed up
    if (error.code === '23505') {
      showStatus("You're already on the list — see you at launch. ✿");
      form.reset();
      return;
    }

    // Anything else
    console.error('Supabase insert error:', error);
    showStatus("Something went wrong — try again in a sec?", 'error');
  });
}
