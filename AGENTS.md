# Development Workflow

When contributing to this workspace:

1. Follow TDD — add or update tests before changing behavior.
2. Keep formatting clean: run 'gofmt -w' on touched Go files.
3. Before pushing a branch, validate with:
   - 'go test ./...'
   - 'go test -race ./...'
   - 'go vet ./...'
4. Regenerate code after schema changes with 'erm gen' and commit the results.
5. Prefer small, reviewable commits and document notable workflows in the repo.
