import { FormEvent, useEffect, useState } from "react";
import { apiClient, Game, MetadataSearchResult, Platform } from "../lib/api";
import { useAuth } from "../app/auth";
import { useNavigate } from "react-router-dom";

export const AddGamePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"manual" | "metadata">("manual");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState("");
  const [manualReleaseDate, setManualReleaseDate] = useState("");

  const [metadataQuery, setMetadataQuery] = useState("");
  const [metadataConfigured, setMetadataConfigured] = useState(true);
  const [metadataResults, setMetadataResults] = useState<MetadataSearchResult[]>([]);

  const [platformId, setPlatformId] = useState("");
  const [medium, setMedium] = useState<"PHYSICAL" | "DIGITAL">("PHYSICAL");
  const [status, setStatus] = useState("ACTIVE");
  const [playStatus, setPlayStatus] = useState("UNPLAYED");
  const [editionName, setEditionName] = useState("");
  const [region, setRegion] = useState("");
  const [digitalStore, setDigitalStore] = useState("");

  const [addPurchase, setAddPurchase] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [vendor, setVendor] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const response = await apiClient.getPlatforms(token);
      setPlatforms(response.items);
      if (response.items[0]) setPlatformId(response.items[0].id);
    };

    void load();
  }, [token]);

  const createManualGame = async () => {
    if (!token) return;
    if (!manualTitle.trim()) throw new Error("Title is required");
    const { item } = await apiClient.createGame(token, {
      title: manualTitle,
      releaseDate: manualReleaseDate ? new Date(`${manualReleaseDate}T00:00:00.000Z`).toISOString() : null
    });
    setSelectedGame(item);
  };

  const searchMetadata = async () => {
    if (!token || !metadataQuery.trim()) return;
    setError(null);
    try {
      const response = await apiClient.metadataSearch(token, metadataQuery);
      setMetadataConfigured(response.providerConfigured);
      setMetadataResults(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search metadata");
    }
  };

  const importMetadata = async (candidate: MetadataSearchResult) => {
    if (!token) return;
    const { item } = await apiClient.metadataImport(token, candidate);
    setSelectedGame(item);
  };

  const submitOwnership = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selectedGame) return;
    setSaving(true);
    setError(null);
    try {
      const ownership = await apiClient.createOwnership(token, {
        gameId: selectedGame.id,
        platformId,
        medium,
        status,
        playStatus,
        editionName: editionName || null,
        region: region || null,
        digitalStore: digitalStore || null
      });

      if (addPurchase) {
        await apiClient.createPurchase(token, {
          ownershipEntryId: ownership.item.id,
          priceCents: price ? Math.round(Number(price) * 100) : null,
          currencyCode: currency || null,
          vendor: vendor || null
        });
      }

      navigate("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save ownership");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel form">
      <h2>Add game</h2>
      <div className="toggle-group">
        <button type="button" className={mode === "manual" ? "active" : "ghost"} onClick={() => setMode("manual")}>Manual entry</button>
        <button type="button" className={mode === "metadata" ? "active" : "ghost"} onClick={() => setMode("metadata")}>Search metadata</button>
      </div>

      {mode === "manual" ? (
        <div className="panel form">
          <label>Title<input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} /></label>
          <label>Release date<input type="date" value={manualReleaseDate} onChange={(e) => setManualReleaseDate(e.target.value)} /></label>
          <button type="button" onClick={() => void createManualGame()} disabled={saving}>Create game</button>
        </div>
      ) : (
        <div className="panel form">
          <div className="inline-form">
            <input value={metadataQuery} onChange={(e) => setMetadataQuery(e.target.value)} placeholder="Search RAWG" />
            <button type="button" onClick={() => void searchMetadata()}>Search</button>
          </div>
          {!metadataConfigured ? <p className="subtle">RAWG API key missing. Set RAWG_API_KEY on backend.</p> : null}
          <div className="results-list">
            {metadataResults.map((candidate) => (
              <div key={candidate.externalId} className="panel metadata-row">
                <img src={candidate.coverImageUrl ?? "https://placehold.co/64x84?text=No+Cover"} alt="cover" />
                <div>
                  <strong>{candidate.title}</strong>
                  <p className="subtle">{candidate.releaseDate ?? "Unknown release"}</p>
                </div>
                <button type="button" onClick={() => void importMetadata(candidate)}>Import</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedGame ? <p className="success">Selected game: {selectedGame.title}</p> : <p className="subtle">Choose a game first.</p>}

      <form onSubmit={submitOwnership} className="form">
        <h3>Ownership</h3>
        <label>Platform
          <select value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
            {platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
          </select>
        </label>
        <label>Medium
          <select value={medium} onChange={(e) => setMedium(e.target.value as "PHYSICAL" | "DIGITAL")}> <option value="PHYSICAL">Physical</option><option value="DIGITAL">Digital</option></select>
        </label>
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Active</option><option value="BACKLOG">Backlog</option><option value="PAUSED">Paused</option><option value="COMPLETED">Completed</option>
          </select>
        </label>
        <label>Play status
          <select value={playStatus} onChange={(e) => setPlayStatus(e.target.value)}>
            <option value="UNPLAYED">Unplayed</option><option value="PLAYING">Playing</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On hold</option>
          </select>
        </label>
        <label>Edition<input value={editionName} onChange={(e) => setEditionName(e.target.value)} /></label>
        <label>Region<input value={region} onChange={(e) => setRegion(e.target.value)} /></label>
        {medium === "DIGITAL" ? <label>Store<input value={digitalStore} onChange={(e) => setDigitalStore(e.target.value)} /></label> : null}

        <label><input type="checkbox" checked={addPurchase} onChange={(e) => setAddPurchase(e.target.checked)} /> Add purchase now</label>
        {addPurchase ? (
          <div className="inline-form">
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" inputMode="decimal" />
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="Currency" maxLength={3} />
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor" />
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
        <button disabled={!selectedGame || saving}>{saving ? "Saving..." : "Save to library"}</button>
      </form>
    </section>
  );
};
