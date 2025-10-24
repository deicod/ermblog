package resolvers

import (
	"context"

	"github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/dataloaders"
)

func (r *Resolver) Post_author(ctx context.Context, obj *graphql.Post) (*graphql.User, error) {
	if obj == nil {
		return nil, nil
	}

	authorID := obj.AuthorID
	if authorID == "" {
		return nil, nil
	}

	if loaders := dataloaders.FromContext(ctx); loaders != nil {
		if loader := loaders.User(); loader != nil {
			user, err := loader.Load(ctx, authorID)
			if err != nil {
				return nil, err
			}
			return toGraphQLUser(user), nil
		}
	}

	if r.ORM == nil {
		return nil, nil
	}

	user, err := r.ORM.Users().ByID(ctx, authorID)
	if err != nil {
		return nil, err
	}
	return toGraphQLUser(user), nil
}
