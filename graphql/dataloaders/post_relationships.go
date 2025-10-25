package dataloaders

import (
	"context"

	"github.com/deicod/ermblog/observability/metrics"
	"github.com/deicod/ermblog/orm/gen"
)

func configurePostRelationshipLoaders(loaders *Loaders, orm *gen.Client, collector metrics.Collector) {
	if loaders == nil || orm == nil {
		return
	}
	loaders.register("PostCategories", newEntityLoader[string, []*gen.Category]("post_categories", collector, func(ctx context.Context, keys []string) (map[string][]*gen.Category, error) {
		return loadPostCategories(ctx, orm, keys)
	}))
	loaders.register("PostTags", newEntityLoader[string, []*gen.Tag]("post_tags", collector, func(ctx context.Context, keys []string) (map[string][]*gen.Tag, error) {
		return loadPostTags(ctx, orm, keys)
	}))
}

func (l *Loaders) PostCategories() *EntityLoader[string, []*gen.Category] {
	if l == nil {
		return nil
	}
	if loader, ok := l.get("PostCategories").(*EntityLoader[string, []*gen.Category]); ok {
		return loader
	}
	return nil
}

func (l *Loaders) PostTags() *EntityLoader[string, []*gen.Tag] {
	if l == nil {
		return nil
	}
	if loader, ok := l.get("PostTags").(*EntityLoader[string, []*gen.Tag]); ok {
		return loader
	}
	return nil
}

func loadPostCategories(ctx context.Context, orm *gen.Client, keys []string) (map[string][]*gen.Category, error) {
	posts, buckets := buildPostsForRelationships(keys)
	if len(posts) == 0 {
		return make(map[string][]*gen.Category), nil
	}
	if err := orm.Posts().LoadCategories(ctx, posts...); err != nil {
		return nil, err
	}
	results := make(map[string][]*gen.Category, len(buckets))
	for key, post := range buckets {
		categories := []*gen.Category{}
		if post.Edges != nil && post.Edges.Categories != nil {
			categories = append(categories, post.Edges.Categories...)
		}
		results[key] = categories
	}
	return results, nil
}

func loadPostTags(ctx context.Context, orm *gen.Client, keys []string) (map[string][]*gen.Tag, error) {
	posts, buckets := buildPostsForRelationships(keys)
	if len(posts) == 0 {
		return make(map[string][]*gen.Tag), nil
	}
	if err := orm.Posts().LoadTags(ctx, posts...); err != nil {
		return nil, err
	}
	results := make(map[string][]*gen.Tag, len(buckets))
	for key, post := range buckets {
		tags := []*gen.Tag{}
		if post.Edges != nil && post.Edges.Tags != nil {
			tags = append(tags, post.Edges.Tags...)
		}
		results[key] = tags
	}
	return results, nil
}

func buildPostsForRelationships(keys []string) ([]*gen.Post, map[string]*gen.Post) {
	posts := make([]*gen.Post, 0, len(keys))
	buckets := make(map[string]*gen.Post, len(keys))
	for _, key := range keys {
		if key == "" {
			continue
		}
		if _, ok := buckets[key]; ok {
			continue
		}
		post := &gen.Post{ID: key}
		posts = append(posts, post)
		buckets[key] = post
	}
	return posts, buckets
}
