package schema

import "github.com/deicod/erm/orm/dsl"

// Comment models the Comment domain entity.
type Comment struct{ dsl.Schema }

func (Comment) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("post_id"),
		dsl.UUIDv7("author_id"),
		dsl.UUIDv7("parent_id").Optional(),
		dsl.Text("body").NotEmpty(),
		dsl.Enum("status", "VISIBLE", "PENDING", "HIDDEN").Default("VISIBLE"),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Comment) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("post", "Post").Field("post_id").OnDeleteCascade().Inverse("comments"),
		dsl.ToOne("author", "User").Field("author_id").OnDeleteCascade().Inverse("comments"),
		dsl.ToOne("parent", "Comment").Field("parent_id").Optional().OnDeleteSetNull(),
		dsl.ToMany("replies", "Comment").Ref("parent_id"),
	}
}

func (Comment) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("comments_post_created_at").On("post_id", "created_at"),
		dsl.Idx("comments_author_created_at").On("author_id", "created_at"),
		dsl.Idx("comments_parent_created_at").On("parent_id", "created_at"),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (Comment) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("post_id", dsl.OpEqual).Named("PostIDEq"),
			dsl.NewPredicate("author_id", dsl.OpEqual).Named("AuthorIDEq"),
			dsl.NewPredicate("status", dsl.OpEqual).Named("StatusEq"),
			dsl.NewPredicate("created_at", dsl.OpGTE).Named("CreatedAfter"),
			dsl.NewPredicate("created_at", dsl.OpLTE).Named("CreatedBefore"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortAsc).Named("CreatedAtAsc"),
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		).
		WithDefaultLimit(50).
		WithMaxLimit(250)
}

// Annotations enable code generators like GraphQL to understand additional metadata.
func (Comment) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.GraphQL("Comment",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
