# Environment Variables and Configuration

Operations teams can toggle transport features and override runtime endpoints without touching the codebase.

## GraphQL API

| Setting | Source | Description |
| --- | --- | --- |
| `graphql.subscriptions.enabled` | `erm.yaml` | Enables subscription support in the generated API. |
| `graphql.subscriptions.websocket` | `erm.yaml` | Activates the WebSocket listener alongside HTTP. |
| `graphql.subscriptions.graphql_ws` | `erm.yaml` | Turns on the `graphql-ws` protocol implementation. |
| `VITE_GRAPHQL_HTTP_ENDPOINT` | SPA environment | Overrides the HTTP endpoint used by Relay in the management app. |
| `VITE_GRAPHQL_HTTP_MAX_RETRIES` | SPA environment | Maximum retry attempts for HTTP operations. |
| `VITE_GRAPHQL_HTTP_RETRY_DELAY_MS` | SPA environment | Delay between HTTP retries in milliseconds. |
| `VITE_GRAPHQL_WS_ENDPOINT` | SPA environment | WebSocket endpoint used for GraphQL subscriptions. |
| `VITE_GRAPHQL_WS_MAX_RETRIES` | SPA environment | Maximum reconnect attempts for the WebSocket client. |
| `VITE_GRAPHQL_WS_RETRY_DELAY_MS` | SPA environment | Delay between WebSocket reconnect attempts in milliseconds. |

Set the `VITE_…` variables in your build or container environment so the management SPA can reach the correct backends. Combine them with the `graphql.subscriptions` flags to enable end-to-end subscriptions when the API exposes the WebSocket transport.
