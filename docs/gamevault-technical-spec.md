# GameVault (Working Name) — Product & Technical Specification

## 1. Executive Summary

GameVault is a self-hosted web application for cataloging a personal video game collection across physical and digital ownership. The system is optimized for a single collector but architected to support light multi-user expansion later without re-platforming. The deployment model is intentionally constrained to one Docker container for home-server simplicity, low operational burden, and safe local ownership of data.

This specification proposes a pragmatic architecture:

- **Backend + frontend served from one process**
- **SQLite as primary datastore**
- **Local filesystem storage for images/uploads/exports/backups**
- **In-process background jobs (no Redis/sidecars)**
- **Provider abstraction for metadata ingestion with swappable adapters**

The application emphasizes:

- fast search/filtering,
- robust ownership modeling (same title across platforms and multiple copies),
- import/export portability,
- metadata enrichment with manual override safety,
- and responsive UX on iPhone Safari + desktop browsers.

---

## 2. Product Goals / Non-Goals

### Goals

1. Provide a durable, self-hosted source of truth for a personal game collection.
2. Track canonical game metadata separately from owned copies and purchases.
3. Support both physical and digital ownership with rich condition/completeness data.
4. Offer metadata/artwork auto-import from free sources behind a provider abstraction.
5. Deliver fast browse/search/filter interactions on low-power home servers.
6. Enable clean import/export/backup for long-term portability and recovery.
7. Run entirely in one Docker container with persistent volume mounts.

### Non-Goals (MVP)

1. Not a social network or public community site.
2. Not a marketplace/pricing intelligence platform.
3. Not a full launcher or emulator manager.
4. Not a high-scale multi-tenant SaaS deployment target.
5. No dependency on paid APIs or external databases.

---

## 3. Personas and Core Use Cases

### Primary Persona: Solo Collector

- Runs a home server (NAS, mini PC, Raspberry Pi-class device).
- Owns mixed physical and digital games across multiple platforms.
- Wants structured tracking of where items are, what was paid, and condition.
- Wants metadata/artwork automation to reduce manual entry.

### Secondary Persona (Future): Household Collector Group

- 2–5 users sharing one local instance.
- Requires account separation and optional shared views.

### Core Use Cases

- Add a game manually with minimal required fields.
- Search metadata providers and import canonical game info.
- Add one or more ownership entries (copies) per game.
- Distinguish same game across platforms and multiple copies on same platform.
- Track purchase events per copy (including unknown date/price cases).
- Browse by platform/genre/status/store/condition/year/tag.
- View dashboard metrics and reports.
- Export data and media references; re-import later.

---

## 4. Functional Requirements

### 4.1 Cataloging & Library Management

- Support **physical + digital** ownership.
- Support **console, handheld, PC, mobile, other** platforms.
- Separate **Game** (canonical metadata) from **OwnershipEntry** (owned copy) and **Purchase** (transaction event).
- Allow manual-only entries when provider matching fails.
- Allow local metadata edits.

### 4.2 Metadata Import

- Provider-backed title search with result preview (cover/title/year/platform/provider confidence).
- Import selected title into local `Game` record.
- Store provider IDs and provenance for future refresh.
- Keep local override fields from being overwritten by future sync.
- Optional artwork caching to local storage.

### 4.3 Ownership Tracking

- Multiple entries per game.
- Per-entry platform, format, status, region, edition, condition, completeness.
- Physical-specific fields (manual/disc/cart/steelbook flags).
- Digital-specific fields (store/library source, installed flag).
- Play state and personal rating per ownership entry.

### 4.4 Purchase Tracking

- Zero or many purchases per ownership entry.
- Gift/free/unknown values supported.
- Totals computed from price + shipping + tax + fees.
- Currency stored with each event.

### 4.5 Search, Filter, Browse

Must support:

- global text search,
- filter by platform, format, ownership status, play status,
- filter by genre, developer, publisher,
- filter by store, year, region, completeness/condition, tags,
- sort by title, release date, purchase date, platform, rating, price, update timestamp.

Views:

- Library grid (cover art)
- Compact list
- Game detail
- Ownership section
- Purchase history section
- Dashboard/stats

### 4.6 Import/Export & Backup

Import:

- CSV and JSON.
- column mapping UI for CSV.
- duplicate detection and dry-run preview.
- optional post-import metadata enrichment.

Export:

- CSV and JSON (selective filters supported).
- full backup export: DB snapshot + media + manifest (zip/tar).

### 4.7 Settings/Admin

- Metadata provider config and enable/disable.
- API keys where required.
- Attribution display settings.
- Backup/restore controls.
- Schema/app version display.

---

## 5. Non-Functional Requirements

1. **Single-container runtime**: no external DB/cache/search service dependencies.
2. **Startup** under ~10s on typical home hardware after first initialization.
3. **Memory target**: steady-state < 500MB for medium collections (10k ownership entries).
4. **SQLite query performance**: typical library list/filter response < 300ms local network.
5. **Graceful provider outage behavior**: existing local data remains fully usable.
6. **Structured logging** (JSON option) with request IDs.
7. **Health endpoints**: liveness and readiness.
8. **Automated DB migrations** on boot with rollback safety.
9. **Config via environment variables**.
10. **Persistent data on mounted volume only**.

---

## 6. Information Architecture / UX Flows

## 6.1 Core Screens

1. Dashboard
2. Library
3. Game Detail
4. Add Game Wizard
5. Import/Export
6. Settings
7. Provider Management
8. Backup/Restore

## 6.2 Mobile (iPhone Safari) UX Requirements

- Responsive breakpoints optimized for narrow widths.
- Touch targets >= 44px.
- Sticky search bar and filter drawer.
- No hover-only controls.
- Infinite scroll or pagination with lazy-loaded images.
- Form layouts with grouped sections and native input types.

## 6.3 Desktop UX Requirements

- Dense table/list mode with customizable columns.
- Keyboard-focus search (`/` shortcut optional in MVP+).
- Quick edit actions from list rows/cards.
- Batch actions (status/tag/platform reassign) in MVP+.

## 6.4 Add/Edit Flows

### Add Game Manually

1. Enter required title.
2. Optional canonical metadata fields.
3. Optional create first ownership entry.
4. Optional add purchase event.
5. Save.

Minimum required: `title` (Game).

### Add From Metadata Search

1. Search provider query.
2. Show candidates with key fields and confidence indicator.
3. Select candidate → import preview.
4. Confirm import.
5. Prompt to add one or more ownership entries.
6. Optional purchase records.

### Add Another Copy

1. Open existing game detail.
2. Click “Add Copy”.
3. Fill platform/edition/condition/status/store details.
4. Save as independent ownership entry.

### Bulk Import

1. Upload CSV/JSON.
2. Map fields.
3. Dry-run preview with duplicate flags + validation errors.
4. Optional enrichment for missing metadata.
5. Commit import.

---

## 7. Data Model

Normalized schema with explicit boundaries between title-level metadata and owned copies.

## 7.1 Entity Relationship Overview

- `Game` 1—N `OwnershipEntry`
- `OwnershipEntry` 1—N `Purchase`
- `Game` 1—N `GamePlatform` (join)
- `Game` 1—N `GameProviderRef`
- `Game`/`OwnershipEntry` 1—N `MediaAsset`
- `Game`/`OwnershipEntry` N—M `Tag` (through join tables)
- Optional `CustomFieldDefinition` + `CustomFieldValue`

## 7.2 Core Tables

### Game

- `id` (UUID/ULID)
- `canonical_title` (required)
- `alternate_title`
- `sort_title`
- `franchise`
- `release_year`
- `original_release_date`
- `description`
- `critic_rating`
- `community_rating`
- `multiplayer_flags` (json)
- `region_availability` (json)
- `metadata_source_provenance` (json)
- `last_metadata_sync_at`
- `created_at`, `updated_at`, `deleted_at`

Relations:

- genres/themes/developers/publishers through normalized lookup + join tables.
- platforms through `GamePlatform`.
- provider IDs in `GameProviderRef`.

### Platform

- `id`
- `name` (unique)
- `manufacturer`
- `category` enum (`console|handheld|pc|mobile|other`)
- `generation`
- `code`
- `release_year`
- `created_at`, `updated_at`

### OwnershipEntry (Copy)

- `id`
- `game_id` FK
- `platform_id` FK
- `ownership_type` enum (`physical|digital`)
- `edition_name`
- `region`
- `language`
- `media_format`
- `ownership_status` enum (`owned|sold|traded|wishlist|preordered|lent_out|borrowed|gifted`)
- `condition`
- `completeness`
- `has_box` bool
- `has_manual` bool
- `has_disc` bool
- `has_cartridge` bool
- `has_steelbook` bool
- `store_source`
- `installed` bool
- `currently_playing` bool
- `play_status` enum (`backlog|playing|completed|shelved|dropped`)
- `personal_rating`
- `notes`
- `storage_location`
- `barcode`
- `serial_number`
- `sku`
- `created_at`, `updated_at`, `deleted_at`

### Purchase

- `id`
- `ownership_entry_id` FK
- `purchase_date` nullable
- `seller_store`
- `purchase_channel` enum (`retail|secondhand|digital_store|gift|bundle|other`)
- `order_reference`
- `currency` (ISO-4217)
- `purchase_price` decimal nullable
- `shipping` decimal nullable
- `tax` decimal nullable
- `fees` decimal nullable
- `total_paid` decimal nullable (computed on write if omitted)
- `payment_method`
- `purchase_condition`
- `import_source`
- `notes`
- `created_at`, `updated_at`, `deleted_at`

### MediaAsset

- `id`
- `game_id` nullable FK
- `ownership_entry_id` nullable FK
- `asset_type` enum (`cover|hero|screenshot|manual_photo|receipt_photo|custom_photo`)
- `source_url`
- `local_path`
- `provider_attribution`
- `checksum_sha256`
- `mime_type`
- `width`, `height`
- `created_at`

### Provider & Provenance

`GameProviderRef`:

- `id`
- `game_id`
- `provider` (`rawg|steam|...`)
- `provider_game_id`
- `confidence_score`
- `is_primary`
- `last_synced_at`
- unique: (`provider`, `provider_game_id`)

### Tagging / Custom Fields (Recommended)

`Tag` + `GameTag` + `OwnershipTag`.

`CustomFieldDefinition` + `CustomFieldValue` for user-defined attributes without schema changes.

## 7.3 Timestamps, Soft Delete, Dedupe, Merge Rules

- All mutable records include `created_at`, `updated_at`, optional `deleted_at`.
- Soft delete default for recoverability; hard delete available in admin cleanup.
- Dedupe heuristics:
  - Games: normalized title + release year + platform overlap + provider IDs.
  - Ownership: same game + platform + edition + region + ownership_type.
- Merge strategy:
  - Provider-sourced fields update only when local field is not manually overridden.
  - Maintain `field_override_mask` (json) or per-field source metadata.
  - Always preserve user-entered notes and purchase history.

---

## 8. Metadata Provider Strategy

## 8.1 Provider Abstraction

Define a common interface:

```ts
interface MetadataProvider {
  id: string;
  searchGames(query: string, options?): Promise<SearchResult[]>;
  getGameDetails(providerGameId: string): Promise<ProviderGameDetails>;
  getArtwork(providerGameId: string): Promise<ArtworkSet>;
  getRateLimitPolicy(): RateLimitPolicy;
  getAttribution(): AttributionInfo;
}
```

Provider manager responsibilities:

- provider registration/selection,
- failover sequencing,
- response normalization,
- request throttling,
- retry/backoff,
- cache storage,
- attribution aggregation.

## 8.2 Initial Providers

1. **RAWG (primary)**
   - Broad multi-platform metadata.
   - Free personal-use tier with attribution and usage constraints (must be honored).
2. **Steam (supplemental optional)**
   - App/store details for PC enrichment.
   - Used for store metadata and optional platform-specific fields.

## 8.3 Ingestion Rules

- Primary provider configurable in settings.
- Multi-provider merge precedence:
  1. Manual local override
  2. Primary provider
  3. Supplemental providers
- If field conflicts persist, flag for user review.
- Low-confidence matches require explicit confirmation before save.

## 8.4 Rate Limit, Retry, Cache

- Token-bucket limiter per provider.
- Retry policy: exponential backoff with jitter (e.g., 500ms, 1s, 2s, max 3 attempts).
- Cache provider raw responses in SQLite/file cache with TTL:
  - search results TTL: 24h
  - detail results TTL: 7d
  - artwork metadata TTL: 30d

## 8.5 Artwork Strategy

- **Default**: local mirroring of artwork for long-term stability and offline resilience.
- Optional hotlink mode for minimal storage.
- Maintain attribution metadata for each cached asset.

## 8.6 Future Expansion

- Add adapters for IGDB-like sources, console catalogs, etc.
- Keep provider-neutral domain model to avoid lock-in.

---

## 9. API / Backend Design

## 9.1 Recommended Stack Choice

### Option A (Recommended): Node.js + TypeScript + Fastify + React/Vite (served statically) + Prisma + SQLite

Pros:

- Strong TypeScript sharing across API/domain/validation.
- Good ecosystem for SQLite, auth, validation, and job scheduling.
- Fast startup, straightforward Docker packaging.

Cons:

- JS runtime memory footprint can exceed minimalist Python in some workloads.

### Option B: Python + FastAPI + SQLAlchemy + HTMX/React + SQLite

Pros:

- Excellent API ergonomics.
- Good data tooling and low-friction scripting.

Cons:

- Typing consistency and shared frontend/backend contracts less seamless unless extra tooling added.

### Option C: Go (Gin/Fiber) + templated frontend + SQLite

Pros:

- Very low memory/runtime footprint.

Cons:

- Slower feature iteration for rich UI and dynamic metadata integration unless team is Go-heavy.

**Decision**: Option A for balance of maintainability, developer velocity, and modern UX with a single-container architecture.

## 9.2 SQLite vs External DB Tradeoff

### Why SQLite is appropriate here

- Single-user or light multi-user workload.
- Low operational complexity: no external DB to deploy/backup/secure.
- Excellent read performance for local datasets with proper indexing.
- Atomic transactions and WAL mode improve concurrency for mostly-read workloads.

### Tradeoffs

- Lower write concurrency than Postgres under high contention.
- Fewer built-in advanced features for large-scale analytics.
- Requires careful backup strategy (transaction-safe snapshotting).

### Mitigation

- Enable WAL mode and sane busy timeout.
- Keep transactions short.
- Use indexed query patterns and pagination.
- For future scale, abstract repository layer to support Postgres migration if needed.

## 9.3 Module Boundaries

- `auth`
- `games`
- `ownership`
- `purchases`
- `metadataProviders`
- `mediaCache`
- `importExport`
- `dashboard`
- `settings`
- `backupRestore`

## 9.4 Representative Endpoints

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Games:

- `GET /api/games`
- `POST /api/games`
- `GET /api/games/:id`
- `PATCH /api/games/:id`
- `POST /api/games/:id/add-copy`

Ownership:

- `GET /api/ownership/:id`
- `PATCH /api/ownership/:id`
- `POST /api/ownership/:id/purchases`

Metadata:

- `GET /api/providers`
- `POST /api/providers/search`
- `POST /api/providers/import`
- `POST /api/games/:id/refresh-metadata`

Import/Export:

- `POST /api/import/csv/preview`
- `POST /api/import/csv/commit`
- `POST /api/import/json/preview`
- `POST /api/import/json/commit`
- `POST /api/export/csv`
- `POST /api/export/json`
- `POST /api/export/full-backup`

Dashboard:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/spend-by-year`
- `GET /api/dashboard/platform-breakdown`

Health:

- `GET /health/live`
- `GET /health/ready`

---

## 10. Frontend Design

## 10.1 UI Architecture

- React + TypeScript SPA (or hybrid SSR for first-load speed) served from same backend origin.
- Shared API client with runtime schema validation.
- Route-level code splitting.

## 10.2 Core Components

- Search bar + filter drawer/panel
- Library card/grid and compact table list
- Game summary header with metadata provenance badges
- Ownership entries list/cards
- Purchase timeline table
- Import mapping/preview wizard
- Provider match confidence modal

## 10.3 Performance/UI Tactics

- Image lazy loading and responsive sizes.
- Debounced search queries.
- Server-side pagination/filter/sort.
- Optimistic updates only for safe edits (toggle/status); fallback to pessimistic for complex mutations.

---

## 11. Security / Authentication

## 11.1 Authentication Modes

- **Default**: local account login required.
- **Optional single-user mode**: bootstrap admin account, optionally auto-login behind trusted LAN/reverse proxy.

## 11.2 Security Controls

- Password hashing: Argon2id (preferred) or bcrypt fallback.
- HTTP-only secure session cookies.
- CSRF protection on state-changing requests.
- Input validation for all APIs.
- File upload validation (mime/type/size/extension checks).
- Login rate limiting + lockout backoff.
- Provider call throttling to prevent accidental abuse.
- Basic audit log for destructive actions (delete/restore/import/backup restore).

## 11.3 Reverse Proxy Awareness

- Respect `X-Forwarded-*` when explicitly enabled.
- Configurable trusted proxy list.

## 11.4 Future

- optional read-only guest mode.
- optional TOTP 2FA.

---

## 12. Deployment / Docker Design

## 12.1 Single-Container Layout

- One image containing backend, frontend static assets, migration scripts.
- Startup entrypoint:
  1. validate env
  2. run DB migrations
  3. ensure directory structure
  4. start app server

## 12.2 Persistent Volumes

Mount one root volume (or split mounts):

- `/data/db` → SQLite files
- `/data/media` → artwork/uploads
- `/data/cache` → provider response cache
- `/data/exports` → user exports
- `/data/backups` → backup archives
- `/data/logs` (optional)

## 12.3 Environment Variables (Representative)

- `GV_PORT=3000`
- `GV_BASE_URL=http://localhost:3000`
- `GV_DATA_DIR=/data`
- `GV_DB_PATH=/data/db/gamevault.sqlite`
- `GV_SESSION_SECRET=...`
- `GV_AUTH_MODE=local|single_user`
- `GV_ENABLE_SIGNUP=false`
- `GV_RAWG_API_KEY=...`
- `GV_STEAM_ENABLED=true|false`
- `GV_ARTWORK_MODE=mirror|hotlink`
- `GV_LOG_LEVEL=info`

## 12.4 Dockerfile Expectations

- Multi-stage build.
- Non-root runtime user.
- Minimal base image.
- Healthcheck command included.

## 12.5 Example `docker run`

```bash
docker run -d \
  --name gamevault \
  -p 3000:3000 \
  -v /srv/gamevault:/data \
  -e GV_SESSION_SECRET='change-me' \
  -e GV_RAWG_API_KEY='your-key' \
  ghcr.io/your-org/gamevault:latest
```

## 12.6 Example Compose Service

```yaml
services:
  gamevault:
    image: ghcr.io/your-org/gamevault:latest
    container_name: gamevault
    ports:
      - "3000:3000"
    environment:
      GV_SESSION_SECRET: "change-me"
      GV_RAWG_API_KEY: "your-key"
      GV_STEAM_ENABLED: "true"
      GV_DATA_DIR: "/data"
    volumes:
      - /srv/gamevault:/data
    restart: unless-stopped
```

## 12.7 Upgrade / Rollback

Upgrade:

1. Trigger manual backup/export.
2. Pull new image.
3. Start container; migrations auto-run.
4. Verify readiness and basic UI checks.

Rollback:

1. Stop new container.
2. Restore prior image tag.
3. Restore DB/media backup if migration was non-backward-compatible.

---

## 13. Risks and Tradeoffs

1. **Provider API changes/outages**
   - Mitigation: adapter abstraction, caching, graceful fallback.
2. **Metadata licensing/attribution non-compliance**
   - Mitigation: explicit attribution UI + policy checks.
3. **SQLite lock contention in future multi-user mode**
   - Mitigation: WAL, short transactions, consider Postgres migration path later.
4. **Data loss risk from incorrect home-server backup practices**
   - Mitigation: built-in backup workflows and reminders.
5. **False-positive duplicate merging**
   - Mitigation: dry-run import preview, confidence thresholds, manual confirmation.

---

## 14. MVP Scope

## 14.1 Recommended MVP Feature Cut

Include:

- Local auth (single admin account).
- Core schema: Game, Platform, OwnershipEntry, Purchase, MediaAsset, ProviderRef.
- Library grid/list with core search + filters (platform, ownership type/status, play status, genre, year).
- Manual add/edit flows.
- RAWG provider search/import and metadata refresh.
- Optional Steam supplemental lookup (basic).
- Dashboard: totals, physical vs digital, platform breakdown, backlog, total spend.
- CSV/JSON import/export with dry-run preview.
- Full backup export (DB + media manifest archive).
- Docker single-container deployment.

Defer to Post-MVP:

- advanced batch actions,
- OCR/barcode scanning,
- deep Steam gameplay sync,
- multi-user permission model,
- PWA offline support.

## 14.2 Implementation Phase Plan

### Phase 0 — Foundation (1–2 weeks)

- Repo setup, CI, lint/test scaffolding.
- Docker build pipeline.
- SQLite migrations baseline.
- Auth/session + settings bootstrap.

### Phase 1 — Core Data + CRUD (2–3 weeks)

- Entities and APIs for games/ownership/purchases/platforms.
- Basic library UI + detail pages.
- Manual add/edit workflows.

### Phase 2 — Metadata Integration (2 weeks)

- Provider abstraction.
- RAWG adapter + attribution.
- Metadata import wizard + conflict-safe merge.
- Artwork caching mode.

### Phase 3 — Search/Filters + Dashboard (1–2 weeks)

- Indexed search/filter endpoints.
- Grid/list polish.
- Summary/report endpoints and charts.

### Phase 4 — Import/Export + Backup (1–2 weeks)

- CSV/JSON import preview/commit.
- Export formats and selective filters.
- Backup/restore workflows + schema versioning.

### Phase 5 — Hardening (1 week)

- Security checks, rate limiting, audit log.
- Performance pass on low-power hardware.
- Operational docs and upgrade runbook.

---

## 15. Post-MVP Roadmap

1. Barcode scanning via iPhone camera.
2. OCR receipt parsing.
3. Wishlist + price watch.
4. Steam gameplay time import (where allowed).
5. Cover/manual custom photo workflows.
6. Lending tracker.
7. Collection valuation estimates.
8. Multi-user household support with roles.
9. PWA/offline mode.
10. Public share page.
11. Recommendation features.
12. Emulator/launcher integration.
13. Platform sync connectors.

---

## 16. Open Questions

1. Should DLC be modeled as standalone `Game` with `parent_game_id` or as `GameContent` child entity?
2. Should bundles be represented as synthetic `Game` entries or explicit many-to-many package entity?
3. Is currency conversion needed for dashboard totals in MVP or can totals remain per-currency buckets?
4. How strict should duplicate detection thresholds be by default?
5. Should artwork mirroring be opt-out or opt-in by default considering storage constraints?
6. Are there legal/compliance constraints for storing externally sourced art long-term in local cache?
7. Should subscription entitlements (Game Pass/PS Plus) be first-class non-owned access records in MVP?
8. Is guest read-only mode needed at launch?
9. Should import allow user-defined transformation scripts or remain schema-mapped only?
10. Which locales/languages must be supported at launch?

---

## 17. Acceptance Criteria

### 17.1 Functional Acceptance

1. User can create a game manually with only title required.
2. User can import a game from provider search and see provider attribution.
3. User can create multiple ownership entries per game, including same-platform duplicates.
4. User can create multiple purchases per ownership entry.
5. User can filter and sort library by required dimensions.
6. User can view dashboard metrics listed in this spec.
7. User can run CSV/JSON import in dry-run mode and see duplicate warnings.
8. User can export CSV/JSON and produce full backup archive.
9. App runs fully in one container with persistent data surviving restarts.

### 17.2 Non-Functional Acceptance

1. Readiness and liveness endpoints function.
2. Startup performs DB migrations automatically.
3. App remains usable when providers are unavailable.
4. iPhone Safari usability validated for core flows.
5. Basic security controls (hashing/session/CSRF/input validation/rate limiting) enabled.

---

## Additional Explicit Business Rule Handling

- **Same game on multiple platforms**: separate ownership entries with platform-specific fields.
- **Multiple copies same platform/version**: each copy is distinct ownership entry.
- **Remaster/remake/collection**: separate game records linked by optional `related_game` relationship type.
- **DLC vs base game**: model as `content_type` with parent link (post-MVP if needed).
- **Bundles**: purchase event may reference bundle; ownership entries can link to one purchase.
- **Collector’s editions**: represented via `edition_name`, `media_format`, and notes/assets.
- **Incomplete physical copy**: completeness + component flags capture missing pieces.
- **Free/gifted games**: purchase channel handles gift; price can be null/0.
- **Sold/traded copies**: ownership status updated; purchase history retained.
- **Unknown purchase date/price**: nullable fields allowed; warnings not blockers.
- **Manual-only no provider match**: valid record with null provider refs.
- **Provider conflicts**: conflict flag + user review queue.
- **Duplicate false positives**: preview mode never auto-merge without user confirmation.
- **Region-specific titles**: region fields at game and ownership levels.
- **Subscription entitlement != ownership**: distinct status/type to avoid false ownership counts.

---

## Assumptions

1. Primary deployment is private LAN with optional reverse proxy + TLS.
2. Collection size target: up to tens of thousands of ownership entries.
3. User can provide API keys where needed for provider access.
4. No hard real-time sync requirement with external storefronts in MVP.

