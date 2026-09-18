# Render.com Deployment

End-to-end guide for running LambKing (API + Admin UI) on a single Render Web Service with a persistent
disk for uploads and audiobooks, MongoDB Atlas for data, and (optionally) Upstash for Redis.

The service is fully described by [`render.yaml`](../../render.yaml) at the repo root. Render's Blueprint feature
**only reads `render.yaml` at the repo root** — never in a subdirectory — and provisions the Web Service, disk, env
vars, and health check from it automatically.

## 1. Prerequisites

- **GitHub repo** connected to Render (one-time OAuth).
- **MongoDB Atlas cluster** — the free M0 tier is fine for this workload.
    - In Atlas → **Network Access → Add IP Address → `0.0.0.0/0`** (Render does not publish static egress IPs on the
      starter plan). Tighten later if you move to a plan with a static outbound IP.
    - Grab the connection string for `MONGO_URI`.
- **(Optional) Upstash Redis** — free tier (10 k commands/day) is plenty. Copy the `rediss://` URL for `REDIS_URL` and
  flip `REDIS_ENABLED=true`. Skip it and the server runs fine without cache.
- **(Optional) Sentry** — create a Node.js project at <https://sentry.io> and copy the DSN.

## 2. Create the service from the Blueprint

1. In Render: **New → Blueprint**.
2. Select this repo and branch `main`. Render detects `server/render.yaml` and shows the plan: one Web Service, one 10
   GB disk, one health check.
3. Click **Apply**. Render clones the repo, runs the build, mounts the disk at `/var/data`, and boots the service.

### What the build does (`render.yaml` → `buildCommand`)

```bash
npm install -g pnpm@10.6.2 && pnpm install --no-frozen-lockfile && pnpm --filter little-bible-stories-adminui build && pnpm --filter little-bible-stories-server build:prod
```

Steps, in order:

1. `npm install -g pnpm@10.6.2` — pins pnpm via npm. We deliberately skip `corepack` because the corepack bundled with
   Node 22.12 ships stale pnpm signing keys and fails with `Internal Error: Cannot find matching keyid` when it tries
   to verify the tarball. Plain `npm install -g` dodges the signature check entirely.
2. `pnpm install --no-frozen-lockfile` — installs all deps including optional ones. **Do not** add `--no-optional`:
   Rollup's platform-specific native binary (`@rollup/rollup-linux-x64-gnu`) is distributed as an optional dep and
   Vite's build of the admin UI fails without it. `@huggingface/transformers` also comes along for the ride (~400 MB
   on disk) but it's only lazy-`import()`'d when `TRANSLATION_ENABLED=true`, so it never loads into RAM in prod.
3. `pnpm --filter little-bible-stories-adminui build` — → `server/public/admin/`
4. `pnpm --filter little-bible-stories-server build:prod` — → `server/dist/`

`&&` (not multi-line `|`) so the same string pastes 1:1 into Render's dashboard Build Command field — dashboard fields
strip newlines.

### What the start command does

```bash
cd server && node dist/index.js
```

Plain `node` — no `pnpm` at runtime (avoids a failure mode where pnpm isn't on PATH in the runtime shell and the
workspace filter returns "No projects matched the filters"). `build:prod` skips the local `dotenv-cli` wrapper — on
Render, env vars come straight from the dashboard, not a `.env` file.

## 3. Fill in the secret env vars

On the Web Service's **Environment** tab, set the values Render marks as required (`sync: false` in the Blueprint):

| Key               | Example                                                                      |
|-------------------|------------------------------------------------------------------------------|
| `MONGO_URI`       | `mongodb+srv://<user>:<pw>@cluster0.lhlvowv.mongodb.net/?retryWrites=true`   |
| `ADMIN_PASSWORD`  | 24+ random chars                                                             |
| `CORS_ORIGIN`     | `https://lambkingstories.github.io,https://your-public-site.com`             |
| `PUBLIC_BASE_URL` | `https://little-bible-stories-server.onrender.com` (Render assigns this URL) |
| `REDIS_URL`       | Upstash `rediss://...` URL (only if you set `REDIS_ENABLED=true`)            |
| `SENTRY_DSN`      | Sentry project DSN (optional)                                                |

Non-secret defaults (`NODE_ENV`, `PORT`, `AUDIOBOOKS_DIR`, `UPLOADS_DIR`, …) are baked into `render.yaml` — don't
duplicate them in the dashboard.

## 4. Persistent disk

Render mounts a 10 GB SSD at `/var/data`. Two env vars point the server at it:

```
AUDIOBOOKS_DIR=/var/data/audiobooks
UPLOADS_DIR=/var/data/uploads
```

The server creates these subdirectories on boot (see `server/src/app.ts`). Files written during a request survive
deploys and restarts. The disk is **not** included in Render's built-in git-snapshot backups — see §7.

> **Important:** Never mount the disk inside `/opt/render/project/src` — the mount happens *after* the build, so it
> would hide the freshly built `server/dist/` and `server/public/admin/` directories and the service would fail to
> start.

## 5. Verify the deploy

```bash
curl https://<your-service>.onrender.com/healthz
# → { "ok": true, "mongo": true, "redis": false, "uptime": 12.3 }
```

- `https://<your-service>.onrender.com/admin` → basic-auth prompt → admin UI loads.
- Upload a `.ogg` audiobook via the admin UI → `GET` the returned URL → it streams with `Accept-Ranges: bytes`.
- Logs: Render dashboard → **Logs** tab (or `render logs` via the CLI).

## 6. Subsequent deploys

`autoDeploy: true` is set in `render.yaml`, so every push to `main` triggers a fresh build + rolling restart. No SSH,
no scripts. To roll back, use the **Deploys** tab → *Rollback to previous successful deploy*.

## 7. Backups

### 7a. MongoDB — nightly email dump

An in-process `node-cron` job dumps every collection in `MONGO_DB_NAME` to
**EJSON**, gzips it, and emails the artifact to `BACKUP_EMAIL_TO` at
`BACKUP_CRON` (default `0 2 * * *` in `BACKUP_TIMEZONE`). The dataset
(~100–200 books + ~20 categories) gzips to a few hundred KB — well inside
Gmail's 25 MB attachment limit. Atlas M0's lack of automated backups is
covered by this instead of `mongodump`.

**Wire-up (one-time):**

1. Generate a **Gmail App Password** for `littlebiblestories.app@gmail.com`:
   Google Account → Security → 2-Step Verification → App passwords.
2. On the Render **Environment** tab, set the two secrets:
    - `SMTP_USER` = `littlebiblestories.app@gmail.com`
    - `SMTP_PASS` = the 16-char app password
3. Redeploy. The boot log should show `backup job scheduled` with the cron
   expression and timezone.

All other backup knobs (`BACKUP_ENABLED=true`, `BACKUP_CRON`,
`BACKUP_TIMEZONE`, `BACKUP_EMAIL_TO`, `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`) are pre-filled in `render.yaml`.

**Restore a dump:**

```bash
# download the .json.gz from the email, save as ./backup.json.gz
pnpm --filter little-bible-stories-server restore:backup -- --file=./backup.json.gz         # dry-run
pnpm --filter little-bible-stories-server restore:backup -- --file=./backup.json.gz --apply # upsert by _id
pnpm --filter little-bible-stories-server restore:backup -- --file=./backup.json.gz --apply --drop  # point-in-time
```

Without `--drop`, each document is upserted by `_id` — safe to replay into
a populated DB. With `--drop`, the target collection is wiped first (true
point-in-time rollback, lossy for anything created after the snapshot).

**Ad-hoc snapshot** (e.g. before a risky migration):

```bash
pnpm --filter little-bible-stories-server backup:now
```

`BACKUP_ENABLED` gates only the scheduler; `backup:now` always runs.

### 7b. Persistent disk

Render takes a daily snapshot of disks on paid plans (retained 7 days).
For longer retention or off-site copies, add a nightly job that `rsync`s
`/var/data` to S3/R2/Backblaze.

## 8. Translating books (local, not on the server)

The live `/api/translate` endpoint is disabled on Render (saves ~400 MB RAM + avoids shipping the 80 MB Opus-MT model
pair, keeping the starter plan viable). Instead, run a one-sweep script on your laptop whenever you add new German
books:

```bash
# one-time: include the optional transformers dep locally
pnpm install --include=optional

# dry run — lists books missing an EN localization
pnpm --filter little-bible-stories-server translate:books

# commit translations to Atlas
pnpm --filter little-bible-stories-server translate:books -- --apply

# target a single book
pnpm --filter little-bible-stories-server translate:books -- --apply --book-id=fa-1-apple

# force re-translate books that already have EN content
pnpm --filter little-bible-stories-server translate:books -- --apply --force
```

The script connects to `MONGO_URI` from `.env.local` (same Atlas cluster the Render service uses) and writes
`localizations.en` back in place. Once the translation is in Mongo, the production server serves it directly from
cache — no model needed.

## 9. Sentry crash reporting (optional, free tier)

Sentry's **Developer** plan is free for 1 user and ~5 k errors/month. To wire it up:

1. Create a **Node.js** project at <https://sentry.io> → copy the DSN.
2. Add `SENTRY_DSN=https://<hash>@oNNNN.ingest.sentry.io/<id>` in the Render **Environment** tab.
3. Configure an alert rule (**Settings → Projects → Alerts → Create Alert**): *A new issue is created → email
   littlebiblestories.app@gmail.com*.
4. Redeploy; unhandled throws will now email within a minute.

The admin UI has its own Vue project + DSN; because Vite inlines `VITE_*` vars at build time, add
`VITE_SENTRY_DSN` as a build-time env var in Render (it's already declared as `sync: false` in `render.yaml` if you
uncomment the entry) and redeploy so the admin bundle picks it up.

## 10. Post-deploy checklist

- `curl https://<your-service>.onrender.com/healthz` → `{ ok, mongo }` true
- `/admin` basic-auth prompt → admin UI loads
- Upload an `.ogg` → playback works from `/audiobooks/...`
- Render **Logs** tab → no repeated errors, no env validation failures at boot
- Auto-deploy: push a trivial commit to `main` → new deploy triggers, health check passes
