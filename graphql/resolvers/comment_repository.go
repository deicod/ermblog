package resolvers

import (
	"context"

	"github.com/deicod/ermblog/orm/gen"
)

type commentRepository interface {
	Query() commentQuery
}

type commentQuery interface {
	Limit(int) commentQuery
	Offset(int) commentQuery
	WhereStatusEq(string) commentQuery
	OrderBySubmittedAtDesc() commentQuery
	All(context.Context) ([]*gen.Comment, error)
	Count(context.Context) (int, error)
}

type commentRepositoryAdapter struct {
	client *gen.CommentClient
}

func newCommentRepository(client *gen.CommentClient) commentRepository {
	if client == nil {
		return nil
	}
	return &commentRepositoryAdapter{client: client}
}

func (a *commentRepositoryAdapter) Query() commentQuery {
	if a == nil || a.client == nil {
		return nil
	}
	return &commentQueryAdapter{inner: a.client.Query()}
}

type commentQueryAdapter struct {
	inner *gen.CommentQuery
}

func (a *commentQueryAdapter) Limit(n int) commentQuery {
	if a == nil || a.inner == nil {
		return a
	}
	a.inner = a.inner.Limit(n)
	return a
}

func (a *commentQueryAdapter) Offset(n int) commentQuery {
	if a == nil || a.inner == nil {
		return a
	}
	a.inner = a.inner.Offset(n)
	return a
}

func (a *commentQueryAdapter) WhereStatusEq(value string) commentQuery {
	if a == nil || a.inner == nil {
		return a
	}
	a.inner = a.inner.WhereStatusEq(value)
	return a
}

func (a *commentQueryAdapter) OrderBySubmittedAtDesc() commentQuery {
	if a == nil || a.inner == nil {
		return a
	}
	a.inner = a.inner.OrderBySubmittedAtDesc()
	return a
}

func (a *commentQueryAdapter) All(ctx context.Context) ([]*gen.Comment, error) {
	if a == nil || a.inner == nil {
		return nil, nil
	}
	return a.inner.All(ctx)
}

func (a *commentQueryAdapter) Count(ctx context.Context) (int, error) {
	if a == nil || a.inner == nil {
		return 0, nil
	}
	return a.inner.Count(ctx)
}
