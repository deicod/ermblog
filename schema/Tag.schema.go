package schema

import "github.com/deicod/erm/orm/dsl"

// Tag models the Tag domain entity.
type Tag struct{ dsl.Schema }

func (Tag) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("name").NotEmpty(),
		dsl.String("slug").NotEmpty().Unique(),
		dsl.Text("description").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Tag) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToMany("post_links", "PostTag").Ref("tag"),
	}
}

func (Tag) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("tags_slug_unique").On("slug").Unique(),
		dsl.Idx("tags_name_unique").On("name").Unique(),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (Tag) Query() dsl.QuerySpec {
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
func (Tag) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.GraphQL("Tag",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
