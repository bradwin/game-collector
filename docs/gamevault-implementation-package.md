# GameVault Build-Ready Implementation Package

## 1. Executive Build Summary

GameVault should be implemented as a **single-process, single-container** TypeScript application that serves both API and React frontend, persists to SQLite, and stores all mutable artifacts under a mounted `/data` volume. This package converts the technical spec into execution-ready workstreams with clear MVP boundaries, schema/migration details, API contracts, and incremental Codex tasks.

Implementation priorities:

- Ship a complete solo-collector workflow first: auth → library CRUD → provider import → ownership/purchases → search/filter/dashboard.
- Preserve long-term portability: deterministic exports, versioned backups, explicit schema versioning.
- Maintain operational simplicity: no Redis, no second DB, no extra container, no background worker service.
- Prevent metadata clobbering: manual field overrides always beat provider refreshes.

---

## 2. Recommended MVP Cut

### Must-have for MVP

1. **Auth + session**
   - Local admin login, single-user bootstrap flow.
2. **Core domain model**
   - `Game`, `Platform`, `OwnershipEntry`, `Purchase`, `MediaAsset`, `GameProviderRef`, `Tag`.
3. **Library management**
   - Create/edit game manually (title required only), add copies, add purchase history.
   - Grid + compact list views with server-side pagination.
4. **Search/filter/sort**
   - Text search + platform + ownership type/status + play status + year + tag filters.
5. **Provider integration (RAWG primary)**
   - Search provider, preview candidate, import with confidence score.
   - Metadata refresh endpoint with override-safe merge.
6. **Dashboard summary**
   - Total games/copies, physical vs digital split, backlog count, spend summaries.
7. **Import/export portability**
   - JSON + CSV preview/commit import with duplicate warnings.
   - JSON + CSV export with filters.
8. **Backup/export**
   - Full backup artifact containing SQLite snapshot + media + manifest.
9. **Containerized deployment**
   - Startup validation, migrations-on-boot, health/readiness endpoints.

### Should-have immediately after MVP

- Steam supplemental enrichment for PC entries.
- Restore-from-backup UI + API (not only backup creation).
- Audit log view for destructive events.
- Provider management UI (enable/disable, API key validation).
- Better conflict review queue for provider field disagreements.

### Defer to post-MVP

- Multi-user roles/permissions.
- OCR/barcode scanning.
- Gameplay sync integrations.
- PWA offline mode.
- Advanced batch editing and automations.
- Guest read-only sharing mode.

---

## 3. Phased Implementation Plan

### Phase 0 — Foundation

- **Objective**: Establish executable baseline with repeatable local/dev/prod behavior.
- **Scope**: Project skeleton, config loading, logging, DB bootstrap/migrations, auth bootstrap, health endpoints.
- **Dependencies**: None.
- **Technical tasks**:
  - Create monorepo or single-app workspace (`apps/server`, `apps/web`, shared types).
  - Implement env schema validation (`zod`) and startup guardrails.
  - Add Prisma schema + initial migration pipeline.
  - Add Fastify server with request ID logging and `/health/live`, `/health/ready`.
  - Implement session store (SQLite-backed) and bootstrap-admin command.
- **Acceptance criteria**:
  - Container starts in <10s after initial setup.
  - Migrations run automatically on startup.
  - Login works and protected routes reject anonymous requests.
- **Risks**:
  - Session/cookie misconfiguration behind reverse proxy.

### Phase 1 — Core Data + CRUD

- **Objective**: Deliver complete manual cataloging workflow.
- **Scope**: Game/ownership/purchase CRUD + base library/detail screens.
- **Dependencies**: Phase 0.
- **Technical tasks**:
  - Implement repositories/services/controllers for core entities.
  - Add validation schemas for all mutation payloads.
  - Build Add Game flow (manual entry + optional first copy + optional purchase).
  - Build library list and game detail pages.
- **Acceptance criteria**:
  - User can create game with title only.
  - User can add multiple ownership entries and multiple purchases per entry.
- **Risks**:
  - Data consistency bugs from nested create/update flows.

### Phase 2 — Metadata Integration

- **Objective**: Add low-friction provider-assisted data entry.
- **Scope**: Provider abstraction, RAWG adapter, import preview/commit, override-safe refresh.
- **Dependencies**: Phase 1.
- **Technical tasks**:
  - Define provider interface and normalized DTOs.
  - Implement RAWG adapter + caching + retry/backoff.
  - Create import service mapping provider payload to domain fields.
  - Persist `GameProviderRef`, provenance, and field override mask.
- **Acceptance criteria**:
  - Provider search/import works with attribution display.
  - Refresh updates non-overridden fields only.
- **Risks**:
  - RAWG schema/rate-limit changes.

### Phase 3 — Search, Filters, Dashboard

- **Objective**: Make collection exploration and summary reporting fast.
- **Scope**: FTS/search indexes, filter pipelines, dashboard APIs/widgets.
- **Dependencies**: Phases 1–2.
- **Technical tasks**:
  - Implement `games_fts` virtual table + triggers.
  - Build query builder for compound filters/sorts.
  - Implement dashboard aggregates with currency bucketing.
- **Acceptance criteria**:
  - Typical list/search/filter response <300ms for medium local dataset.
- **Risks**:
  - Poor query plans if indexes mismatch filter patterns.

### Phase 4 — Import/Export + Backup/Restore

- **Objective**: Ensure portability and recovery.
- **Scope**: CSV/JSON import preview+commit, exports, full backup package, restore workflows.
- **Dependencies**: Phase 1 (and Phase 2 optional for enrichment).
- **Technical tasks**:
  - Add import parser + mapping layer + dry-run validation report.
  - Add dedupe checks and merge preview.
  - Implement deterministic JSON/CSV export endpoints.
  - Implement WAL-safe backup generation and restore checks.
- **Acceptance criteria**:
  - User can run dry-run import and commit safely.
  - Backup archive can be produced and validated via manifest checksums.
- **Risks**:
  - Large media backup time/memory footprint.

### Phase 5 — Hardening + Release Readiness

- **Objective**: Prepare for stable home-server operation.
- **Scope**: Security controls, rate limiting, audit logging, docs/runbooks, smoke tests.
- **Dependencies**: All previous phases.
- **Technical tasks**:
  - Add login rate limits + lockout backoff.
  - Add audit events for delete/restore/import/backup restore.
  - Finalize compose sample, upgrade/rollback guide.
- **Acceptance criteria**:
  - Security baseline controls in place.
  - Release checklist passes end-to-end smoke tests.
- **Risks**:
  - Over-tight limits harming LAN usability.

---

## 4. Database Schema and Migration Design

### 4.1 Core schema (SQLite + Prisma-friendly)

> Use `TEXT` IDs (ULID string) for portability and ordering, `INTEGER` for booleans (`0|1`), `NUMERIC` for money, ISO datetime in UTC.

#### `users`
- `id TEXT PRIMARY KEY`
- `email TEXT UNIQUE NOT NULL`
- `password_hash TEXT NOT NULL`
- `role TEXT NOT NULL DEFAULT 'admin'` (`admin|viewer` future)
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`

#### `sessions`
- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL REFERENCES users(id)`
- `csrf_token TEXT NOT NULL`
- `expires_at TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- index: `(user_id)`, `(expires_at)`

#### `platforms`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL UNIQUE`
- `manufacturer TEXT`
- `category TEXT NOT NULL CHECK(category IN ('console','handheld','pc','mobile','other'))`
- `generation INTEGER`
- `code TEXT UNIQUE`
- `release_year INTEGER`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`

#### `games`
- `id TEXT PRIMARY KEY`
- `canonical_title TEXT NOT NULL`
- `alternate_title TEXT`
- `sort_title TEXT`
- `franchise TEXT`
- `release_year INTEGER`
- `original_release_date TEXT`
- `description TEXT`
- `critic_rating REAL`
- `community_rating REAL`
- `multiplayer_flags_json TEXT` (JSON)
- `region_availability_json TEXT` (JSON)
- `metadata_source_provenance_json TEXT` (JSON)
- `field_override_mask_json TEXT NOT NULL DEFAULT '{}'`
- `last_metadata_sync_at TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`
- indexes: `(canonical_title)`, `(release_year)`, `(updated_at)`

#### `game_platforms`
- `game_id TEXT NOT NULL REFERENCES games(id)`
- `platform_id TEXT NOT NULL REFERENCES platforms(id)`
- `created_at TEXT NOT NULL`
- `PRIMARY KEY (game_id, platform_id)`

#### `ownership_entries`
- `id TEXT PRIMARY KEY`
- `game_id TEXT NOT NULL REFERENCES games(id)`
- `platform_id TEXT NOT NULL REFERENCES platforms(id)`
- `ownership_type TEXT NOT NULL CHECK(ownership_type IN ('physical','digital'))`
- `edition_name TEXT`
- `region TEXT`
- `language TEXT`
- `media_format TEXT`
- `ownership_status TEXT NOT NULL CHECK(ownership_status IN ('owned','sold','traded','wishlist','preordered','lent_out','borrowed','gifted','subscription'))`
- `condition TEXT`
- `completeness TEXT`
- `has_box INTEGER NOT NULL DEFAULT 0`
- `has_manual INTEGER NOT NULL DEFAULT 0`
- `has_disc INTEGER NOT NULL DEFAULT 0`
- `has_cartridge INTEGER NOT NULL DEFAULT 0`
- `has_steelbook INTEGER NOT NULL DEFAULT 0`
- `store_source TEXT`
- `installed INTEGER NOT NULL DEFAULT 0`
- `currently_playing INTEGER NOT NULL DEFAULT 0`
- `play_status TEXT CHECK(play_status IN ('backlog','playing','completed','shelved','dropped'))`
- `personal_rating REAL`
- `notes TEXT`
- `storage_location TEXT`
- `barcode TEXT`
- `serial_number TEXT`
- `sku TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`
- indexes:
  - `(game_id)`
  - `(platform_id)`
  - `(ownership_status)`
  - `(play_status)`
  - `(updated_at)`
  - partial dedupe helper:
    `CREATE INDEX idx_ownership_dedupe ON ownership_entries(game_id, platform_id, ownership_type, COALESCE(edition_name,''), COALESCE(region,'')) WHERE deleted_at IS NULL;`

#### `purchases`
- `id TEXT PRIMARY KEY`
- `ownership_entry_id TEXT NOT NULL REFERENCES ownership_entries(id)`
- `purchase_date TEXT`
- `seller_store TEXT`
- `purchase_channel TEXT NOT NULL CHECK(purchase_channel IN ('retail','secondhand','digital_store','gift','bundle','other'))`
- `order_reference TEXT`
- `currency TEXT NOT NULL` (ISO-4217)
- `purchase_price NUMERIC`
- `shipping NUMERIC`
- `tax NUMERIC`
- `fees NUMERIC`
- `total_paid NUMERIC`
- `payment_method TEXT`
- `purchase_condition TEXT`
- `import_source TEXT`
- `notes TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`
- indexes: `(ownership_entry_id)`, `(purchase_date)`, `(currency)`

#### `media_assets`
- `id TEXT PRIMARY KEY`
- `game_id TEXT REFERENCES games(id)`
- `ownership_entry_id TEXT REFERENCES ownership_entries(id)`
- `asset_type TEXT NOT NULL CHECK(asset_type IN ('cover','hero','screenshot','manual_photo','receipt_photo','custom_photo'))`
- `source_url TEXT`
- `local_path TEXT NOT NULL`
- `provider_attribution TEXT`
- `checksum_sha256 TEXT`
- `mime_type TEXT`
- `width INTEGER`
- `height INTEGER`
- `created_at TEXT NOT NULL`
- constraints:
  - `CHECK (game_id IS NOT NULL OR ownership_entry_id IS NOT NULL)`
- indexes: `(game_id)`, `(ownership_entry_id)`, unique `(checksum_sha256)` when not null

#### `game_provider_refs`
- `id TEXT PRIMARY KEY`
- `game_id TEXT NOT NULL REFERENCES games(id)`
- `provider TEXT NOT NULL`
- `provider_game_id TEXT NOT NULL`
- `confidence_score REAL`
- `is_primary INTEGER NOT NULL DEFAULT 0`
- `last_synced_at TEXT`
- `raw_payload_json TEXT`
- unique: `(provider, provider_game_id)`
- index: `(game_id, provider)`

#### `tags`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL UNIQUE`
- `color TEXT`
- `created_at TEXT NOT NULL`

#### `game_tags`
- `game_id TEXT NOT NULL REFERENCES games(id)`
- `tag_id TEXT NOT NULL REFERENCES tags(id)`
- `PRIMARY KEY (game_id, tag_id)`

#### `ownership_tags`
- `ownership_entry_id TEXT NOT NULL REFERENCES ownership_entries(id)`
- `tag_id TEXT NOT NULL REFERENCES tags(id)`
- `PRIMARY KEY (ownership_entry_id, tag_id)`

#### Optional custom fields

`custom_field_definitions`
- `id TEXT PRIMARY KEY`
- `scope TEXT NOT NULL CHECK(scope IN ('game','ownership_entry','purchase'))`
- `name TEXT NOT NULL`
- `value_type TEXT NOT NULL CHECK(value_type IN ('text','number','date','boolean','enum'))`
- `enum_options_json TEXT`
- `created_at TEXT NOT NULL`
- unique: `(scope, name)`

`custom_field_values`
- `id TEXT PRIMARY KEY`
- `definition_id TEXT NOT NULL REFERENCES custom_field_definitions(id)`
- `entity_id TEXT NOT NULL`
- `value_text TEXT`
- `value_number REAL`
- `value_date TEXT`
- `value_boolean INTEGER`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- unique: `(definition_id, entity_id)`

### 4.2 Enum strategy

- Store enums as constrained `TEXT` with `CHECK` constraints (SQLite-native, migration-safe).
- Mirror enum values in TypeScript `z.enum(...)` to keep API/runtime validation aligned.

### 4.3 Soft delete approach

- Mutable business tables include `deleted_at`.
- Default queries filter `deleted_at IS NULL`.
- Hard delete only via admin cleanup endpoint (writes audit event).

### 4.4 Dedupe + merge rules for provider/import

- **Game dedupe candidate**:
  1. exact provider match (`provider + provider_game_id`) → same game.
  2. else normalized title equality + release year ±1 + platform overlap.
- **Ownership dedupe candidate**:
  - `game_id + platform_id + ownership_type + edition_name + region` (normalized empty string for null).
- **Merge/import rules**:
  - Preserve all local user-authored fields where override mask says manual.
  - Update provider fields only when not overridden.
  - Never merge purchases automatically across different ownership entries without explicit user confirmation.

### 4.5 FTS5 recommendation

- Create `games_fts` virtual table on:
  - `canonical_title`, `alternate_title`, `franchise`, `description`.
- Use triggers on `games` insert/update/delete to keep index in sync.
- Query flow:
  - FTS candidate IDs first, then join/filter with relational constraints.

### 4.6 WAL-safe backup recommendations

- Enable:
  - `PRAGMA journal_mode=WAL;`
  - `PRAGMA synchronous=NORMAL;`
  - busy timeout (e.g., 5000ms).
- Backup method:
  1. obtain read lock / begin immediate short transaction,
  2. use SQLite Online Backup API (`VACUUM INTO` as fallback),
  3. include `-wal` and `-shm` if copying raw files,
  4. write manifest with checksums + schema version.

### 4.7 Example SQLite migration

```sql
-- 0001_init.sql
PRAGMA foreign_keys = ON;

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  canonical_title TEXT NOT NULL,
  alternate_title TEXT,
  sort_title TEXT,
  franchise TEXT,
  release_year INTEGER,
  original_release_date TEXT,
  description TEXT,
  critic_rating REAL,
  community_rating REAL,
  multiplayer_flags_json TEXT,
  region_availability_json TEXT,
  metadata_source_provenance_json TEXT,
  field_override_mask_json TEXT NOT NULL DEFAULT '{}',
  last_metadata_sync_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_games_title ON games(canonical_title);
CREATE INDEX idx_games_release_year ON games(release_year);

CREATE VIRTUAL TABLE games_fts USING fts5(
  game_id UNINDEXED,
  canonical_title,
  alternate_title,
  franchise,
  description,
  tokenize='porter unicode61'
);

CREATE TRIGGER games_ai AFTER INSERT ON games BEGIN
  INSERT INTO games_fts(game_id, canonical_title, alternate_title, franchise, description)
  VALUES (new.id, new.canonical_title, new.alternate_title, new.franchise, new.description);
END;

CREATE TRIGGER games_au AFTER UPDATE ON games BEGIN
  DELETE FROM games_fts WHERE game_id = old.id;
  INSERT INTO games_fts(game_id, canonical_title, alternate_title, franchise, description)
  VALUES (new.id, new.canonical_title, new.alternate_title, new.franchise, new.description);
END;

CREATE TRIGGER games_ad AFTER DELETE ON games BEGIN
  DELETE FROM games_fts WHERE game_id = old.id;
END;
```

---

## 5. Backend Architecture

### 5.1 Runtime shape

- Single Node.js process:
  - Fastify API server.
  - Static frontend serving.
  - In-process scheduler/worker for lightweight background jobs.

### 5.2 Suggested folder/module layout

```txt
src/
  app.ts
  server.ts
  config/
  plugins/
    auth.ts
    prisma.ts
    rateLimit.ts
    csrf.ts
  modules/
    auth/
    games/
    ownership/
    purchases/
    providers/
    media/
    importExport/
    backupRestore/
    dashboard/
    settings/
    audit/
  jobs/
    queue.ts
    workers/
  lib/
    errors.ts
    logger.ts
    pagination.ts
    money.ts
    dedupe.ts
```

### 5.3 Layer responsibilities

- **Route/controller layer**:
  - Parse/validate request, invoke service, map errors to HTTP.
- **Service layer**:
  - Business logic, transactions, dedupe/merge policy, authorization checks.
- **Repository/data layer**:
  - Prisma queries isolated per aggregate, reusable filter/query builders.
- **Provider adapters**:
  - External API calls, normalization, provider-specific retry/rate-limit handling.

### 5.4 Metadata provider abstraction

```ts
export interface MetadataProvider {
  id: 'rawg' | 'steam' | string;
  searchGames(query: string, opts: SearchOptions): Promise<ProviderSearchResult[]>;
  getGameDetails(providerGameId: string): Promise<ProviderGameDetails>;
  getArtwork(providerGameId: string): Promise<ProviderArtwork[]>;
  getAttribution(): ProviderAttribution;
  getRateLimitPolicy(): RateLimitPolicy;
}
```

`ProviderManager` responsibilities:
- registry/enable flags,
- provider precedence,
- fallback when one provider fails,
- cache lookup/write,
- merge candidate scoring.

### 5.5 Image caching subsystem

- `MediaService` pipeline:
  1. fetch remote image,
  2. validate mime + max size,
  3. compute checksum,
  4. write to `/data/media/games/<gameId>/...`,
  5. create `media_assets` row.
- Supports `mirror` and `hotlink` modes.

### 5.6 Import/export subsystem

- `ImportService`:
  - parse CSV/JSON,
  - schema map,
  - dry-run validator (errors/warnings/duplicates),
  - commit mode with transaction chunking.
- `ExportService`:
  - filtered export from canonical queries,
  - deterministic column order,
  - metadata-rich JSON format with schema version.

### 5.7 Backup/restore subsystem

- `BackupService.createBackup()`:
  - run WAL-safe DB snapshot,
  - include media references and optional files,
  - emit manifest (`appVersion`, `schemaVersion`, checksums).
- `RestoreService`:
  - validate manifest,
  - compatibility check,
  - dry-run verification before replace.

### 5.8 Auth/session subsystem

- local account table with Argon2id hashes.
- session cookie + CSRF token pair.
- invalidation on logout/password change.
- single-user mode bypasses registration UI and permits first-run bootstrap only.

### 5.9 Background jobs inside single container

- SQLite-backed lightweight `jobs` table:
  - `id`, `type`, `payload_json`, `status`, `attempts`, `run_after`, `last_error`, timestamps.
- periodic tick (e.g., every 5s) claims due jobs with optimistic lock update.
- jobs for:
  - metadata refresh,
  - artwork mirror fetch,
  - scheduled backup.

---

## 6. API Contract

All APIs under `/api`. JSON request/response unless file upload/download.

### 6.1 Auth

#### `POST /api/auth/login`
- **Purpose**: authenticate local user.
- **Request**: `{ email: string, password: string }`
- **Validation**: valid email, password min length 8.
- **Response 200**: `{ user: { id, email, role }, csrfToken }`
- **Errors**: `401 invalid_credentials`, `429 rate_limited`.

#### `POST /api/auth/logout`
- **Purpose**: invalidate session.
- **Request**: none.
- **Response 204**.
- **Errors**: `401` if no session.

#### `GET /api/auth/me`
- **Purpose**: current session identity.
- **Response 200**: `{ user: { id, email, role } }`
- **Errors**: `401 not_authenticated`.

### 6.2 Games

#### `GET /api/games`
- **Purpose**: paginated library listing with filters.
- **Query**: `q,page,pageSize,sort,platformId,ownershipType,ownershipStatus,playStatus,year,tagIds[]`
- **Response 200**:
  - `{ items: GameListItem[], page, pageSize, total }`
- **Validation**: page bounds, whitelist sort keys.
- **Errors**: `400 validation_error`.

#### `POST /api/games`
- **Purpose**: create game manually.
- **Request**:
  - `{ canonicalTitle: string, releaseYear?, description?, tags?, initialOwnership?, initialPurchase? }`
- **Response 201**: `{ gameId }`
- **Errors**: `400 validation_error`.

#### `GET /api/games/:id`
- **Purpose**: full game detail.
- **Response**: game + ownership list + purchases summary + provider refs + media.
- **Errors**: `404 not_found`.

#### `PATCH /api/games/:id`
- **Purpose**: update game metadata and override mask.
- **Request**: partial mutable fields + optional `overrideFields: string[]`.
- **Response 200**: updated entity.
- **Errors**: `404`, `409 conflict` (version mismatch if optimistic concurrency enabled).

#### `POST /api/games/:id/add-copy`
- **Purpose**: create ownership entry for existing game.
- **Request**: ownership payload.
- **Response 201**: `{ ownershipEntryId }`
- **Errors**: `400`, `404`.

### 6.3 Ownership entries

#### `GET /api/ownership/:id`
- **Purpose**: retrieve one ownership entry.
- **Response 200**: ownership details + purchases.

#### `PATCH /api/ownership/:id`
- **Purpose**: edit ownership fields/status.
- **Request**: partial ownership payload.
- **Response 200**.
- **Errors**: `404`, `400`.

#### `DELETE /api/ownership/:id`
- **Purpose**: soft delete ownership entry.
- **Response 204**.
- **Errors**: `404`.

### 6.4 Purchases

#### `POST /api/ownership/:id/purchases`
- **Purpose**: append purchase event.
- **Request**: purchase payload.
- **Validation**:
  - currency required,
  - numeric fields >= 0 if present,
  - auto-compute `total_paid` when omitted.
- **Response 201**: `{ purchaseId }`

#### `PATCH /api/purchases/:id`
- **Purpose**: edit purchase event.
- **Response 200`**.

#### `DELETE /api/purchases/:id`
- **Purpose**: soft delete purchase event.
- **Response 204`**.

### 6.5 Metadata search/import/refresh

#### `GET /api/providers`
- **Purpose**: list provider status/config (non-secret).
- **Response**: `{ providers: [{ id, enabled, healthy, attribution }] }`

#### `POST /api/providers/search`
- **Purpose**: search metadata providers.
- **Request**: `{ query: string, provider?: string, limit?: number }`
- **Response**:
  - `{ results: [{ provider, providerGameId, title, year, platforms, coverUrl, confidence }] }`
- **Errors**: `503 provider_unavailable`.

#### `POST /api/providers/import`
- **Purpose**: import selected provider result as new game.
- **Request**: `{ provider, providerGameId, localOverrides?, createOwnership? }`
- **Response 201**: `{ gameId, importedFields, skippedOverriddenFields }`
- **Errors**: `409 duplicate_candidate` (requires user confirmation), `502 provider_error`.

#### `POST /api/games/:id/refresh-metadata`
- **Purpose**: refresh existing game from provider refs.
- **Response 202**: `{ jobId }` (background refresh) or `200` (inline for small payload).
- **Errors**: `404 no_provider_ref`, `503 providers_unavailable`.

### 6.6 Dashboard

#### `GET /api/dashboard/summary`
- **Response**:
  - `{ gameCount, ownershipCount, physicalCount, digitalCount, backlogCount, spendByCurrency }`

#### `GET /api/dashboard/spend-by-year`
- **Response**: `{ points: [{ year, currency, total }] }`

#### `GET /api/dashboard/platform-breakdown`
- **Response**: `{ items: [{ platformId, platformName, count }] }`

### 6.7 Import preview/commit

#### `POST /api/import/csv/preview`
- **Request**: multipart file + mapping config.
- **Response**:
  - `{ summary, rowResults: [{ rowNumber, status, errors[], warnings[], dedupeCandidates[] }] }`

#### `POST /api/import/csv/commit`
- **Request**: `previewToken` + conflict resolutions.
- **Response**: `{ imported, merged, skipped, failed }`

#### `POST /api/import/json/preview`
#### `POST /api/import/json/commit`
- Same contract as CSV variant.

### 6.8 Export endpoints

#### `POST /api/export/csv`
- **Request**: filters + include flags.
- **Response**: file download `text/csv`.

#### `POST /api/export/json`
- **Request**: filters + include flags.
- **Response**: file download `application/json`.

#### `POST /api/export/full-backup`
- **Purpose**: on-demand full backup archive.
- **Response**: `{ backupId, filename, sizeBytes, createdAt }` or file stream.

### 6.9 Backup endpoints

#### `GET /api/backups`
- **Response**: list of backup manifests.

#### `POST /api/backups/create`
- **Response**: `{ backupId }`.

#### `POST /api/backups/restore`
- **Request**: `{ backupId, dryRun?: boolean }`
- **Response**: dry-run report or restore result.
- **Errors**: `409 schema_incompatible`, `422 checksum_failed`.

### 6.10 Health endpoints

#### `GET /health/live`
- process alive check.

#### `GET /health/ready`
- verifies DB connectivity, migration state, data dirs writable.

---

## 7. Frontend Architecture

### 7.1 Route/page map

- `/login` — auth form.
- `/` (Dashboard) — high-level metrics and quick links.
- `/library` — search/filter list/grid of games.
- `/games/:id` (Game Detail) — canonical metadata, ownerships, purchases, media.
- `/add` (Add Game Wizard) — manual or provider import.
- `/import-export` — CSV/JSON preview/commit + exports.
- `/settings` — app config and auth/profile settings.
- `/providers` — provider status/config and attribution.
- `/backup` — backup list/create/restore.

### 7.2 Reusable components

- `AppShell` (header/nav/responsive drawer)
- `SearchBar`
- `FilterDrawer` + `FilterChips`
- `GameCard`, `GameRow`
- `OwnershipCard`
- `PurchaseTable`
- `MetadataMatchModal`
- `ImportPreviewTable`
- `StatTile`
- `ConfirmDialog`

### 7.3 State strategy

- Server state: TanStack Query.
- UI-local state: React hooks + route search params for filters.
- Keep filter/search/sort in URL for shareable state and browser back behavior.

### 7.4 Form strategy

- React Hook Form + Zod resolvers.
- Multi-step wizard for add/import flow with explicit step validation.
- Numeric/money input normalization before submit.

### 7.5 Mobile and desktop behavior

- Mobile first breakpoints optimized for iPhone Safari.
- Touch targets >=44px, sticky top search/filter button.
- Filter drawer slides from bottom on mobile, side panel on desktop.
- Desktop dense table mode with configurable visible columns.

### 7.6 Loading/error and list behavior

- Skeleton rows/cards during fetch.
- Sticky inline error banner with retry action.
- Infinite scroll optional; default page-based pagination for deterministic state.
- Image lazy loading with `loading="lazy"`, placeholder blur, and fallback cover.

### 7.7 Add/import workflows

- Wizard entry step asks: **Manual** or **Import from provider**.
- Import path:
  1. query provider,
  2. choose match (confidence indicators),
  3. preview mapped fields + override toggles,
  4. confirm import and optionally add ownership/purchase.

---

## 8. Metadata Provider Design

### 8.1 Normalized provider layer

- `ProviderManager` orchestrates all adapters.
- Standard DTOs:
  - `ProviderSearchResult`
  - `ProviderGameDetails`
  - `ProviderArtwork`
  - `ProviderAttribution`

### 8.2 RAWG adapter (primary)

- Responsibilities:
  - title search,
  - detail fetch,
  - artwork URLs,
  - platform/genre normalization mapping.
- Stores RAWG IDs in `game_provider_refs`.

### 8.3 Steam supplemental adapter (optional)

- Enabled by config.
- Used only for enrichment of PC-centric fields.
- Never overrides local manual fields or RAWG primary fields unless explicit user action.

### 8.4 Provider precedence + conflict handling

1. Local manual overrides
2. Primary provider (RAWG)
3. Supplemental provider (Steam)

Conflicts:
- if mismatch on high-value fields (`canonical_title`, `release_year`, major artwork), mark `conflict_flag` in provenance and surface in UI review badge.

### 8.5 Low-confidence match handling

- Confidence bands:
  - `>=0.85`: green, default selected.
  - `0.60–0.84`: yellow, requires user confirmation.
  - `<0.60`: red, hidden unless user enables “show low confidence”.

### 8.6 Caching, retry/backoff, and resilience

- Cache TTL:
  - search: 24h
  - details: 7d
  - artwork metadata: 30d
- Retry policy:
  - exponential with jitter, max 3 attempts.
- On provider outage:
  - imports disabled with clear error,
  - local app remains fully functional,
  - cached prior results may still be used (marked stale).

### 8.7 Attribution + artwork mirroring policy

- Persist attribution metadata per provider/media asset.
- Display source attribution on game detail and provider settings.
- Default `mirror` mode downloads selected artwork locally for offline stability.
- `hotlink` mode keeps only remote URL + attribution.

### 8.8 Extensibility model

- Register adapters by interface + config schema.
- New provider requires only:
  - adapter implementation,
  - normalization mapping,
  - provider settings descriptor.

---

## 9. Docker/Deployment Design

### 9.1 Recommended repo/runtime structure

```txt
/
  apps/
    server/
    web/
  prisma/
  docs/
  docker/
    entrypoint.sh
  data/                 # local dev only
```

Runtime filesystem under mounted `/data`:

```txt
/data/
  db/
    gamevault.sqlite
  media/
    games/
    ownership/
  cache/
    providers/
  exports/
  backups/
  logs/
```

### 9.2 Dockerfile outline

1. `node:<lts>-alpine` builder stage.
2. Install deps, build frontend and backend.
3. Generate Prisma client.
4. Runtime stage with non-root user.
5. Copy build artifacts + migration files + entrypoint.
6. `HEALTHCHECK` hits `/health/live`.

### 9.3 Required env vars

- `GV_PORT=3000`
- `GV_BASE_URL=http://localhost:3000`
- `GV_DATA_DIR=/data`
- `GV_DB_PATH=/data/db/gamevault.sqlite`
- `GV_SESSION_SECRET=<required>`
- `GV_AUTH_MODE=local|single_user`
- `GV_ENABLE_SIGNUP=false`
- `GV_RAWG_API_KEY=<optional but needed for RAWG import>`
- `GV_STEAM_ENABLED=false`
- `GV_ARTWORK_MODE=mirror|hotlink`
- `GV_TRUST_PROXY=false`
- `GV_LOG_LEVEL=info`

### 9.4 Startup sequence

1. Validate env + required directories.
2. Ensure `/data/*` paths exist + writable.
3. Run Prisma migrations.
4. Seed baseline platforms (idempotent).
5. Start Fastify server.

### 9.5 Migration-on-boot behavior

- Fail fast if migration fails (container exits non-zero).
- Write migration status to startup logs.
- Keep rollback runbook for non-backward-compatible migrations.

### 9.6 Backup layout and retention

`/data/backups/YYYY/MM/gamevault-backup-<timestamp>.tar.zst`

Manifest in archive root:
- `manifest.json` with app version, schema version, file checksums, timestamp.

Retention defaults:
- keep last 14 daily + 8 weekly + 6 monthly backups.

### 9.7 Sample `docker run`

```bash
docker run -d \
  --name gamevault \
  -p 3000:3000 \
  -v /srv/gamevault:/data \
  -e GV_SESSION_SECRET='replace-this-secret' \
  -e GV_RAWG_API_KEY='rawg-key' \
  ghcr.io/your-org/gamevault:latest
```

### 9.8 Sample `docker-compose.yml`

```yaml
services:
  gamevault:
    image: ghcr.io/your-org/gamevault:latest
    container_name: gamevault
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GV_PORT: "3000"
      GV_DATA_DIR: "/data"
      GV_DB_PATH: "/data/db/gamevault.sqlite"
      GV_SESSION_SECRET: "replace-this-secret"
      GV_AUTH_MODE: "local"
      GV_ENABLE_SIGNUP: "false"
      GV_RAWG_API_KEY: "rawg-key"
      GV_STEAM_ENABLED: "false"
      GV_ARTWORK_MODE: "mirror"
      GV_TRUST_PROXY: "false"
      GV_LOG_LEVEL: "info"
    volumes:
      - /srv/gamevault:/data
```

### 9.9 Upgrade and rollback notes

- **Upgrade**:
  1. create backup from UI/API,
  2. pull new image,
  3. restart container,
  4. verify `/health/ready` and basic UI flows.
- **Rollback**:
  1. stop new container,
  2. run previous image tag,
  3. restore latest compatible backup if schema changed.

---

## 10. Security Baseline

- **Local login**: required by default.
- **Password hashing**: Argon2id (`memoryCost` moderate for home hardware), bcrypt fallback if unavailable.
- **Session handling**:
  - HTTP-only cookies,
  - `Secure` when HTTPS,
  - `SameSite=Lax`,
  - idle + absolute expiration.
- **CSRF**:
  - double-submit token or synchronized token for state-changing methods.
- **File uploads**:
  - enforce size cap,
  - MIME sniff + extension allowlist,
  - store outside web root and serve via controlled endpoint.
- **Rate limiting**:
  - stricter on login and provider search,
  - soft limits for LAN usage.
- **Reverse proxy**:
  - only trust forwarded headers when `GV_TRUST_PROXY=true` and source trusted.
- **Audit logging**:
  - destructive actions (`delete`, `restore`, `import commit`, `restore backup`) include actor + timestamp + target IDs.
- **Single-user mode**:
  - optional mode for trusted LAN; disabled by default.
- **Future guest/read-only mode**:
  - planned role with read-only API scope and no export/backup restore permissions.

---

## 11. Edge Cases and Business Rules

1. **Same game on multiple platforms**
   - one `game`, multiple `ownership_entries` with distinct `platform_id`.
2. **Multiple copies on same platform**
   - separate ownership rows even if same platform; dedupe warns but does not force merge.
3. **Remasters/remakes/collections**
   - separate `games`; optional `related_game_links` extension in post-MVP.
4. **Deluxe/collector editions**
   - represented via `edition_name`, `media_format`, flags, notes, and media assets.
5. **DLC vs base game**
   - MVP: treat DLC as `game` with tag `dlc` and optional parent link field in metadata JSON.
6. **Bundles**
   - `purchase_channel='bundle'`; purchase can be attached to multiple ownership entries via post-MVP join table.
7. **Sold/traded copies**
   - update `ownership_status`; keep purchase history immutable.
8. **Gifts/free acquisitions**
   - channel `gift` or `other`; `purchase_price` nullable or `0`.
9. **Unknown purchase date/price**
   - nullable and accepted; UI shows “Unknown”.
10. **Subscription access not ownership**
    - `ownership_status='subscription'` (excluded from ownership totals by default).
11. **Manual-only entries with no provider match**
    - fully valid `game` with no provider refs.
12. **Provider conflicts**
    - mark provenance conflict and require manual review for critical fields.
13. **Duplicate false positives**
    - preview-only warnings; user must explicitly confirm merges.
14. **Region-specific variants**
    - maintain region at ownership level; optional game-level region availability metadata.

---

## 12. Codex Task Breakdown

> Order is dependency-aware and intentionally granular for iterative execution.

1. **Bootstrap app skeleton**
   - Files: `package.json`, `src/server.ts`, `src/app.ts`, build scripts.
   - DoD: server boots and serves health endpoints.
   - Tests: basic startup test.

2. **Env config and startup validation**
   - Files: `src/config/*`.
   - DoD: invalid env fails fast with actionable logs.
   - Tests: config unit tests.

3. **Prisma schema + initial migration**
   - Files: `prisma/schema.prisma`, `prisma/migrations/*`.
   - DoD: DB created/migrated on boot.
   - Tests: migration apply test against temp SQLite.

4. **Auth/session module**
   - Files: `src/modules/auth/*`, auth plugin.
   - DoD: login/logout/me endpoints with cookie sessions.
   - Tests: integration tests for auth lifecycle.

5. **Platform seed + settings baseline**
   - Files: seed script, settings module.
   - DoD: default platforms seeded idempotently.
   - Tests: seed repeatability test.

6. **Games CRUD API + validation**
   - Files: `src/modules/games/*`.
   - DoD: create/get/update/list games.
   - Tests: API contract tests.

7. **Ownership CRUD API**
   - Files: `src/modules/ownership/*`.
   - DoD: add/edit/delete ownership entries.
   - Tests: ownership state transitions.

8. **Purchase API + totals computation**
   - Files: `src/modules/purchases/*`.
   - DoD: purchases persist and total auto-computes.
   - Tests: money math unit tests + API tests.

9. **Tagging support**
   - Files: `src/modules/tags/*`.
   - DoD: create/list/assign tags to games/ownership entries.
   - Tests: relation integrity tests.

10. **Library query/filter/sort pipeline**
    - Files: game repository query builder.
    - DoD: multi-filter search endpoint stable and paginated.
    - Tests: integration tests with fixture dataset.

11. **FTS5 integration**
    - Files: migration triggers + search service.
    - DoD: text search uses FTS and falls back when unavailable.
    - Tests: FTS sync trigger tests.

12. **Provider abstraction + RAWG adapter**
    - Files: `src/modules/providers/*`.
    - DoD: provider search/details normalized.
    - Tests: adapter contract tests with mocked RAWG responses.

13. **Metadata import + override-safe merge**
    - Files: provider import service, game update service.
    - DoD: import creates game + refs; refresh respects override mask.
    - Tests: merge behavior matrix tests.

14. **Media mirror pipeline**
    - Files: media service + filesystem helpers.
    - DoD: remote artwork downloaded, hashed, and linked.
    - Tests: file validation and checksum tests.

15. **Dashboard endpoints**
    - Files: `src/modules/dashboard/*`.
    - DoD: summary/spend/platform endpoints return expected aggregates.
    - Tests: aggregate query tests.

16. **Import preview/commit (CSV + JSON)**
    - Files: `src/modules/importExport/*`.
    - DoD: dry-run preview with duplicate and validation reports.
    - Tests: parser + preview integration tests.

17. **Export + full backup creation**
    - Files: export and backup services.
    - DoD: CSV/JSON exports and backup artifact generation.
    - Tests: archive manifest/checksum tests.

18. **Restore flow + audit logging**
    - Files: backup restore service, audit module.
    - DoD: dry-run restore and audited destructive events.
    - Tests: restore compatibility tests.

19. **Frontend shell + key pages**
    - Files: `apps/web/src/routes/*`, components.
    - DoD: Dashboard/Library/Game Detail/Add Wizard operational.
    - Tests: component smoke tests.

20. **Deployment hardening + docs**
    - Files: Dockerfile, entrypoint, compose sample, runbook docs.
    - DoD: one-command container run with persistent volume.
    - Tests: container smoke test and readiness probe.

---

## 13. Testing Strategy

### Unit tests

- Domain utilities: dedupe normalization, merge logic, currency total computation.
- Provider adapter mappers and confidence scoring.
- Form/data validators (Zod schemas).

### Integration tests

- Fastify + SQLite temp DB integration for each module.
- Auth/session workflows including CSRF checks.
- Game→ownership→purchase relational integrity flows.

### API validation tests

- Contract-style tests for status codes, schema, and error payloads.
- Filter/sort pagination tests with seeded fixtures.

### SQLite migration tests

- Apply all migrations to empty DB.
- Upgrade test from previous schema snapshots.
- Verify FTS triggers and indexes exist.

### Provider adapter tests

- Mocked RAWG responses for search/detail/artwork.
- Retry/backoff behavior on transient 429/5xx.
- Cached response path and stale fallback path.

### Import/export tests

- CSV and JSON preview row diagnostics.
- Commit with explicit conflict resolutions.
- Export snapshot tests for deterministic shape.
- Backup archive manifest checksum verification.

### Responsive UI smoke tests

- Playwright smoke for iPhone Safari viewport equivalents + desktop viewport:
  - login,
  - library search,
  - add manual game,
  - add ownership + purchase,
  - provider import (mocked),
  - backup create trigger.

---

## 14. Open Questions and Recommended Defaults

1. **DLC modeling**
   - Default: MVP uses `Game` + `tag=dlc` + optional `parent_game_id` nullable field.
2. **Bundle allocation**
   - Default: do not prorate bundle price in MVP; store full bundle amount and optional note.
3. **Currency conversion in dashboard**
   - Default: keep totals bucketed per currency; no FX conversion in MVP.
4. **Duplicate threshold**
   - Default: conservative warnings only; no auto-merge.
5. **Artwork mirroring default**
   - Default: `mirror` enabled for resilience; allow opt-out.
6. **Provider legal/attribution policy**
   - Default: enforce attribution display when provider enabled and store attribution with each asset.
7. **Subscription records in MVP**
   - Default: supported via `ownership_status='subscription'`, excluded from “owned” totals.
8. **Guest mode at launch**
   - Default: deferred; keep auth surface simple and secure.
9. **Import transform scripting**
   - Default: no custom scripts; structured mapping only.
10. **Localization**
   - Default: English-first UI; store Unicode text and ISO timestamps for future i18n.

