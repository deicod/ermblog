package schema

import "github.com/deicod/erm/orm/dsl"

// Media stores uploaded assets such as images, audio, or documents.
type Media struct{ dsl.Schema }

func (Media) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.UUIDv7("uploaded_by_id").Optional(),
		dsl.String("file_name").NotEmpty(),
		dsl.String("mime_type").NotEmpty(),
		dsl.String("storage_key").NotEmpty(),
		dsl.String("url").NotEmpty(),
		dsl.String("title").Optional(),
		dsl.String("alt_text").Optional(),
		dsl.Text("caption").Optional(),
		dsl.Text("description").Optional(),
		dsl.Integer("file_size_bytes").Optional(),
		dsl.JSONB("metadata").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Media) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToOne("uploaded_by", "User").Field("uploaded_by_id").Optional().OnDeleteSetNull().Inverse("media"),
		dsl.ToMany("featured_in_posts", "Post").Ref("featured_media"),
	}
}

func (Media) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("media_storage_key_key").On("storage_key").Unique(),
	}
}

func (Media) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("uploaded_by_id", dsl.OpEqual).Named("UploadedByIDEq"),
			dsl.NewPredicate("mime_type", dsl.OpILike).Named("MimeTypeILike"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
		).
		WithDefaultLimit(50).
		WithMaxLimit(200)
}

func (Media) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Media"),
	}
}
