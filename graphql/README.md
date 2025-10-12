# GraphQL workspace

This directory will hold gqlgen configuration, generated schema stubs, and
resolver implementations.

Run 'erm graphql init' to scaffold gqlgen, then wire the generated handler into
'cmd/api/main.go'.

The recommended workflow is:

1. Define or update schema entities under 'schema/'.
2. Execute 'erm gen' to refresh ORM, GraphQL, and migration assets.
3. Implement resolver logic and keep tests under 'graphql' up to date.
