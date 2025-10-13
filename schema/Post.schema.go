package schema

import "github.com/deicod/erm/orm/dsl"

// Post models the Post domain entity.
type Post struct{ dsl.Schema }

func (Post) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("author_id"),
		dsl.UUIDv7("category_id").Optional(),
		dsl.Text("title").NotEmpty(),
		dsl.Text("slug").
			Computed(dsl.Computed(
				dsl.Expression("lower(regexp_replace(title, '[^a-z0-9]+', '-', 'g'))", "title"),
			)).
			UniqueConstraint(),
		dsl.Text("excerpt").Optional(),
		dsl.Text("body").Optional(),
		dsl.Enum("status", "DRAFT", "PUBLISHED", "ARCHIVED").Default("DRAFT"),
		dsl.Boolean("is_featured").Default(false),
		dsl.TimestampTZ("published_at").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Post) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("author", "User").Field("author_id").OnDeleteCascade().Inverse("posts"),
		dsl.ToOne("category", "Category").Field("category_id").Optional().OnDeleteSetNull().Inverse("posts"),
		dsl.ToMany("comments", "Comment").Ref("post_id"),
		dsl.ManyToMany("tags", "Tag").ThroughTable("post_tags").Inverse("posts"),
	}
}

func (Post) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("posts_slug_unique").On("slug").Unique(),
		dsl.Idx("posts_author_created_at").On("author_id", "created_at"),
		dsl.Idx("posts_status_published_at").On("status", "published_at"),
		dsl.Idx("posts_category_created_at").On("category_id", "created_at"),
	}
}

// Query exposes reusable predicates, ordering, and aggregate helpers for the entity.
func (Post) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("author_id", dsl.OpEqual).Named("AuthorIDEq"),
			dsl.NewPredicate("category_id", dsl.OpEqual).Named("CategoryIDEq"),
			dsl.NewPredicate("status", dsl.OpEqual).Named("StatusEq"),
			dsl.NewPredicate("title", dsl.OpILike).Named("TitleILike"),
			dsl.NewPredicate("created_at", dsl.OpGTE).Named("CreatedAfter"),
			dsl.NewPredicate("created_at", dsl.OpLTE).Named("CreatedBefore"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
			dsl.OrderBy("published_at", dsl.SortDesc).Named("PublishedAtDesc"),
		).
		WithAggregates(
			dsl.CountAggregate("Count"),
		).
		WithDefaultLimit(25).
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
