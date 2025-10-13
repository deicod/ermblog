# Evaluation Report: Building a Blog Backend with erm

## Setup experience
- Installing the `erm` CLI required fetching a newer Go toolchain; `go install github.com/deicod/erm/cmd/erm@latest` pulled Go 1.25.2 and spent noticeable time compiling before the binary became available. 【bcd2c1†L1-L4】【0d07f5†L1-L2】
- The default project skeleton needs `erm graphql init` followed by `erm gen`, but the first generation attempt failed because gqlgen dependencies were absent; a manual `go mod tidy` was necessary before regeneration could proceed. 【cf04eb†L1-L1】【a10e00†L1-L6】【682269†L1-L5】

## Strengths observed
- Schema definitions stay concise. One file describes fields, indexes, query helpers, and GraphQL annotations for each entity (e.g., `User`, `Post`, `Comment`, `Tag`, `Category`), and `erm gen` propagates them across ORM, migrations, and GraphQL layers. 【F:schema/User.schema.go†L5-L68】【F:schema/Post.schema.go†L5-L68】【F:schema/Comment.schema.go†L5-L58】【F:schema/Tag.schema.go†L5-L55】【F:schema/Category.schema.go†L5-L54】
- Generated migrations include extension toggles, computed column DDL, foreign keys, and enum `CHECK` constraints, delivering a ready-to-apply schema for the blog domain. 【F:migrations/20251013083446_postgis.sql†L4-L115】
- The GraphQL layer ships with a full Relay schema, CRUD mutations, pagination, and subscription hooks without extra wiring. Enumerations surface in the schema and inputs automatically. 【F:graphql/schema.graphqls†L27-L200】
- Resolver stubs convert between GraphQL enums and the string-backed ORM fields, expose lifecycle hooks, and publish subscription events, making it easy to insert custom logic. 【F:graphql/resolvers/entities_gen.go†L1933-L1987】【F:graphql/resolvers/entities_gen.go†L2178-L2199】
- Support code for metrics and OIDC claims is scaffolded, so instrumentation and auth directives can be layered in without additional plumbing. 【F:observability/metrics/metrics.go†L5-L61】【F:oidc/claims.go†L5-L35】

## Weaknesses & issues encountered
- `erm gen` initially failed with "UserRole is incompatible with string" and complained that generated ORM types didn't satisfy the GraphQL `Node` interface. The out-of-the-box gqlgen configuration attempted to autobind directly to the ORM models, which are plain strings for enums. Removing the autobind entry (resulting in the generated `autobind: []`) allowed generation to succeed, but this workaround is undocumented and surprising. 【d775c6†L1-L5】【F:graphql/gqlgen.yml†L70-L129】
- Trying to give enum fields a custom Go type by tweaking the schema (e.g., assigning `field.GoType`) caused the parser to reject the schema with "expected dsl.Field, got string", so there is no ergonomic way to share strong enum types across layers today. 【53daae†L1-L3】
- The generator depends on prior `go mod tidy` runs; without them, it errors out during dependency download. Automating this step or surfacing a clearer instruction would smooth the workflow. 【a10e00†L1-L6】【682269†L1-L5】
- Runtime requirements (Go 1.25.2 toolchain download) prolong the first setup and could be prohibitive in constrained environments. A lighter-weight binary distribution or cache would improve onboarding. 【0d07f5†L1-L2】

## Suggestions for improvement
1. Update `erm gen` to run or prompt for `go mod tidy` when dependencies are missing, preventing the opaque "module not a known dependency" failure on fresh projects. 【a10e00†L1-L6】
2. Adjust the generated gqlgen config so enums map cleanly without manual edits—either generate wrapper models by default (as in the final `autobind: []` setup) or synthesize typed enums in the ORM to satisfy autobind automatically. 【d775c6†L1-L5】【F:graphql/gqlgen.yml†L70-L129】
3. Provide an official escape hatch for customizing field Go types (for example, a `WithGoType` modifier) so teams can share domain-specific enums without the parser rejecting their schema. 【53daae†L1-L3】
4. Offer prebuilt binaries or cache the toolchain download to reduce the initial wait time when installing `erm`. 【0d07f5†L1-L2】
