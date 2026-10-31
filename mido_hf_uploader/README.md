# Mido Private Dataset Uploader

A minimal, password-protected uploader for `MidoSTM11/Mido` on Hugging Face. The initial 404 is intentional: click the small dot in the footer five times to reveal the sign-in field. The dashboard HTML is bundled as `lib/dashboard-html.js` and served by an authenticated function, and uploads are made server-side to the dataset's `main` branch.

## Deploy to GitHub and Vercel

1. Create a **write** Hugging Face access token with permission to write to the existing `MidoSTM11/Mido` dataset. If using a fine-grained token, explicitly grant repository write access. The token and account must have access to the private dataset.
2. Push this directory to a new private GitHub repository (or create a repository, then run `git init`, `git add .`, `git commit -m "Initial commit"`, `git branch -M main`, `git remote add origin <your-repository-url>`, and `git push -u origin main`). Never commit real credentials.
3. In Vercel, import the GitHub repository. Select **Other** as the framework, with the project root as the root directory. The supplied `vercel.json` sets the static output directory to `public`. No build command is required. Vercel installs the dependencies and deploys the `api` functions.
4. In Vercel project settings → Environment Variables, add these server-side variables for the environments you intend to deploy:
   - `HF_TOKEN`: the Hugging Face write token.
   - `HF_REPO_ID`: `MidoSTM11/Mido`. This must match this exact repository as a safety check.
   - `SITE_PASSWORD`: a long, unique, high-entropy password.
   - `SESSION_SECRET`: a random secret of at least 32 bytes, for example the output of `openssl rand -base64 48`.
5. Redeploy after changing environment variables. Visit the deployment, click the footer dot five times, and sign in.

For local development, install Node.js 20 or newer and run `npm install`, then `npx vercel dev`. Supply the same environment variables via Vercel's environment pull or a local `.env.local` (never commit it). The CLI may prompt you to link a Vercel project. Run `npm test` for security and end-to-end HTTP route tests. The upload flow test substitutes a fake Hugging Face client; it does not require credentials or make a real Hub commit.

## Important limits and security

- Vercel Functions impose an approximately **4.5 MB request/response body limit**. This application caps files at **4 MiB** to leave room for multipart overhead. Larger files require a different architecture; direct browser-to-Hugging Face uploads are deliberately not used. Files are held in function memory, not saved to disk. The progress bar measures browser-to-function transfer; the final processing phase waits for Hugging Face to confirm the commit.
- `HF_REPO_ID` is pinned to the requested repository; change the server-side constant too if you intentionally use another repository. Uploading an existing filename **replaces** it on `main`. Filenames are treated as single path components, not folders. Download links for a private dataset require the person opening them to have Hugging Face access; the URL is not a public sharing link or a signed URL.
- Sessions are signed, HTTP-only, SameSite=Strict cookies with an eight-hour expiry and Secure in production. Logout removes the browser cookie, but **cannot revoke a copied cookie** without shared server-side storage. Rotate `SESSION_SECRET` to invalidate all sessions. The server validates Origin on state-changing requests as additional CSRF protection. Keep the Vercel deployment on HTTPS.
- Login throttling is **best effort per warm function instance**, not a distributed guarantee: serverless instances and cold starts do not share counters, and IP identification depends on the platform. For meaningful production brute-force protection without a database, configure Vercel Firewall/WAF rate limiting on `/api/login` (subject to your plan) and use a strong password. The five clicks are not authentication.
- Application source/assets are public; the dashboard document and upload endpoint require a valid server-verified session. Protect repository credentials in Vercel and GitHub. Errors returned to clients are generic and do not include secrets. No database is required.
