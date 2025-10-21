package schema

import "github.com/deicod/erm/orm/dsl"

// Comment stores user feedback and discussion around posts.
type Comment struct{ dsl.Schema }

func (Comment) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("post_id"),
		dsl.UUIDv7("author_id").Optional(),
		dsl.UUIDv7("parent_id").Optional(),
		dsl.String("author_name").Optional(),
		dsl.String("author_email").Optional(),
		dsl.String("author_url").Optional(),
		dsl.Text("content").NotEmpty(),
		dsl.Enum("status", "pending", "approved", "spam", "trash").Default("pending"),
		dsl.TimestampTZ("submitted_at").DefaultNow(),
		dsl.TimestampTZ("published_at").Optional(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Comment) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("post", "Post").Field("post_id").OnDeleteCascade().Inverse("comments"),
		dsl.ToOne("author", "User").Field("author_id").Optional().OnDeleteSetNull().Inverse("comments"),
		dsl.ToOne("parent", "Comment").Field("parent_id").Optional().OnDeleteCascade(),
		dsl.ToMany("replies", "Comment").Ref("parent"),
	}
}

func (Comment) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("comments_post_submitted_at").On("post_id", "submitted_at"),
		dsl.Idx("comments_status_post").On("status", "post_id"),
	}
}

func (Comment) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("post_id", dsl.OpEqual).Named("PostIDEq"),
			dsl.NewPredicate("author_id", dsl.OpEqual).Named("AuthorIDEq"),
			dsl.NewPredicate("status", dsl.OpEqual).Named("StatusEq"),
		).
		WithOrders(
			dsl.OrderBy("submitted_at", dsl.SortAsc).Named("SubmittedAtAsc"),
		).
		WithDefaultLimit(50).
		WithMaxLimit(500)
}

func (Comment) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Comment",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
