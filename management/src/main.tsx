import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment, createSubscribeFn } from "./RelayEnvironment";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { SessionProvider } from "./session/SessionProvider";
import { ErrorBoundaryProvider } from "./providers/ErrorBoundaryProvider";

const relayEnvironment = createRelayEnvironment({
  subscribe: createSubscribeFn(),
});

createRoot(document.getElementById("root")!).render(
  <RelayEnvironmentProvider environment={relayEnvironment}>
    <SessionProvider>
      <StrictMode>
        <ErrorBoundaryProvider>
          <App />
        </ErrorBoundaryProvider>
      </StrictMode>
    </SessionProvider>
  </RelayEnvironmentProvider>
);
