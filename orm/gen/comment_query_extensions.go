package gen

import "github.com/deicod/erm/orm/runtime"

// OrderBySubmittedAtDesc sorts comments by submitted_at descending.
func (q *CommentQuery) OrderBySubmittedAtDesc() *CommentQuery {
	if q == nil {
		return q
	}
	q.orders = append(q.orders, runtime.Order{Column: "submitted_at", Direction: runtime.SortDesc})
	return q
}
