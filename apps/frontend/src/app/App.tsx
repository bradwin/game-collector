import { HealthStatus } from "../features/health/HealthStatus";

export const App = () => {
  return (
    <main style={{ fontFamily: "sans-serif", margin: "2rem", lineHeight: 1.5 }}>
      <h1>Game Collector</h1>
      <p>Initial scaffold running in development mode.</p>
      <HealthStatus />
    </main>
  );
};
