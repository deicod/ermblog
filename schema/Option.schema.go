package schema

import "github.com/deicod/erm/orm/dsl"

// Option stores key/value configuration similar to WordPress options table.
type Option struct{ dsl.Schema }

func (Option) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("name").NotEmpty(),
		dsl.JSONB("value"),
		dsl.Boolean("autoload").Default(false),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (Option) Edges() []dsl.Edge { return nil }

func (Option) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("options_name_key").On("name").Unique(),
	}
}

func (Option) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("name", dsl.OpEqual).Named("NameEq"),
		).
		WithDefaultLimit(100).
		WithMaxLimit(500)
}

func (Option) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("Option"),
	}
}
