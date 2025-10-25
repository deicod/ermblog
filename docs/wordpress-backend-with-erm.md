# WordPress-Style Backend with erm

This document captures the journey of modelling a WordPress-inspired content backend with [`erm`](https://github.com/deicod/erm) and documents rough edges encountered along the way.

## Domain modelling recap

The backend mirrors familiar WordPress concepts:

- **Users & Roles** — account profiles with optional bios, avatars, and capability bundles. Roles own a JSON capability map and a join table is generated to support multi-role assignments. The management UI now captures passwords as plaintext in the user dialog and relies on server-side bcrypt hashing before persisting the credential, so administrators never handle hashed values directly.
- **Posts** — a single entity handles posts, pages, and custom post types via enum fields. Each post tracks author, featured media, SEO JSON, status/type enums, and relationships to taxonomies, media, and comments.
- **Taxonomies** — hierarchical categories (self-referencing parent edge) and flat tags. Both expose many-to-many edges via generated join tables.
- **Comments** — threaded comments support guest metadata, workflow status enum, and standard moderation timestamps.
- **Media** — uploaded assets with metadata, captions, and reverse lookups for featured usage.
- **Options** — key/value configuration stored as JSON with autoload flags.

Running `erm gen` after defining these schemas produced:

- GraphQL schema and resolver scaffolding for each entity with subscriptions enabled on content-heavy types.
- ORM models and registry code with strongly typed enums and relationships.
- A full migration set that creates base tables, join tables, and foreign-key indexes for the WordPress-style domain.

## Workflow notes

1. Set the module name in `erm.yaml` and generated `go.mod` to `github.com/deicod/ermblog`.
2. Modelled the domain in `schema/*.schema.go` files, leaning on enums for post/comment workflow states and JSONB fields for flexible metadata (SEO, capabilities, option values).
3. Regenerated artifacts with:
   ```bash
   erm gen --dry-run --diff
   erm gen
   ```
   The dry run was instrumental in reviewing the migration footprint before writing files.
4. Validated the code with:
   ```bash
   go test ./...
   go test -race ./...
   go vet ./...
   ```

## Improvements that would help

- **GraphQL helper discovery** — the docs reference `dsl.GraphQLRelayConnection()`, but the function is not available in the released generator, causing `unsupported dsl function` errors. Clarifying the available GraphQL helpers or gating docs per release would avoid confusion.
- **BigInt Go type resolution** — using `dsl.BigInt` yielded `modelgen: package cannot be nil in FindObject for type: int64`. Falling back to `dsl.Integer` worked, but the error message makes it unclear whether the issue is a bug or misconfiguration. Better diagnostics (or ensuring built-ins like `int64` resolve) would smooth the modelling experience.
- **Long generation output** — large migration batches generate dozens of files. A summary that groups related statements (for example, `post_*` migrations) would make reviews easier.

Despite the hiccups, the DSL made it straightforward to translate WordPress concepts into strongly typed Go + GraphQL models ready for future management and presentation layers.

