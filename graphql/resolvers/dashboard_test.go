package resolvers

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/99designs/gqlgen/client"
	gqlgraphql "github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"

	graphqlpkg "github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/directives"
	"github.com/deicod/ermblog/oidc"
)

type stubCounter struct {
	value int
	err   error
	calls int
}

func (s *stubCounter) Count(ctx context.Context) (int, error) {
	s.calls++
	if s.err != nil {
		return 0, s.err
	}
	return s.value, nil
}

func withContext(ctx context.Context) client.Option {
	return func(request *client.Request) {
		request.HTTP = request.HTTP.WithContext(ctx)
	}
}

func TestManagementStatsAggregatesCounts(t *testing.T) {
	posts := &stubCounter{value: 7}
	comments := &stubCounter{value: 3}
	media := &stubCounter{value: 11}
	categories := &stubCounter{value: 5}
	tags := &stubCounter{value: 2}
	users := &stubCounter{value: 4}
	resolver := &Resolver{
		postsCounter:      posts,
		commentsCounter:   comments,
		mediaItemsCounter: media,
		categoriesCounter: categories,
		tagsCounter:       tags,
		usersCounter:      users,
	}

	stats, err := resolver.Query().ManagementStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats == nil {
		t.Fatal("expected stats, got nil")
	}

	if stats.Posts != 7 {
		t.Fatalf("expected 7 posts, got %d", stats.Posts)
	}

	if stats.Comments != 3 {
		t.Fatalf("expected 3 comments, got %d", stats.Comments)
	}

	if stats.MediaItems != 11 {
		t.Fatalf("expected 11 media items, got %d", stats.MediaItems)
	}

	if stats.Taxonomies != 7 {
		t.Fatalf("expected 7 taxonomies (5 categories + 2 tags), got %d", stats.Taxonomies)
	}

	if stats.Users != 4 {
		t.Fatalf("expected 4 users, got %d", stats.Users)
	}

	for name, stub := range map[string]*stubCounter{
		"posts":      posts,
		"comments":   comments,
		"media":      media,
		"categories": categories,
		"tags":       tags,
		"users":      users,
	} {
		if stub.calls != 1 {
			t.Fatalf("expected %s counter to be invoked once, got %d", name, stub.calls)
		}
	}
}

func TestManagementStatsDefaultsToZeroWithoutRepositories(t *testing.T) {
	resolver := &Resolver{}

	stats, err := resolver.Query().ManagementStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats.Posts != 0 || stats.Comments != 0 || stats.MediaItems != 0 || stats.Taxonomies != 0 || stats.Users != 0 {
		t.Fatalf("expected zeroed stats, got %#v", stats)
	}
}

func TestManagementStatsPropagatesCountErrors(t *testing.T) {
	expected := "boom"
	resolver := &Resolver{
		postsCounter: &stubCounter{err: errors.New(expected)},
	}

	stats, err := resolver.Query().ManagementStats(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if !strings.Contains(err.Error(), expected) {
		t.Fatalf("expected error to contain %q, got %v", expected, err)
	}

	if stats != nil {
		t.Fatalf("expected nil stats on error, got %#v", stats)
	}
}

func TestManagementStatsRequiresAuthDirective(t *testing.T) {
	resolver := NewWithOptions(Options{})
	cfg := graphqlpkg.Config{Resolvers: resolver, Directives: graphqlpkg.DirectiveRoot{
		Auth: func(ctx context.Context, obj interface{}, next gqlgraphql.Resolver, roles []string) (interface{}, error) {
			handler := directives.RequireAuth()
			if len(roles) > 0 {
				handler = directives.RequireRoles(roles)
			}
			return handler(ctx, obj, func(ctx context.Context) (interface{}, error) {
				return next(ctx)
			})
		},
	}}

	exec := graphqlpkg.NewExecutableSchema(cfg)
	gqlClient := client.New(handler.NewDefaultServer(exec))

	var resp struct{}
	err := gqlClient.Post(`query { managementStats { posts } }`, &resp)
	if err == nil {
		t.Fatal("expected auth error, got nil")
	}

	if !strings.Contains(err.Error(), "unauthorized") {
		t.Fatalf("expected unauthorized error, got %v", err)
	}
}

func TestManagementStatsReturnsCountsWhenAuthorized(t *testing.T) {
	resolver := NewWithOptions(Options{})
	resolver.postsCounter = &stubCounter{value: 9}
	resolver.commentsCounter = &stubCounter{value: 4}
	resolver.mediaItemsCounter = &stubCounter{value: 6}
	resolver.categoriesCounter = &stubCounter{value: 1}
	resolver.tagsCounter = &stubCounter{value: 2}
	resolver.usersCounter = &stubCounter{value: 5}

	cfg := graphqlpkg.Config{Resolvers: resolver, Directives: graphqlpkg.DirectiveRoot{
		Auth: func(ctx context.Context, obj interface{}, next gqlgraphql.Resolver, roles []string) (interface{}, error) {
			handler := directives.RequireAuth()
			if len(roles) > 0 {
				handler = directives.RequireRoles(roles)
			}
			return handler(ctx, obj, func(ctx context.Context) (interface{}, error) {
				return next(ctx)
			})
		},
	}}

	exec := graphqlpkg.NewExecutableSchema(cfg)
	gqlClient := client.New(handler.NewDefaultServer(exec))

	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-1"})

	var resp struct {
		ManagementStats struct {
			Posts      int
			Comments   int
			MediaItems int
			Taxonomies int
			Users      int
		}
	}

	if err := gqlClient.Post(`query { managementStats { posts comments mediaItems taxonomies users } }`, &resp, withContext(ctx)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	stats := resp.ManagementStats
	if stats.Posts != 9 || stats.Comments != 4 || stats.MediaItems != 6 || stats.Taxonomies != 3 || stats.Users != 5 {
		t.Fatalf("unexpected stats: %#v", stats)
	}
}
