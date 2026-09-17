# Password Reset Flow

A complete "forgot password" flow: React (Bootstrap) front-end + Node.js/Express + MongoDB backend, with the reset link emailed via Nodemailer and an expiry time on the link.

## How the flow works

1. User opens **Forgot Password** page and enters their email.
2. Backend checks if a user with that email exists in the DB.
   - Not found → error message shown.
   - Found → a random token is generated, its **hash** is stored in the DB together with an expiry time, and an email is sent containing a link like `https://<frontend-url>/reset-password/<token>`.
3. User clicks the link in their email → the **Reset Password** page loads and immediately asks the backend whether the token is still valid.
   - Invalid / expired → an alert is shown and the user is offered a link to request a new one.
   - Valid → the "set new password" form is shown.
4. User submits a new password → backend re-checks the token (and expiry) matches, saves the new (hashed) password, and clears the token so it can't be reused.

## Project structure

```
password-reset/
├── server/     Node.js + Express + MongoDB + Nodemailer API
└── client/     React (Vite) + Bootstrap front-end
```

## 1. Backend setup (`server/`)

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — a MongoDB Atlas connection string (same as the mentor-assignment project; you can reuse the cluster with a different database name, e.g. `.../password-reset?...`).
- `CLIENT_URL` — the front-end's URL. Locally this is `http://localhost:5173` (Vite's default dev port). After deploying the front-end to Netlify, update this to the Netlify URL.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — SMTP credentials used to actually send the reset email. Easiest with a Gmail account:
  1. Turn on **2-Step Verification** on the Gmail account (myaccount.google.com/security).
  2. Create an **App Password**: myaccount.google.com/apppasswords → generate one for "Mail".
  3. Use that 16-character app password as `EMAIL_PASS` (not your normal Gmail login password). `EMAIL_USER` is the full Gmail address.
- `RESET_TOKEN_EXPIRY_MINUTES` — how long the reset link stays valid (default 15).

Run it:

```bash
npm start
```

Server starts on `http://localhost:5000`.

### API Endpoints

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Create a test user (helper, so you have someone to test the flow with) |
| POST | `/api/auth/login` | `{ email, password }` | Log in (helper, to confirm the password before/after reset) |
| POST | `/api/auth/forgot-password` | `{ email }` | Step 1 — sends the reset email if the user exists |
| GET | `/api/auth/reset-password/:token` | — | Checks whether a token is still valid (used by the reset page on load) |
| POST | `/api/auth/reset-password/:token` | `{ password }` | Step 2 — sets the new password if the token is valid and not expired |

## 2. Front-end setup (`client/`)

```bash
cd client
npm install
cp .env.example .env
```

Edit `.env`:

- `VITE_API_URL` — the backend's URL. Locally: `http://localhost:5000`. After deploying the backend to Render, update this to the Render URL and rebuild.

Run it:

```bash
npm run dev
```

Opens on `http://localhost:5173`. Pages: `/register`, `/login`, `/forgot-password`, `/reset-password/:token` (the last one is only reached via the emailed link).

## Testing the whole flow locally

1. Start the backend (`npm start` in `server/`) and the front-end (`npm run dev` in `client/`).
2. Go to `http://localhost:5173/register` and create an account with a real email address you can check.
3. Go to `/forgot-password`, enter that email, submit.
4. Check that inbox for the "Reset your password" email, click the link.
5. Enter a new password. You should be redirected to `/login` — sign in with the new password.
6. Try clicking the same email link again — it should be rejected (already used). Wait past `RESET_TOKEN_EXPIRY_MINUTES` before clicking a fresh link to see the expiry alert.

## Deployment

### Push to GitHub

```bash
cd password-reset
git init
git add .
git commit -m "Password reset flow (React + Node + MongoDB + Nodemailer)"
git branch -M main
git remote add origin https://github.com/<your-username>/password-reset.git
git push -u origin main
```

> Repo URL format: `https://github.com/<username>/password-reset`

### Deploy the backend on Render

1. [render.com](https://render.com/) → **New +** → **Web Service** → connect the `password-reset` repo.
2. **Root Directory:** `server` (since the backend lives in a subfolder).
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add environment variables (same keys as `server/.env`): `MONGODB_URI`, `CLIENT_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `RESET_TOKEN_EXPIRY_MINUTES`.
   - You can set `CLIENT_URL` to your Netlify URL once you have it (step below) — update and it will redeploy.
6. Deploy. You'll get a URL like `https://password-reset-api.onrender.com`.
7. In MongoDB Atlas, make sure Network Access allows `0.0.0.0/0` so Render can connect.

### Deploy the front-end on Netlify

1. [netlify.com](https://www.netlify.com/) → **Add new site** → **Import an existing project** → connect the `password-reset` repo.
2. **Base directory:** `client`
3. **Build command:** `npm run build`
4. **Publish directory:** `client/dist` (Netlify may auto-fill this as `dist` once base directory is set)
5. Add an environment variable: `VITE_API_URL` = your Render backend URL (from above).
6. Deploy. You'll get a URL like `https://password-reset.netlify.app`.
7. Go back to Render and update `CLIENT_URL` to this Netlify URL (so reset emails link to the right place), then let it redeploy.

### Submission

- **GitHub (Back-end source code):** `https://github.com/<username>/password-reset`
- **Front-end Deployed URL:** the Netlify URL, e.g. `https://password-reset.netlify.app`
- (Some portals also ask for the backend URL separately — that's the Render URL, e.g. `https://password-reset-api.onrender.com`)

## Notes on the implementation

- The raw reset token is only ever emailed to the user — the database stores just its SHA-256 hash, the same way passwords are stored as bcrypt hashes rather than in plain text.
- The reset link expires after `RESET_TOKEN_EXPIRY_MINUTES` (default 15). Both the page-load check and the final submit re-validate the expiry, and the UI raises a browser alert when a link is invalid or has expired, per the task's requirement.
- A token is single-use: it's cleared from the database as soon as it's successfully used to set a new password.
