D01 | Server route protection via proxy/middleware deferred | Sessions live in localStorage with plain supabase-js, so the server cannot see them; API routes verify Bearer tokens instead | rejected: cookie-based SSR sessions
D02 | File bytes authorized by short-lived HMAC URL tokens, not Bearer headers | Browser download/navigation cannot attach Authorization headers; /api/files/token performs the role check | rejected: Bearer-only file GET
D03 | gateway = Cloudflare Pages Functions, not a plain Worker | Cache API is documented to work on pages.dev, no custom domain needed | rejected: Worker on workers.dev (caching unclear), R2 (needs card)
D04 | Stateless gateway with HMAC tickets/receipts/links | Keeps DB keys and credentials out of Cloudflare Pages | rejected: Direct Supabase access from Edge gateway
D05 | Streaming multipart with no server-side hashing | Stays under Cloudflare 10 ms CPU free plan limit | rejected: Buffer in memory and hash (CPU/memory exhaustion)
D06 | SHA-256 is client-claimed in upload headers | Avoids hashing in Edge functions; app later cross-checks matching size to mitigate dedupe poisoning | rejected: Edge-computed SHA-256
D07 | Upload tickets replayable until expiration | Stateless edge without replay store (accepted, exp 120 s) | rejected: KV or Durable Object nonce tracker
D08 | No HTTP Range request support on gateway /f/<token> | Simplicity and compatibility with Telegram Bot API streaming and Edge cache | rejected: Chunked range proxy
D09 | Inline Content-Disposition only for PDF and images | Prevents HTML/SVG stored XSS while allowing browser PDF/image viewing | rejected: Arbitrary inline content disposition
D10 | Telegram metadata strictly isolated via Postgres column grants | Non-secret columns granted to authenticated; tg_* columns restricted to service role | rejected: Exposing tg_file_id to client
D11 | File deduplication on (sha256, size_bytes) | Instant upload for identical files with zero storage waste and zero Telegram API calls | rejected: Storing redundant copies
D12 | Client-side direct streaming to gateway via XHR | Offloads file body from Next.js server and enables accurate progress bar | rejected: Upload through Next.js API route
D13 | Supabase free-tier automated keepalive | GitHub Actions scheduled REST query every 3 days avoids inactivity pause | rejected: Paid plan or manual dashboard visits
D14 | Telegram-backed compressed daily backup excluding personal data | Offsite disaster recovery for study materials in backup channel; users and student_profiles excluded on purpose for privacy | rejected: Backing up personal user data or paid backup services
