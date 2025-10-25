package resolvers

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/deicod/erm/orm/pg"
	graphqlpkg "github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/relay"
	"github.com/deicod/ermblog/orm/gen"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestPostResolversExposeAssignedRelationships(t *testing.T) {
	pool := newMockPool()
	now := time.Now().UTC()
	pool.categories["cat-1"] = &gen.Category{ID: "cat-1", Name: "News", Slug: "news", CreatedAt: now, UpdatedAt: now}
	pool.categories["cat-2"] = &gen.Category{ID: "cat-2", Name: "Updates", Slug: "updates", CreatedAt: now, UpdatedAt: now}
	pool.tags["tag-1"] = &gen.Tag{ID: "tag-1", Name: "Go", Slug: "go", CreatedAt: now, UpdatedAt: now}
	pool.tags["tag-2"] = &gen.Tag{ID: "tag-2", Name: "GraphQL", Slug: "graphql", CreatedAt: now, UpdatedAt: now}
	pool.medias["media-1"] = &gen.Media{ID: "media-1", FileName: "hero.png", MimeType: "image/png", StorageKey: "hero.png", URL: "https://cdn.example/hero.png", CreatedAt: now, UpdatedAt: now}
	pool.posts["post-1"] = &gen.Post{ID: "post-1", AuthorID: "author-1", Title: "Hello", Slug: "hello", Status: "draft", Type: "post", CreatedAt: now, UpdatedAt: now}
	pool.postCategories["post-1"] = []string{"cat-1", "cat-2"}
	pool.postTags["post-1"] = []string{"tag-1", "tag-2"}

	db := &pg.DB{Pool: pool}
	resolver := NewWithOptions(Options{ORM: gen.NewClient(db)})

	postResolver := resolver.Post()
	post := &graphqlpkg.Post{
		ID:              relay.ToGlobalID("Post", "post-1"),
		AuthorID:        "author-1",
		FeaturedMediaID: ptr("media-1"),
	}

	ctx := resolver.WithLoaders(context.Background())

	categories, err := postResolver.Categories(ctx, post)
	if err != nil {
		t.Fatalf("unexpected error resolving categories: %v", err)
	}
	if len(categories) != 2 {
		t.Fatalf("expected 2 categories, got %d", len(categories))
	}
	if categories[0].ID != relay.ToGlobalID("Category", "cat-1") || categories[1].ID != relay.ToGlobalID("Category", "cat-2") {
		t.Fatalf("unexpected categories: %#v", categories)
	}

	tags, err := postResolver.Tags(ctx, post)
	if err != nil {
		t.Fatalf("unexpected error resolving tags: %v", err)
	}
	if len(tags) != 2 {
		t.Fatalf("expected 2 tags, got %d", len(tags))
	}
	if tags[0].ID != relay.ToGlobalID("Tag", "tag-1") || tags[1].ID != relay.ToGlobalID("Tag", "tag-2") {
		t.Fatalf("unexpected tags: %#v", tags)
	}

	media, err := postResolver.FeaturedMedia(ctx, post)
	if err != nil {
		t.Fatalf("unexpected error resolving featured media: %v", err)
	}
	if media == nil || media.ID != relay.ToGlobalID("Media", "media-1") {
		t.Fatalf("unexpected media: %#v", media)
	}
}

func TestCreateAndUpdatePostAssignsTaxonomies(t *testing.T) {
	pool := newMockPool()
	now := time.Now().UTC()
	pool.categories["cat-1"] = &gen.Category{ID: "cat-1", Name: "News", Slug: "news", CreatedAt: now, UpdatedAt: now}
	pool.categories["cat-2"] = &gen.Category{ID: "cat-2", Name: "Updates", Slug: "updates", CreatedAt: now, UpdatedAt: now}
	pool.categories["cat-3"] = &gen.Category{ID: "cat-3", Name: "Dev", Slug: "dev", CreatedAt: now, UpdatedAt: now}
	pool.tags["tag-1"] = &gen.Tag{ID: "tag-1", Name: "Go", Slug: "go", CreatedAt: now, UpdatedAt: now}
	pool.tags["tag-2"] = &gen.Tag{ID: "tag-2", Name: "GraphQL", Slug: "graphql", CreatedAt: now, UpdatedAt: now}
	pool.tags["tag-3"] = &gen.Tag{ID: "tag-3", Name: "API", Slug: "api", CreatedAt: now, UpdatedAt: now}

	db := &pg.DB{Pool: pool}
	resolver := NewWithOptions(Options{ORM: gen.NewClient(db)})

	postID := "post-create"
	title := "Hello"
	slug := "hello"
	author := "author-1"
	input := graphqlpkg.CreatePostInput{
		ID:          &postID,
		AuthorID:    &author,
		Title:       &title,
		Slug:        &slug,
		CategoryIDs: []string{relay.ToGlobalID("Category", "cat-1"), relay.ToGlobalID("Category", "cat-2"), relay.ToGlobalID("Category", "cat-1")},
		TagIDs:      []string{relay.ToGlobalID("Tag", "tag-1"), relay.ToGlobalID("Tag", "tag-2")},
	}

	payload, err := resolver.Mutation().CreatePost(context.Background(), input)
	if err != nil {
		t.Fatalf("unexpected error creating post: %v", err)
	}
	if payload.Post == nil {
		t.Fatalf("expected post payload, got %#v", payload)
	}

	assignedCats := pool.postCategories[postID]
	if len(assignedCats) != 2 || assignedCats[0] != "cat-1" || assignedCats[1] != "cat-2" {
		t.Fatalf("unexpected assigned categories: %#v", assignedCats)
	}
	assignedTags := pool.postTags[postID]
	if len(assignedTags) != 2 || assignedTags[0] != "tag-1" || assignedTags[1] != "tag-2" {
		t.Fatalf("unexpected assigned tags: %#v", assignedTags)
	}

	updateInput := graphqlpkg.UpdatePostInput{
		ID:          payload.Post.ID,
		CategoryIDs: []string{relay.ToGlobalID("Category", "cat-3")},
		TagIDs:      []string{},
	}

	updated, err := resolver.Mutation().UpdatePost(context.Background(), updateInput)
	if err != nil {
		t.Fatalf("unexpected error updating post: %v", err)
	}
	if updated.Post == nil {
		t.Fatalf("expected updated post, got %#v", updated)
	}

	assignedCats = pool.postCategories[postID]
	if len(assignedCats) != 1 || assignedCats[0] != "cat-3" {
		t.Fatalf("expected categories to be replaced, got %#v", assignedCats)
	}
	assignedTags = pool.postTags[postID]
	if len(assignedTags) != 0 {
		t.Fatalf("expected tags to be cleared, got %#v", assignedTags)
	}

	ctx := resolver.WithLoaders(context.Background())
	postResolver := resolver.Post()
	categories, err := postResolver.Categories(ctx, payload.Post)
	if err != nil {
		t.Fatalf("unexpected error resolving categories after update: %v", err)
	}
	if len(categories) != 1 || categories[0].ID != relay.ToGlobalID("Category", "cat-3") {
		t.Fatalf("unexpected categories after update: %#v", categories)
	}
	tags, err := postResolver.Tags(ctx, payload.Post)
	if err != nil {
		t.Fatalf("unexpected error resolving tags after update: %v", err)
	}
	if len(tags) != 0 {
		t.Fatalf("expected no tags after update, got %#v", tags)
	}
}

type mockPool struct {
	posts          map[string]*gen.Post
	categories     map[string]*gen.Category
	tags           map[string]*gen.Tag
	medias         map[string]*gen.Media
	postCategories map[string][]string
	postTags       map[string][]string
}

func newMockPool() *mockPool {
	return &mockPool{
		posts:          make(map[string]*gen.Post),
		categories:     make(map[string]*gen.Category),
		tags:           make(map[string]*gen.Tag),
		medias:         make(map[string]*gen.Media),
		postCategories: make(map[string][]string),
		postTags:       make(map[string][]string),
	}
}

func (m *mockPool) Query(_ context.Context, sql string, args ...any) (pgx.Rows, error) {
	switch {
	case strings.Contains(sql, "FROM categories AS t JOIN post_categories"):
		rows := make([][]any, 0)
		for _, arg := range args {
			postID := arg.(string)
			ids := m.postCategories[postID]
			for _, id := range ids {
				if record, ok := m.categories[id]; ok {
					rows = append(rows, []any{record.ID, record.Name, record.Slug, record.Description, record.ParentID, record.CreatedAt, record.UpdatedAt, postID})
				}
			}
		}
		return &mockRows{data: rows}, nil
	case strings.Contains(sql, "FROM tags AS t JOIN post_tags"):
		rows := make([][]any, 0)
		for _, arg := range args {
			postID := arg.(string)
			ids := m.postTags[postID]
			for _, id := range ids {
				if record, ok := m.tags[id]; ok {
					rows = append(rows, []any{record.ID, record.Name, record.Slug, record.Description, record.CreatedAt, record.UpdatedAt, postID})
				}
			}
		}
		return &mockRows{data: rows}, nil
	default:
		return nil, fmt.Errorf("unexpected query: %s", sql)
	}
}

func (m *mockPool) QueryRow(_ context.Context, sql string, args ...any) pgx.Row {
	switch {
	case strings.HasPrefix(sql, "INSERT INTO posts"):
		post := &gen.Post{
			ID:        args[0].(string),
			AuthorID:  args[1].(string),
			Title:     args[3].(string),
			Slug:      args[4].(string),
			Status:    args[5].(string),
			Type:      args[6].(string),
			CreatedAt: args[11].(time.Time),
			UpdatedAt: args[12].(time.Time),
		}
		if v, ok := args[2].(*string); ok {
			post.FeaturedMediaID = v
		}
		if excerpt, ok := args[7].(*string); ok {
			post.Excerpt = excerpt
		}
		if content, ok := args[8].(*string); ok {
			post.Content = content
		}
		if seo, ok := args[9].(json.RawMessage); ok {
			post.Seo = seo
		}
		if published, ok := args[10].(*time.Time); ok {
			post.PublishedAt = published
		}
		m.posts[post.ID] = post
		return &mockRow{values: []any{post.ID, post.AuthorID, post.FeaturedMediaID, post.Title, post.Slug, post.Status, post.Type, post.Excerpt, post.Content, post.Seo, post.PublishedAt, post.CreatedAt, post.UpdatedAt}}
	case strings.HasPrefix(sql, "SELECT id, author_id") && strings.Contains(sql, "FROM posts WHERE id"):
		id := args[0].(string)
		if record, ok := m.posts[id]; ok {
			return &mockRow{values: []any{record.ID, record.AuthorID, record.FeaturedMediaID, record.Title, record.Slug, record.Status, record.Type, record.Excerpt, record.Content, record.Seo, record.PublishedAt, record.CreatedAt, record.UpdatedAt}}
		}
		return &mockRow{err: pgx.ErrNoRows}
	case strings.HasPrefix(sql, "UPDATE posts SET"):
		featured, _ := args[1].(*string)
		excerpt, _ := args[6].(*string)
		content, _ := args[7].(*string)
		published, _ := args[9].(*time.Time)
		id := args[11].(string)
		record, ok := m.posts[id]
		if !ok {
			return &mockRow{err: pgx.ErrNoRows}
		}
		record.AuthorID = args[0].(string)
		record.FeaturedMediaID = featured
		record.Title = args[2].(string)
		record.Slug = args[3].(string)
		record.Status = args[4].(string)
		record.Type = args[5].(string)
		record.Excerpt = excerpt
		record.Content = content
		if seo, ok := args[8].(json.RawMessage); ok {
			record.Seo = seo
		}
		record.PublishedAt = published
		record.UpdatedAt = args[10].(time.Time)
		return &mockRow{values: []any{record.ID, record.AuthorID, record.FeaturedMediaID, record.Title, record.Slug, record.Status, record.Type, record.Excerpt, record.Content, record.Seo, record.PublishedAt, record.CreatedAt, record.UpdatedAt}}
	case strings.HasPrefix(sql, "SELECT id, name") && strings.Contains(sql, "FROM categories"):
		id := args[0].(string)
		if record, ok := m.categories[id]; ok {
			return &mockRow{values: []any{record.ID, record.Name, record.Slug, record.Description, record.ParentID, record.CreatedAt, record.UpdatedAt}}
		}
		return &mockRow{err: pgx.ErrNoRows}
	case strings.HasPrefix(sql, "SELECT id, name") && strings.Contains(sql, "FROM tags"):
		id := args[0].(string)
		if record, ok := m.tags[id]; ok {
			return &mockRow{values: []any{record.ID, record.Name, record.Slug, record.Description, record.CreatedAt, record.UpdatedAt}}
		}
		return &mockRow{err: pgx.ErrNoRows}
	case strings.HasPrefix(sql, "SELECT id, uploaded_by_id"):
		id := args[0].(string)
		if record, ok := m.medias[id]; ok {
			return &mockRow{values: []any{record.ID, record.UploadedByID, record.FileName, record.MimeType, record.StorageKey, record.URL, record.Title, record.AltText, record.Caption, record.Description, record.FileSizeBytes, record.Metadata, record.CreatedAt, record.UpdatedAt}}
		}
		return &mockRow{err: pgx.ErrNoRows}
	default:
		return &mockRow{err: fmt.Errorf("unexpected query row: %s", sql)}
	}
}

func (m *mockPool) Exec(_ context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	switch {
	case strings.HasPrefix(sql, "WITH deleted AS (") && strings.Contains(sql, "FROM post_categories"):
		postID := args[0].(string)
		m.postCategories[postID] = []string{}
		ids, _ := args[1].([]string)
		for _, categoryID := range ids {
			if !contains(m.postCategories[postID], categoryID) {
				m.postCategories[postID] = append(m.postCategories[postID], categoryID)
			}
		}
		return pgconn.CommandTag{}, nil
	case strings.HasPrefix(sql, "WITH deleted AS (") && strings.Contains(sql, "FROM post_tags"):
		postID := args[0].(string)
		m.postTags[postID] = []string{}
		ids, _ := args[1].([]string)
		for _, tagID := range ids {
			if !contains(m.postTags[postID], tagID) {
				m.postTags[postID] = append(m.postTags[postID], tagID)
			}
		}
		return pgconn.CommandTag{}, nil
	case strings.HasPrefix(sql, "DELETE FROM post_categories"):
		postID := args[0].(string)
		m.postCategories[postID] = []string{}
		return pgconn.CommandTag{}, nil
	case strings.HasPrefix(sql, "INSERT INTO post_categories"):
		postID := args[0].(string)
		categoryID := args[1].(string)
		list := m.postCategories[postID]
		if !contains(list, categoryID) {
			m.postCategories[postID] = append(list, categoryID)
		}
		return pgconn.CommandTag{}, nil
	case strings.HasPrefix(sql, "DELETE FROM post_tags"):
		postID := args[0].(string)
		m.postTags[postID] = []string{}
		return pgconn.CommandTag{}, nil
	case strings.HasPrefix(sql, "INSERT INTO post_tags"):
		postID := args[0].(string)
		tagID := args[1].(string)
		list := m.postTags[postID]
		if !contains(list, tagID) {
			m.postTags[postID] = append(list, tagID)
		}
		return pgconn.CommandTag{}, nil
	default:
		return pgconn.CommandTag{}, fmt.Errorf("unexpected exec: %s", sql)
	}
}

func (m *mockPool) Close() {}

type mockRow struct {
	values []any
	err    error
}

func (r *mockRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	if r.values == nil {
		return pgx.ErrNoRows
	}
	for i, d := range dest {
		if err := assignValue(d, r.values[i]); err != nil {
			return err
		}
	}
	return nil
}

type mockRows struct {
	data  [][]any
	index int
	err   error
}

func (r *mockRows) Close()                                       {}
func (r *mockRows) Err() error                                   { return r.err }
func (r *mockRows) CommandTag() pgconn.CommandTag                { return pgconn.CommandTag{} }
func (r *mockRows) FieldDescriptions() []pgconn.FieldDescription { return nil }
func (r *mockRows) Next() bool {
	if r.err != nil {
		return false
	}
	if r.index >= len(r.data) {
		return false
	}
	r.index++
	return true
}

func (r *mockRows) Scan(dest ...any) error {
	if r.index == 0 || r.index > len(r.data) {
		return fmt.Errorf("scan called out of bounds")
	}
	row := r.data[r.index-1]
	for i, d := range dest {
		if err := assignValue(d, row[i]); err != nil {
			return err
		}
	}
	return nil
}

func (r *mockRows) Values() ([]any, error) {
	if r.index == 0 || r.index > len(r.data) {
		return nil, fmt.Errorf("values called out of bounds")
	}
	return r.data[r.index-1], nil
}

func (r *mockRows) RawValues() [][]byte { return nil }
func (r *mockRows) Conn() *pgx.Conn     { return nil }

func assignValue(dest any, value any) error {
	switch d := dest.(type) {
	case *string:
		if value == nil {
			*d = ""
			return nil
		}
		switch v := value.(type) {
		case string:
			*d = v
		case *string:
			if v != nil {
				*d = *v
			} else {
				*d = ""
			}
		default:
			return fmt.Errorf("unsupported string assignment: %T", value)
		}
	case **string:
		if value == nil {
			*d = nil
			return nil
		}
		switch v := value.(type) {
		case string:
			val := v
			*d = &val
		case *string:
			*d = v
		default:
			return fmt.Errorf("unsupported *string assignment: %T", value)
		}
	case *time.Time:
		if value == nil {
			*d = time.Time{}
			return nil
		}
		switch v := value.(type) {
		case time.Time:
			*d = v
		case *time.Time:
			if v != nil {
				*d = *v
			} else {
				*d = time.Time{}
			}
		default:
			return fmt.Errorf("unsupported time assignment: %T", value)
		}
	case **time.Time:
		if value == nil {
			*d = nil
			return nil
		}
		switch v := value.(type) {
		case time.Time:
			val := v
			*d = &val
		case *time.Time:
			*d = v
		default:
			return fmt.Errorf("unsupported *time assignment: %T", value)
		}
	case *json.RawMessage:
		if value == nil {
			*d = nil
			return nil
		}
		switch v := value.(type) {
		case json.RawMessage:
			*d = append(json.RawMessage{}, v...)
		case []byte:
			raw := json.RawMessage(append([]byte{}, v...))
			*d = raw
		default:
			return fmt.Errorf("unsupported json assignment: %T", value)
		}
	case *int32:
		if value == nil {
			*d = 0
			return nil
		}
		switch v := value.(type) {
		case int32:
			*d = v
		case *int32:
			if v != nil {
				*d = *v
			} else {
				*d = 0
			}
		case int:
			*d = int32(v)
		default:
			return fmt.Errorf("unsupported int32 assignment: %T", value)
		}
	case **int32:
		if value == nil {
			*d = nil
			return nil
		}
		switch v := value.(type) {
		case int32:
			val := v
			*d = &val
		case *int32:
			*d = v
		case int:
			val := int32(v)
			*d = &val
		default:
			return fmt.Errorf("unsupported *int32 assignment: %T", value)
		}
	default:
		return fmt.Errorf("unsupported destination type: %T", dest)
	}
	return nil
}

func (m *mockPool) containsPost(postID string) bool {
	_, ok := m.posts[postID]
	return ok
}

func (m *mockPool) ensurePost(postID string) {
	if !m.containsPost(postID) {
		m.posts[postID] = &gen.Post{ID: postID, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
	}
}

func contains(list []string, value string) bool {
	for _, item := range list {
		if item == value {
			return true
		}
	}
	return false
}

func ptr[T any](value T) *T {
	v := value
	return &v
}
