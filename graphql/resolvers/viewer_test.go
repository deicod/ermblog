package resolvers

import (
	"context"
	"errors"
	"testing"

	"github.com/deicod/ermblog/oidc"
	"github.com/deicod/ermblog/orm/gen"
)

type stubUserProvider struct {
	byID   func(ctx context.Context, id string) (*gen.User, error)
	lastID string
}

func (s *stubUserProvider) ByID(ctx context.Context, id string) (*gen.User, error) {
	s.lastID = id
	if s.byID == nil {
		return nil, nil
	}
	return s.byID(ctx, id)
}

func TestQueryViewerReturnsNilWithoutClaims(t *testing.T) {
	resolver := &Resolver{}
	viewer, err := resolver.Query().Viewer(context.Background())
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if viewer != nil {
		t.Fatalf("expected nil viewer, got %#v", viewer)
	}
}

func TestQueryViewerReturnsUserRecord(t *testing.T) {
	stub := &stubUserProvider{}
	resolver := &Resolver{users: stub}

	username := "alice"
	avatar := "https://example.com/alice.png"
	stub.byID = func(ctx context.Context, id string) (*gen.User, error) {
		return &gen.User{
			ID:        "user-1",
			Username:  username,
			Email:     "alice@example.com",
			AvatarURL: &avatar,
		}, nil
	}

	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-1"})

	viewer, err := resolver.Query().Viewer(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stub.lastID != "user-1" {
		t.Fatalf("expected lookup by subject, got %q", stub.lastID)
	}

	if viewer == nil {
		t.Fatal("expected viewer, got nil")
	}

	if viewer.ID != "user-1" {
		t.Errorf("unexpected id: %s", viewer.ID)
	}

	if viewer.DisplayName == nil || *viewer.DisplayName != username {
		t.Errorf("expected display name %q, got %v", username, viewer.DisplayName)
	}

	if viewer.Email == nil || *viewer.Email != "alice@example.com" {
		t.Errorf("expected email alice@example.com, got %v", viewer.Email)
	}

	if viewer.AvatarURL == nil || *viewer.AvatarURL != avatar {
		t.Errorf("expected avatar %q, got %v", avatar, viewer.AvatarURL)
	}
}

func TestQueryViewerSynthesizesFromClaims(t *testing.T) {
	resolver := &Resolver{users: &stubUserProvider{}}
	claims := oidc.Claims{
		Subject: "user-2",
		Name:    "Ada Lovelace",
		Email:   "ada@example.com",
		Raw: map[string]any{
			"picture": "https://example.com/ada.png",
		},
	}
	ctx := oidc.ToContext(context.Background(), claims)

	viewer, err := resolver.Query().Viewer(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if viewer == nil {
		t.Fatal("expected viewer, got nil")
	}

	if viewer.ID != "user-2" {
		t.Errorf("unexpected id: %s", viewer.ID)
	}

	if viewer.DisplayName == nil || *viewer.DisplayName != "Ada Lovelace" {
		t.Errorf("expected display name from claims, got %v", viewer.DisplayName)
	}

	if viewer.Email == nil || *viewer.Email != "ada@example.com" {
		t.Errorf("expected email from claims, got %v", viewer.Email)
	}

	if viewer.AvatarURL == nil || *viewer.AvatarURL != "https://example.com/ada.png" {
		t.Errorf("expected avatar from claims, got %v", viewer.AvatarURL)
	}
}

func TestQueryViewerPropagatesLookupError(t *testing.T) {
	expectedErr := errors.New("boom")
	stub := &stubUserProvider{byID: func(ctx context.Context, id string) (*gen.User, error) {
		return nil, expectedErr
	}}
	resolver := &Resolver{users: stub}

	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-3"})

	viewer, err := resolver.Query().Viewer(ctx)
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
	if viewer != nil {
		t.Fatalf("expected nil viewer on error, got %#v", viewer)
	}
}

func TestQueryViewerIgnoresEmptySubject(t *testing.T) {
	resolver := &Resolver{users: &stubUserProvider{}}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: ""})
	viewer, err := resolver.Query().Viewer(ctx)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if viewer != nil {
		t.Fatalf("expected nil viewer, got %#v", viewer)
	}
}
