package schema

import "github.com/deicod/erm/orm/dsl"

// Role captures WordPress-style capability bundles such as administrator, editor, or subscriber.
type Role struct{ dsl.Schema }

func (Role) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("name").NotEmpty(),
		dsl.String("slug").NotEmpty(),
		dsl.Text("description").Optional(),
		dsl.JSONB("capabilities").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Role) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ManyToMany("users", "User").ThroughTable("user_roles").Inverse("roles"),
	}
}

func (Role) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("roles_slug_key").On("slug").Unique(),
	}
}

func (Role) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("slug", dsl.OpEqual).Named("SlugEq"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
			dsl.OrderBy("slug", dsl.SortAsc).Named("SlugAsc"),
		).
		WithDefaultLimit(50).
		WithMaxLimit(200)
}

func (Role) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Role",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
