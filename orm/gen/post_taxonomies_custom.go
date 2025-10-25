package gen

import (
	"context"
	"fmt"
)

const (
	replacePostCategoriesDeleteQuery = `DELETE FROM post_categories WHERE post_id = $1`
	replacePostCategoriesInsertQuery = `INSERT INTO post_categories (post_id, category_id) VALUES ($1, $2) ON CONFLICT (category_id, post_id) DO NOTHING`
	replacePostTagsDeleteQuery       = `DELETE FROM post_tags WHERE post_id = $1`
	replacePostTagsInsertQuery       = `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT (post_id, tag_id) DO NOTHING`
)

func (c *Client) ReplacePostCategories(ctx context.Context, postID string, categoryIDs []string) error {
	if c == nil {
		return fmt.Errorf("orm client is not configured")
	}
	if postID == "" {
		return fmt.Errorf("postID is required")
	}
	if _, err := c.Posts().ByID(ctx, postID); err != nil {
		return err
	}
	if _, err := c.db.Pool.Exec(ctx, replacePostCategoriesDeleteQuery, postID); err != nil {
		return err
	}
	if len(categoryIDs) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(categoryIDs))
	for _, categoryID := range categoryIDs {
		if categoryID == "" {
			return fmt.Errorf("categoryID is required")
		}
		if _, ok := seen[categoryID]; ok {
			continue
		}
		seen[categoryID] = struct{}{}
		if _, err := c.db.Pool.Exec(ctx, replacePostCategoriesInsertQuery, postID, categoryID); err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) ReplacePostTags(ctx context.Context, postID string, tagIDs []string) error {
	if c == nil {
		return fmt.Errorf("orm client is not configured")
	}
	if postID == "" {
		return fmt.Errorf("postID is required")
	}
	if _, err := c.Posts().ByID(ctx, postID); err != nil {
		return err
	}
	if _, err := c.db.Pool.Exec(ctx, replacePostTagsDeleteQuery, postID); err != nil {
		return err
	}
	if len(tagIDs) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(tagIDs))
	for _, tagID := range tagIDs {
		if tagID == "" {
			return fmt.Errorf("tagID is required")
		}
		if _, ok := seen[tagID]; ok {
			continue
		}
		seen[tagID] = struct{}{}
		if _, err := c.db.Pool.Exec(ctx, replacePostTagsInsertQuery, postID, tagID); err != nil {
			return err
		}
	}
	return nil
}
