package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfigGraphQLSubscriptionsTransports(t *testing.T) {
	t.Parallel()

	yaml := `graphql:
  subscriptions:
    enabled: true
    transports:
      websocket: true
      graphql_ws: true
`

	dir := t.TempDir()
	path := filepath.Join(dir, "erm.yaml")
	if err := os.WriteFile(path, []byte(yaml), 0o600); err != nil {
		t.Fatalf("write temp config: %v", err)
	}

	cfg, err := loadConfig(path)
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if !cfg.GraphQL.Subscriptions.Enabled {
		t.Fatal("expected subscriptions to be enabled")
	}

	if !cfg.GraphQL.Subscriptions.Transports.Websocket {
		t.Fatal("expected websocket transport to be enabled")
	}

	if !cfg.GraphQL.Subscriptions.Transports.GraphQLWS {
		t.Fatal("expected graphql-ws transport to be enabled")
	}
}
