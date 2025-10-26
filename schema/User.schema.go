package schema

import "github.com/deicod/erm/orm/dsl"

// User models authors, contributors and administrators in the WordPress-style backend.
type User struct{ dsl.Schema }

func (User) Fields() []dsl.Field {
	return []dsl.Field{
		dsl.UUIDv7("id").Primary(),
		dsl.String("username").NotEmpty(),
		dsl.String("email").NotEmpty(),
		dsl.String("password").ColumnName("password_hash").NotEmpty(), // persisted only; GraphQL layer omits responses
		dsl.String("display_name").Optional(),
		dsl.Text("bio").Optional(),
		dsl.String("avatar_url").Optional(),
		dsl.String("website_url").Optional(),
		dsl.TimestampTZ("last_login_at").Optional(),
		dsl.TimestampTZ("created_at").DefaultNow(),
		dsl.TimestampTZ("updated_at").UpdateNow(),
	}
}

func (User) Edges() []dsl.Edge {
	return []dsl.Edge{
		dsl.ToMany("posts", "Post").Ref("author"),
		dsl.ToMany("comments", "Comment").Ref("author"),
		dsl.ToMany("media", "Media").Ref("uploaded_by"),
		dsl.ManyToMany("roles", "Role").ThroughTable("user_roles").Inverse("users"),
	}
}

func (User) Indexes() []dsl.Index {
	return []dsl.Index{
		dsl.Idx("users_username_key").On("username").Unique(),
		dsl.Idx("users_email_key").On("email").Unique(),
	}
}

func (User) Query() dsl.QuerySpec {
	return dsl.Query().
		WithPredicates(
			dsl.NewPredicate("id", dsl.OpEqual).Named("IDEq"),
			dsl.NewPredicate("username", dsl.OpEqual).Named("UsernameEq"),
			dsl.NewPredicate("email", dsl.OpEqual).Named("EmailEq"),
		).
		WithOrders(
			dsl.OrderBy("created_at", dsl.SortDesc).Named("CreatedAtDesc"),
			dsl.OrderBy("username", dsl.SortAsc).Named("UsernameAsc"),
		).
		WithDefaultLimit(50).
		WithMaxLimit(200)
}

func (User) Annotations() []dsl.Annotation {
	return []dsl.Annotation{
		dsl.Authorization(dsl.ContentAuth()),
		dsl.GraphQL("User",
			dsl.GraphQLSubscriptions(
				dsl.SubscriptionEventCreate,
				dsl.SubscriptionEventUpdate,
				dsl.SubscriptionEventDelete,
			),
		),
	}
}
