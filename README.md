# Welcome to your erm project

This workspace was bootstrapped with 'erm init'. The goal of the generated
skeleton is to give you a runnable HTTP service, a place to define your schema,
and a repeatable workflow for regenerating code as your domain evolves.

## Next steps

1. Initialize your Go module and align 'erm.yaml':
       go mod init <module>
       go mod tidy
   Update 'module' in 'erm.yaml' to match the value passed to 'go mod init'.
2. Sketch your first entity with 'erm new <Entity>'.
3. Run 'erm gen' to materialize ORM, GraphQL, and migration artifacts.
4. Start the HTTP server with 'go run ./cmd/api' and iterate.

## Project layout

- 'cmd/api' — entrypoint for the HTTP server and integration glue.
- 'schema' — your application schema. Run 'erm gen' whenever it changes.
- 'graphql' — gqlgen configuration and generated resolvers.
- 'migrations' — versioned SQL migrations managed by 'erm gen'.

## Recommended workflow

1. Practice TDD: write or update tests alongside feature work.
2. Keep the code formatted with 'gofmt -w' on edited files.
3. Validate changes locally:
   - 'go test ./...'
   - 'go test -race ./...'
   - 'go vet ./...'
4. Regenerate artifacts with 'erm gen' and review the diff before committing.
5. Use 'erm migrate' to apply database changes during development.

Happy hacking!
