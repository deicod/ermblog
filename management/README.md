# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Runtime configuration

The Relay environment reads its transport settings from environment variables so you can point the SPA at different backends without rebuilding:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_GRAPHQL_HTTP_ENDPOINT` | HTTP endpoint for GraphQL queries and mutations. | `http://localhost:8080/graphql` |
| `VITE_GRAPHQL_HTTP_MAX_RETRIES` | Retry attempts for HTTP requests. | `1` |
| `VITE_GRAPHQL_HTTP_RETRY_DELAY_MS` | Delay between HTTP retries in milliseconds. | `250` |
| `VITE_GRAPHQL_WS_ENDPOINT` | WebSocket endpoint for subscriptions. | `ws://localhost:8080/graphql` |
| `VITE_GRAPHQL_WS_MAX_RETRIES` | Reconnect attempts for the WebSocket client. | `5` |
| `VITE_GRAPHQL_WS_RETRY_DELAY_MS` | Delay between WebSocket reconnect attempts in milliseconds. | `500` |
| `VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED` | Toggle to enable/disable SPA subscription transports independent of the API config. | `true` |

When the API enables subscriptions (`graphql.subscriptions` in `erm.yaml`, including the transport-specific flags), set the corresponding `VITE_…` variables in your shell or `.env` file before running `pnpm dev` so Relay can negotiate the WebSocket connection, or set `VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED=false` to keep the SPA operating over HTTP only.
