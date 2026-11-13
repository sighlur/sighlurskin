// POST /api/subscribe — adds an email to the Resend "Newsletter" segment and
// sends a welcome email. Runs as a Vercel serverless function.
//
// Vercel environment variables (Project → Settings → Environment Variables):
//   RESEND_API_KEY     Full-access Resend API key (secret, never in the browser)
//   RESEND_SEGMENT_ID  ID of the Resend segment broadcasts are sent to
//
// Each signup is also logged to the Supabase `signups` table so it can be
// browsed there. Resend stays the real list: unsubscribes only happen in Resend.

const RESEND = 'https://api.resend.com';
// Publishable key: safe to ship, row-level security only lets it insert.
const SUPABASE_URL = 'https://nbhzcxznbredybhgftdf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E-SX57dvqy6TndFNnkSM1w_DR2WqKln';
// No inbox behind this address; the emails say so instead of setting a reply-to.
const FROM = 'sighlurskin <hello@sighlurskin.com>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { RESEND_API_KEY, RESEND_SEGMENT_ID } = process.env;
  if (!RESEND_API_KEY || !RESEND_SEGMENT_ID) {
    console.error('subscribe: RESEND_API_KEY or RESEND_SEGMENT_ID is not set');
    return res.status(500).json({ error: 'not_configured' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  // Honeypot: a hidden field people never see. Bots that fill it get a
  // normal-looking success so they don't retry. It must not be a field browser
  // autofill recognises: it used to be "company", which autofill filled in for
  // real visitors, so their signups were silently dropped.
  if (body.leave_blank) {
    console.warn('subscribe: honeypot filled, signup dropped');
    return res.status(200).json({ status: 'subscribed' });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const api = (method, path, payload) =>
    fetch(RESEND + path, {
      method,
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
  const contactPath = `/contacts/${encodeURIComponent(email)}`;

  try {
    const existing = await api('GET', contactPath);

    if (existing.ok) {
      // Already a contact. If they unsubscribed before, signing up again is a
      // fresh opt-in, so turn them back on. Make sure they're in the segment.
      const contact = await existing.json();
      if (contact.unsubscribed) {
        const r = await api('PATCH', contactPath, { unsubscribed: false });
        if (!r.ok) throw new Error(`resubscribe ${r.status}: ${await r.text()}`);
      }
      // Errors if they're already in the segment; that's fine to ignore.
      await api('POST', `${contactPath}/segments/${RESEND_SEGMENT_ID}`);
      await logToSupabase(email);
      return res.status(200).json({ status: 'already' });
    }

    if (existing.status !== 404) {
      throw new Error(`lookup ${existing.status}: ${await existing.text()}`);
    }

    const created = await api('POST', '/contacts', {
      email,
      unsubscribed: false,
      segments: [{ id: RESEND_SEGMENT_ID }],
    });
    if (!created.ok) throw new Error(`create ${created.status}: ${await created.text()}`);

    // The signup already succeeded; a failed welcome email shouldn't undo it.
    const welcome = await api('POST', '/emails', {
      from: FROM,
      to: [email],
      subject: "You're on the Sighlurskin List!",
      html: welcomeHtml(),
      text: welcomeText(),
    });
    if (!welcome.ok) console.error('subscribe: welcome email failed', welcome.status, await welcome.text());

    await logToSupabase(email);
    return res.status(200).json({ status: 'subscribed' });
  } catch (err) {
    console.error('subscribe:', err.message);
    return res.status(502).json({ error: 'upstream_error' });
  }
};

// Copy the signup into Supabase. Never throws and gives up after 3s, so a
// Supabase problem can't block or slow a signup. A 409 means the email is
// already in the table, which is fine.
async function logToSupabase(email) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, source: 'landing' }),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok && r.status !== 409) {
      console.error('subscribe: supabase log failed', r.status, await r.text());
    }
  } catch (err) {
    console.error('subscribe: supabase log failed', err.message);
  }
}

function welcomeText() {
  return [
    "You're in.",
    '',
    "Thanks for joining the sighlurskin list. We'll send skincare tips, routines, and",
    'answers to the questions we hear most, from a Dermatology PA-C.',
    '',
    'Talk soon.',
    '',
    '— sighlurskin',
    '',
    'You got this because you signed up at sighlurskin.com.',
    "This inbox isn't monitored, so please don't reply to this email.",
    'General skincare education, not medical advice.',
  ].join('\n');
}

function welcomeHtml() {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;background:#EFE8DB;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFE8DB;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FBF6EA;border-radius:20px;">
    <tr><td style="padding:32px 32px 8px;font:800 26px/1 'Baloo 2',Arial Rounded MT Bold,Helvetica,Arial,sans-serif;color:#0F2FE6;letter-spacing:-0.5px;">
      sighlur<span style="color:#0A1F5C;">skin</span>
    </td></tr>
    <tr><td style="padding:16px 32px 0;font:800 32px/1.1 'Baloo 2',Arial Rounded MT Bold,Helvetica,Arial,sans-serif;color:#101730;">
      You're in. ✿
    </td></tr>
    <tr><td style="padding:16px 32px 0;font:400 17px/1.55 Helvetica,Arial,sans-serif;color:#101730;">
      Thanks for joining the sighlurskin list. We'll send skincare tips, routines, and answers to the questions we hear most, from a Dermatology PA-C.
    </td></tr>
    <tr><td style="padding:16px 32px 32px;font:400 17px/1.55 Helvetica,Arial,sans-serif;color:#101730;">
      Talk soon.
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
    <tr><td style="padding:20px 32px;font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#0A1F5C;opacity:.75;">
      You got this because you signed up at <a href="https://sighlurskin.com" style="color:#0A1F5C;">sighlurskin.com</a>.<br>
      This inbox isn't monitored, so please don't reply to this email.<br>
      General skincare education, not medical advice.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
