// Vercel Edge Middleware — server-side password gate.
//
// Runs on the Edge BEFORE any file is served, so the site's HTML/assets are
// never delivered to a visitor who hasn't entered the password. This is the
// real lock (unlike a client-side overlay, which can be bypassed).
//
// Auth scheme: HTTP Basic. The browser shows a native username/password prompt.
// The USERNAME is ignored — only the password must match. (So enter anything
// for the username and the password below.)
//
// No config.matcher => this runs on every request (all pages + all assets).

const PASSWORD = "Heidi";

export default function middleware(request) {
  const header = request.headers.get("authorization") || "";

  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6)); // "username:password"
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (password === PASSWORD) {
        return; // authorized — let the request continue to the site
      }
    } catch (e) {
      // malformed header — fall through to the prompt
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Basic realm="sighlurskin — enter the site password", charset="UTF-8"',
      "Content-Type": "text/plain",
    },
  });
}
