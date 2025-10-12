package schema

import "github.com/deicod/erm/orm/dsl"

// PostTag models the PostTag domain entity.
type PostTag struct{ dsl.Schema }

func (PostTag) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("post_id"),
		dsl.UUIDv7("tag_id"),
		dsl.TimestampTZ("assigned_at").DefaultNow(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (PostTag) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("post", "Post").Field("post_id").OnDeleteCascade().Inverse("tag_links"),
		dsl.ToOne("tag", "Tag").Field("tag_id").OnDeleteCascade().Inverse("post_links"),
	}
}

func (PostTag) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("post_tags_post_tag_unique").On("post_id", "tag_id").Unique(),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (PostTag) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("post_id", dsl.OpEqual).Named("PostIDEq"),
			dsl.NewPredicate("tag_id", dsl.OpEqual).Named("TagIDEq"),
		).
		WithOrders(
			dsl.OrderBy("assigned_at", dsl.SortDesc).Named("AssignedAtDesc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		)
}

// Annotations enable code generators like GraphQL to understand additional metadata.
func (PostTag) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.GraphQL("PostTag",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
