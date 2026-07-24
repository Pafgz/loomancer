import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./index.css";
import {
  createLocalRepository,
  type LocalRepository,
} from "./repository/local-repository";

registerSW({ immediate: true });

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

function Bootstrap() {
  const [repository, setRepository] = useState<LocalRepository | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void createLocalRepository()
      .then((created) => {
        if (!cancelled) {
          setRepository(created);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Local storage is unavailable in this browser session. You can still open Knit-Pro, but Pattern Projects cannot be saved until storage works.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="home">
        <header className="home-header">
          <div>
            <p className="brand">Knit-Pro</p>
            <h1>Pattern Projects</h1>
          </div>
        </header>
        <p className="storage-warning" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="home">
        <header className="home-header">
          <div>
            <p className="brand">Knit-Pro</p>
            <h1>Pattern Projects</h1>
          </div>
        </header>
        <p className="storage-warning" role="status">
          Opening local storage…
        </p>
      </div>
    );
  }

  return <App repository={repository} />;
}

createRoot(root).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
