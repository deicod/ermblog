# Evaluation of building a blog backend with ERM + gqlgen

## Context
- Goal: implement a typical blog backend (users, posts, comments, tags, categories, post-tag pivot) using ERM's schema-first workflow and generated gqlgen server.
- Starting point: schema definitions under `schema/` with generated ORM, GraphQL schema/resolvers, migrations, and helper packages copied from upstream ERM repo (dataloaders, relay, directives, subscriptions, server harness).
- Environment: Go 1.22, PostgreSQL (via generated migrations), gqlgen + ERM tooling.

## Strengths observed
1. **Single source schema** – Defining entities in `schema/*.schema.go` lets ERM generate ORM models, GraphQL types, resolvers, and migrations in one step, keeping shapes aligned without hand-maintaining multiple schemas.
2. **GraphQL pagination primitives included** – Generated resolvers and the bundled relay helpers give forward/backward pagination out of the box, saving time compared to wiring gqlgen connections manually.
3. **Dataloaders and subscription scaffolding** – The copied packages (dataloaders, subscriptions, directives) integrate cleanly with the generated resolvers, showing that ERM can provide batteries-included modules once distributed with the framework.

## Weaknesses & friction points
1. **Generated Go casing mismatches** – The GraphQL API uses camelCase names (`PostID`, `AvatarURL`), but the generated resolver code expected lower camel case fields (`PostId`, `AvatarUrl`) on the inputs. This broke compilation and required manual edits in `graphql/resolvers/entities_gen.go` that will be lost on regeneration. The generator should consistently translate between GraphQL and Go naming conventions.
2. **Manual patching of generated code** – Fixes for casing, nullable conversions, and ID decoding land in generated files. Without extension hooks or partial files, regenerating would overwrite these fixes, making iteration brittle.
3. **Nullable handling via zero-value heuristics** – Optional strings/timestamps in ORM models are emitted as non-nullable Go types, forcing helper functions like `nullableString` to treat empty strings or zero times as `nil`. This loses the ability to distinguish “empty string” from “not provided” and can erase legitimate data.
4. **Migration ordering bugs** – The generated SQL declares foreign keys to tables before those tables exist (e.g., `comments` references `users`/`posts` before `users` and `posts` are defined). Running the migration against PostgreSQL fails unless the statements are reordered or split. Extra synthetic columns (`parent`, `post` in `comments`; `post`, `tag` in `post_tags`) also appear, suggesting incomplete cleanup of edge metadata during SQL generation.
5. **Missing runtime packages** – The GraphQL server could not compile until dataloader, relay, directives, subscription, and server harness code was copied from the upstream repo. These should ship as reusable modules or be generated alongside the ORM/resolver code; otherwise new adopters must hunt for internal packages.
6. **Lack of guidance on environment wiring** – Bootstrapping `cmd/api/main.go` required bespoke setup (database connection, HTTP mux, loader injection). Providing templates or CLI scaffolding would reduce the amount of manual glue needed to serve the generated API.
7. **Slow generator feedback loop** – Because fixes involve editing generated files, the workflow becomes regenerate → reapply patches → re-run tests. This discourages iterating on the schema and increases risk of merge conflicts.

## Suggestions for improvement
1. **Normalize naming across layers** – Update the generator so GraphQL inputs/output structs expose Go-friendly `ID`/`URL` suffixes while ORM models keep snake_case column tags. Resolver generation should use the correct GraphQL field names automatically.
2. **Expose customization hooks** – Allow user-defined partials or resolver overrides without editing generated files (e.g., via `//go:generate` templates, embedding, or resolver interfaces). Keep generated files auto-managed.
3. **Improve nullable semantics** – Generate pointer fields (e.g., `*string`, `*time.Time`) for optional columns or support `sql.Null*` types so GraphQL resolvers can faithfully represent absent vs. empty values.
4. **Fix migration emission** – Ensure tables are created before foreign keys reference them and avoid emitting duplicate helper columns for edges. Consider splitting schema generation into deterministic order or using `ALTER TABLE ... ADD CONSTRAINT` after all referenced tables exist.
5. **Bundle supporting packages** – Publish the GraphQL server glue (dataloaders, subscriptions, directives) as part of ERM’s module so new projects can import them directly instead of copying source.
6. **Provide application scaffolding** – Offer a CLI command (e.g., `erm init api`) that generates a runnable `cmd/api` with health checks, middleware hooks, and configuration placeholders to accelerate adoption.
7. **Document regeneration workflow** – Clarify in the docs how to preserve custom logic across `erm gen` runs (if intended) or how to structure code to avoid modifying generated sources.

## Overall impression
ERM’s promise of “define schema once, get ORM + GraphQL + migrations” is compelling and largely realized for the happy path. However, the current developer experience still demands significant manual intervention to get a runnable gqlgen backend. Addressing the naming bugs, improving nullable support, stabilizing migrations, and delivering official runtime packages would materially improve reliability and approachability for teams adopting ERM.
