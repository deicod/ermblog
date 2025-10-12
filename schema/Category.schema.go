package schema

import "github.com/deicod/erm/orm/dsl"

// Category models the Category domain entity.
type Category struct{ dsl.Schema }

func (Category) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("name").NotEmpty(),
		dsl.String("slug").NotEmpty().Unique(),
		dsl.Text("description").Optional(),
		dsl.String("color").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Category) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToMany("posts", "Post").Ref("category_id"),
	}
}

func (Category) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("categories_slug_unique").On("slug").Unique(),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (Category) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("slug", dsl.OpEqual).Named("SlugEq"),
			dsl.NewPredicate("name", dsl.OpILike).Named("NameILike"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
			dsl.OrderBy("name", dsl.SortAsc).Named("NameAsc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		)
}

// Annotations enable code generators like GraphQL to understand additional metadata.
func (Category) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.GraphQL("Category",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
