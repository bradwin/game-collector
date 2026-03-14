import { useEffect, useState } from "react";
import { fetchHealth } from "../../lib/api";

export const HealthStatus = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetchHealth()
      .then((result) => setStatus(result.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return <p>Backend health: {status}</p>;
};
