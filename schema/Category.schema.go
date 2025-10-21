package schema

import "github.com/deicod/erm/orm/dsl"

// Category organizes posts into hierarchical taxonomy buckets.
type Category struct{ dsl.Schema }

func (Category) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("name").NotEmpty(),
		dsl.String("slug").NotEmpty(),
		dsl.Text("description").Optional(),
		dsl.UUIDv7("parent_id").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Category) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("parent", "Category").Field("parent_id").Optional().OnDeleteSetNull(),
		dsl.ToMany("children", "Category").Ref("parent"),
		dsl.ManyToMany("posts", "Post").ThroughTable("post_categories").Inverse("categories"),
	}
}

func (Category) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("categories_slug_key").On("slug").Unique(),
	}
}

func (Category) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("slug", dsl.OpEqual).Named("SlugEq"),
			dsl.NewPredicate("parent_id", dsl.OpEqual).Named("ParentIDEq"),
		).
		WithOrders(
			dsl.OrderBy("name", dsl.SortAsc).Named("NameAsc"),
		).
		WithDefaultLimit(100).
		WithMaxLimit(500)
}

func (Category) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Category"),
	}
}
