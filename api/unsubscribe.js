// POST /api/unsubscribe — stops newsletter emails for one Resend contact.
// Runs as a Vercel serverless function, with the same RESEND_API_KEY as
// api/subscribe.js.
//
// Unsubscribe links carry the contact's Resend ID (a random UUID), never the
// email address, so nobody can unsubscribe someone else by guessing. Two callers:
//   - unsubscribe.html, when the person presses the button: body {"id": "..."}
//   - mail apps' own Unsubscribe button (one-click, RFC 8058), which POSTs to the
//     List-Unsubscribe URL from the email headers: /api/unsubscribe?id=...
// GET is refused on purpose: mail security scanners open every link in an email,
// and that must not unsubscribe anyone.
//
// This sets the contact's global `unsubscribed` flag, the same one Resend's own
// broadcast unsubscribe link sets. Signing up again on the site clears it.

const RESEND = 'https://api.resend.com';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) {
    console.error('unsubscribe: RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'not_configured' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const id = String((req.query && req.query.id) || body.id || '').trim();
  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: 'invalid_link' });
  }

  try {
    const r = await fetch(`${RESEND}/contacts/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unsubscribed: true }),
    });
    if (r.status === 404) return res.status(404).json({ error: 'not_found' });
    if (!r.ok) throw new Error(`update ${r.status}: ${await r.text()}`);
    return res.status(200).json({ status: 'unsubscribed' });
  } catch (err) {
    console.error('unsubscribe:', err.message);
    return res.status(502).json({ error: 'upstream_error' });
  }
};
