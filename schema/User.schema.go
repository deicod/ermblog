package schema

import "github.com/deicod/erm/orm/dsl"

// User models the User domain entity.
type User struct{ dsl.Schema }

func (User) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("username").NotEmpty().Unique(),
		dsl.String("email").NotEmpty().Unique(),
		dsl.String("name").Optional(),
		dsl.Text("bio").Optional(),
		dsl.String("avatar_url").Optional(),
		dsl.Text("display_name").
			Computed(dsl.Computed(dsl.Expression("COALESCE(name, username)", "name", "username"))),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (User) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToMany("posts", "Post").Ref("author_id"),
		dsl.ToMany("comments", "Comment").Ref("author_id"),
	}
}

func (User) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("users_username_unique").On("username").Unique(),
		dsl.Idx("users_email_unique").On("email").Unique(),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (User) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("username", dsl.OpEqual).Named("UsernameEq"),
			dsl.NewPredicate("email", dsl.OpILike).Named("EmailILike"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
			dsl.OrderBy("username", dsl.SortAsc).Named("UsernameAsc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		)
}

// Annotations enable code generators like GraphQL to understand additional metadata.
func (User) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.GraphQL("User",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
