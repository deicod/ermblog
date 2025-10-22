Plan
Phase 1 – Front-end foundation and tooling
Adopt the existing Vite + React + Relay toolchain by wiring pnpm/npm scripts (dev, relay, build) into the DX checklist and configuring linting/formatting rules across the management app.

Keep the Relay environment provider as the top-level wrapper in main.tsx, but replace the demo App.tsx content with a routed shell, global layout primitives, and shared providers (theme, toasts, error boundaries).

Introduce module resolution aliases, design tokens, and storybook-style component documentation while the surface area is still small.

Phase 2 – GraphQL transport and caching
Parameterise RelayEnvironment to read the GraphQL endpoint from environment/config, attach auth headers, surface network errors, and reuse the same environment in tests; keep the POST transport but expose hooks for websocket subscriptions.

Mirror server configuration (/graphql path, dataloader wiring) in client-side constants and developer docs so local and deployed environments stay in sync.

Lean on the generated dataloader layer and metrics hooks when writing new resolvers so list/detail views stay performant as Relay prefetches associations.

Phase 3 – Authentication and route protection
Implement an OIDC PKCE login flow that honours the issuer/audience configured in erm.yaml, persists tokens securely, and exposes a session context the SPA can consume.

On the Go API, add middleware that validates incoming tokens, extracts roles, and injects them into the request context so @auth and @auth(roles: …) directives work end to end.

Create guarded routes, logout flows, and session refresh logic on the SPA; ensure Relay requests include the bearer token automatically.

Phase 4 – Application shell and navigation
Model navigation around the GraphQL entry points (node, typed queries, and Relay-style connections) so users can jump between content types quickly and benefit from cursor pagination out of the box.

Add persistent chrome (sidebar, breadcrumb, user menu) with responsive breakpoints and skeleton states for slow queries.

Phase 5 – Feature modules
Dashboard: Aggregate totalCount fields from the various connections (posts, comments, media, taxonomies, users) into a snapshot view with trend charts and quick filters.

Post management: Build list, filter, and search experiences on top of the post query/mutation API, including editing flows that cover title, slug, status/type enums, SEO JSON, relationships to media and taxonomies, and publish scheduling.

Comment moderation: Provide inbox-style queues keyed by status, inline moderation controls, threading indicators, and bulk actions, driven by the comment queries/mutations and status enum.

Taxonomy management: Surface category hierarchies (parent/child) and tag maintenance with slug validation, drawing from the category/tag schemas and their connection queries.

Media library: Implement upload (to storage service), metadata editing, and selection dialogs that populate post featured media, aligned with the media type and mutations (file metadata, captions, etc.).

Site options: Expose a settings area that edits JSON-backed options with validation and preview, respecting autoload flags and uniqueness constraints.

Users & roles: Deliver admin tooling for account creation, profile edits, role assignment, and capability JSON management, including password resets or SSO linking as needed.

Phase 6 – Real-time collaboration and notifications
Enable websocket transports server-side and client-side so Relay can subscribe to comment/post/role/user events, powering live updates, toast notifications, and optimistic UI refreshes.

Add subscription-aware caches (e.g., updating Relay stores on create/update/delete) and configurable notification rules per user.

Phase 7 – Quality, observability, and testing
Instrument GraphQL operations and dataloader batches via the provided collector interfaces, exporting metrics to whatever stack replaces the current NoopCollector placeholder.

Establish unit/integration tests for resolvers, component tests for critical forms, and end-to-end tests that cover auth, editorial workflows, and regression paths.

Phase 8 – Deployment and developer experience
Extend the existing build scripts so CI runs linting, Relay compilation, and type checks before packaging the SPA; produce a versioned artifact ready for CDN or reverse-proxy hosting alongside the Go API.

Document environment variables (GraphQL URL, OIDC client IDs, storage endpoints) and provide container/docker-compose recipes so contributors can spin up the full stack quickly.

