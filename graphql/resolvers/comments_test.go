package resolvers

import (
	"context"
	"sort"
	"testing"
	"time"

	graphqlpkg "github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/relay"
	"github.com/deicod/ermblog/orm/gen"
)

type stubCommentRepository struct {
	records []*gen.Comment
}

func (s *stubCommentRepository) Query() commentQuery {
	return &stubCommentQuery{records: append([]*gen.Comment(nil), s.records...)}
}

type stubCommentQuery struct {
	records []*gen.Comment
	limit   *int
	offset  int
	status  *string
	ordered bool
}

func (q *stubCommentQuery) Limit(n int) commentQuery {
	if n > 0 {
		q.limit = &n
	} else {
		q.limit = nil
	}
	return q
}

func (q *stubCommentQuery) Offset(n int) commentQuery {
	if n >= 0 {
		q.offset = n
	}
	return q
}

func (q *stubCommentQuery) WhereStatusEq(value string) commentQuery {
	q.status = &value
	return q
}

func (q *stubCommentQuery) OrderBySubmittedAtDesc() commentQuery {
	q.ordered = true
	return q
}

func (q *stubCommentQuery) filtered() []*gen.Comment {
	filtered := make([]*gen.Comment, 0, len(q.records))
	for _, record := range q.records {
		if record == nil {
			continue
		}
		if q.status != nil && record.Status != *q.status {
			continue
		}
		filtered = append(filtered, record)
	}
	if q.ordered {
		sort.SliceStable(filtered, func(i, j int) bool {
			return filtered[i].SubmittedAt.After(filtered[j].SubmittedAt)
		})
	}
	return filtered
}

func (q *stubCommentQuery) All(ctx context.Context) ([]*gen.Comment, error) {
	filtered := q.filtered()
	start := q.offset
	if start > len(filtered) {
		start = len(filtered)
	}
	end := len(filtered)
	if q.limit != nil && start+*q.limit < end {
		end = start + *q.limit
	}
	return filtered[start:end], nil
}

func (q *stubCommentQuery) Count(ctx context.Context) (int, error) {
	return len(q.filtered()), nil
}

func TestQueryCommentsFiltersAndOrdersResults(t *testing.T) {
	now := time.Now().UTC()
	approved := &gen.Comment{
		ID:          "comment-1",
		Content:     "Great insights!",
		Status:      string(graphqlpkg.CommentStatusApproved),
		SubmittedAt: now.Add(-1 * time.Hour),
	}
	pending := &gen.Comment{
		ID:          "comment-2",
		Content:     "Awaiting review",
		Status:      string(graphqlpkg.CommentStatusPending),
		SubmittedAt: now.Add(-30 * time.Minute),
	}
	recentApproved := &gen.Comment{
		ID:          "comment-3",
		Content:     "Latest update",
		Status:      string(graphqlpkg.CommentStatusApproved),
		SubmittedAt: now,
	}

	resolver := &Resolver{commentRepo: &stubCommentRepository{records: []*gen.Comment{approved, pending, recentApproved}}}

	conn, err := resolver.Query().Comments(context.Background(), intPtr(2), nil, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if conn == nil {
		t.Fatal("expected connection, got nil")
	}

	if conn.TotalCount != 3 {
		t.Fatalf("expected total count 3, got %d", conn.TotalCount)
	}

	edges := conn.Edges
	if len(edges) != 2 {
		t.Fatalf("expected 2 edges, got %d", len(edges))
	}

	first := edges[0].Node
	second := edges[1].Node

	if first == nil || second == nil {
		t.Fatalf("expected non-nil nodes, got %#v", edges)
	}

	if _, native, err := relay.FromGlobalID(first.ID); err != nil {
		t.Fatalf("failed to decode first id: %v", err)
	} else if native != recentApproved.ID {
		t.Fatalf("expected most recent comment first, got %s", native)
	}

	if _, native, err := relay.FromGlobalID(second.ID); err != nil {
		t.Fatalf("failed to decode second id: %v", err)
	} else if native != pending.ID {
		t.Fatalf("expected second most recent comment, got %s", native)
	}
}

func intPtr(v int) *int {
	return &v
}
