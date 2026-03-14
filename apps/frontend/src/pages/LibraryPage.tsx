import { useEffect, useMemo, useState } from "react";
import { apiClient, OwnershipEntry, Platform } from "../lib/api";
import { useAuth } from "../app/auth";

const coverFor = (entry: OwnershipEntry) => entry.game.mediaAssets[0]?.url ?? "https://placehold.co/120x160?text=No+Cover";

const purchaseSummary = (entry: OwnershipEntry) => {
  const first = entry.purchases[0];
  if (!first) return "No purchase details";
  if (first.priceCents && first.currencyCode) {
    return `${first.currencyCode} ${(first.priceCents / 100).toFixed(2)}${first.vendor ? ` · ${first.vendor}` : ""}`;
  }
  return first.vendor ? `Purchased from ${first.vendor}` : "Purchase recorded";
};

export const LibraryPage = () => {
  const { token } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [entries, setEntries] = useState<OwnershipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [medium, setMedium] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [platformResponse, ownershipResponse] = await Promise.all([
        apiClient.getPlatforms(token),
        apiClient.listOwnership(token, { q: search || undefined, platformId: platformId || undefined, medium: medium || undefined, status: status || undefined })
      ]);
      setPlatforms(platformResponse.items);
      setEntries(ownershipResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const emptyMessage = useMemo(() => (search || platformId || medium || status ? "No matching entries." : "No games yet. Add your first game."), [search, platformId, medium, status]);

  return (
    <section>
      <div className="panel form inline-form">
        <input placeholder="Search title" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
          <option value="">All platforms</option>
          {platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
        </select>
        <select value={medium} onChange={(e) => setMedium(e.target.value)}>
          <option value="">Any medium</option>
          <option value="PHYSICAL">Physical</option>
          <option value="DIGITAL">Digital</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="BACKLOG">Backlog</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <button onClick={() => void load()}>Apply</button>
      </div>
      {loading ? <p className="subtle">Loading library...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !entries.length ? <div className="panel">{emptyMessage}</div> : null}
      <div className="card-grid">
        {entries.map((entry) => (
          <article key={entry.id} className="panel card">
            <img src={coverFor(entry)} alt={`${entry.game.title} cover`} loading="lazy" />
            <div>
              <h3>{entry.game.title}</h3>
              <p>{entry.platform.name} · {entry.medium}</p>
              <p>Status: {entry.status} · Play: {entry.playStatus}</p>
              {entry.editionName ? <p>Edition: {entry.editionName}</p> : null}
              {entry.region ? <p>Region: {entry.region}</p> : null}
              <p className="subtle">{purchaseSummary(entry)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
