package schema

import "github.com/deicod/erm/orm/dsl"

// Tag offers flat taxonomy similar to WordPress post tags.
type Tag struct{ dsl.Schema }

func (Tag) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("name").NotEmpty(),
		dsl.String("slug").NotEmpty(),
		dsl.Text("description").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Tag) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ManyToMany("posts", "Post").ThroughTable("post_tags").Inverse("tags"),
	}
}

func (Tag) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("tags_slug_key").On("slug").Unique(),
	}
}

func (Tag) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("slug", dsl.OpEqual).Named("SlugEq"),
		).
		WithOrders(
			dsl.OrderBy("name", dsl.SortAsc).Named("NameAsc"),
		).
		WithDefaultLimit(100).
		WithMaxLimit(500)
}

func (Tag) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Tag"),
	}
}
