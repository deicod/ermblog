package schema

import "github.com/deicod/erm/orm/dsl"

// User models the User domain entity.
type User struct{ dsl.Schema }

func (User) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.VarChar("username", 50).
			NotEmpty().
			UniqueConstraint(),
		dsl.VarChar("email", 320).
			NotEmpty().
			UniqueConstraint(),
		dsl.Text("slug").
			Computed(dsl.Computed(
				dsl.Expression("lower(regexp_replace(username, '[^a-z0-9]+', '-', 'g'))", "username"),
			)).
			UniqueConstraint(),
		dsl.Text("display_name").Optional(),
		dsl.Text("bio").Optional(),
		dsl.VarChar("avatar_url", 2048).Optional(),
		dsl.Enum("role", "READER", "AUTHOR", "EDITOR", "ADMIN").Default("READER"),
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
		dsl.Idx("users_slug_unique").On("slug").Unique(),
		dsl.Idx("users_role_created_at").On("role", "created_at"),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (User) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("username", dsl.OpEqual).Named("UsernameEq"),
			dsl.NewPredicate("username", dsl.OpILike).Named("UsernameILike"),
			dsl.NewPredicate("email", dsl.OpILike).Named("EmailILike"),
			dsl.NewPredicate("role", dsl.OpEqual).Named("RoleEq"),
			dsl.NewPredicate("created_at", dsl.OpGTE).Named("CreatedAfter"),
			dsl.NewPredicate("created_at", dsl.OpLTE).Named("CreatedBefore"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
			dsl.OrderBy("username", dsl.SortAsc).Named("UsernameAsc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		).
		WithDefaultLimit(50).
		WithMaxLimit(250)
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
