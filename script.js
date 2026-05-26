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

// Email signup — mock submit (replace with real backend / Mailchimp / ConvertKit)
const form = document.getElementById('emailForm');
const status = document.getElementById('emailStatus');
if (form && status) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      status.textContent = 'Hmm — that email doesn\'t look right.';
      status.style.color = '#0A1F5C';
      return;
    }
    status.textContent = 'You\'re in. Check your inbox for confirmation. ✿';
    status.style.color = '#0A1F5C';
    form.reset();
  });
}
