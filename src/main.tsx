import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./index.css";
import { createLocalRepository } from "./repository/local-repository";

registerSW({ immediate: true });

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const repository = await createLocalRepository();

createRoot(root).render(
  <StrictMode>
    <App repository={repository} />
  </StrictMode>,
);
