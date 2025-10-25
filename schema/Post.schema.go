package schema

import "github.com/deicod/erm/orm/dsl"

// Post represents WordPress posts and pages.
// It exposes author, featured media, category, and tag relationships via GraphQL.
type Post struct{ dsl.Schema }

func (Post) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("author_id"),
		dsl.UUIDv7("featured_media_id").Optional(),
		dsl.String("title").NotEmpty(),
		dsl.String("slug").NotEmpty(),
		dsl.Enum("status", "draft", "pending", "private", "published", "archived").Default("draft"),
		dsl.Enum("type", "post", "page", "custom").Default("post"),
		dsl.Text("excerpt").Optional(),
		dsl.Text("content").Optional(),
		dsl.JSONB("seo").Optional(),
		dsl.TimestampTZ("published_at").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Post) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("author", "User").
			Field("author_id").
			OnDeleteRestrict().
			Inverse("posts"),
		dsl.ToOne("featured_media", "Media").
			Field("featured_media_id").
			Optional().
			OnDeleteSetNull().
			Inverse("featured_in_posts"),
		dsl.ToMany("comments", "Comment").Ref("post"),
		dsl.ManyToMany("categories", "Category").ThroughTable("post_categories").Inverse("posts"),
		dsl.ManyToMany("tags", "Tag").ThroughTable("post_tags").Inverse("posts"),
	}
}

func (Post) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("posts_slug_key").On("slug").Unique(),
		dsl.Idx("posts_status_published_at").On("status", "published_at"),
		dsl.Idx("posts_author_created_at").On("author_id", "created_at"),
	}
}

func (Post) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("slug", dsl.OpEqual).Named("SlugEq"),
			dsl.NewPredicate("author_id", dsl.OpEqual).Named("AuthorIDEq"),
			dsl.NewPredicate("status", dsl.OpEqual).Named("StatusEq"),
			dsl.NewPredicate("type", dsl.OpEqual).Named("TypeEq"),
		).
		WithOrders(
			dsl.OrderBy("published_at", dsl.SortDesc).Named("PublishedAtDesc"),
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
		).
		WithDefaultLimit(20).
		WithMaxLimit(200)
}

func (Post) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Post",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
