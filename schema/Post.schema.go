package schema

import "github.com/deicod/erm/orm/dsl"

// Post models the Post domain entity.
type Post struct{ dsl.Schema }

func (Post) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("author_id"),
		dsl.UUIDv7("category_id").Optional(),
		dsl.String("title").NotEmpty(),
		dsl.String("slug").NotEmpty().Unique(),
		dsl.Text("excerpt").Optional(),
		dsl.Text("body").Optional(),
		dsl.TimestampTZ("published_at").Optional(),
		dsl.Bool("is_published").WithDefault("false"),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Post) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("author", "User").Field("author_id").OnDeleteCascade().Inverse("posts"),
		dsl.ToOne("category", "Category").Field("category_id").Optional().OnDeleteSetNull().Inverse("posts"),
		dsl.ToMany("comments", "Comment").Ref("post"),
		dsl.ToMany("tag_links", "PostTag").Ref("post"),
	}
}

func (Post) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("posts_slug_unique").On("slug").Unique(),
		dsl.Idx("posts_author_published_at").On("author_id", "published_at"),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (Post) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("author_id", dsl.OpEqual).Named("AuthorIDEq"),
			dsl.NewPredicate("slug", dsl.OpEqual).Named("SlugEq"),
			dsl.NewPredicate("is_published", dsl.OpEqual).Named("IsPublishedEq"),
			dsl.NewPredicate("category_id", dsl.OpEqual).Named("CategoryIDEq"),
		).
		WithOrders(
			dsl.OrderBy("published_at", dsl.SortDesc).Named("PublishedAtDesc"),
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		).
		WithDefaultLimit(20).
		WithMaxLimit(200)
}

// Annotations enable code generators like GraphQL to understand additional metadata.
func (Post) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.GraphQL("Post",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
