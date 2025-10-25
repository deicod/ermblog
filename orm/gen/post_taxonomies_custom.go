package gen

import (
	"context"
	"fmt"
)

const (
	replacePostCategoriesQuery = `WITH deleted AS (
DELETE FROM post_categories WHERE post_id = $1
), input AS (
SELECT DISTINCT value::uuid AS category_id FROM unnest($2::uuid[]) AS t(value)
)
INSERT INTO post_categories (post_id, category_id)
SELECT $1, input.category_id FROM input
ON CONFLICT (category_id, post_id) DO NOTHING`
	replacePostTagsQuery = `WITH deleted AS (
DELETE FROM post_tags WHERE post_id = $1
), input AS (
SELECT DISTINCT value::uuid AS tag_id FROM unnest($2::uuid[]) AS t(value)
)
INSERT INTO post_tags (post_id, tag_id)
SELECT $1, input.tag_id FROM input
ON CONFLICT (post_id, tag_id) DO NOTHING`
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
	writer := c.db.Writer()
	if writer == nil {
		return fmt.Errorf("orm writer pool is not configured")
	}

	seen := make(map[string]struct{}, len(categoryIDs))
	uniqueCategoryIDs := make([]string, 0, len(categoryIDs))
	for _, categoryID := range categoryIDs {
		if categoryID == "" {
			return fmt.Errorf("categoryID is required")
		}
		if _, ok := seen[categoryID]; ok {
			continue
		}
		seen[categoryID] = struct{}{}
		uniqueCategoryIDs = append(uniqueCategoryIDs, categoryID)
	}

	if _, err := writer.Exec(ctx, replacePostCategoriesQuery, postID, uniqueCategoryIDs); err != nil {
		return err
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
	writer := c.db.Writer()
	if writer == nil {
		return fmt.Errorf("orm writer pool is not configured")
	}

	seen := make(map[string]struct{}, len(tagIDs))
	uniqueTagIDs := make([]string, 0, len(tagIDs))
	for _, tagID := range tagIDs {
		if tagID == "" {
			return fmt.Errorf("tagID is required")
		}
		if _, ok := seen[tagID]; ok {
			continue
		}
		seen[tagID] = struct{}{}
		uniqueTagIDs = append(uniqueTagIDs, tagID)
	}

	if _, err := writer.Exec(ctx, replacePostTagsQuery, postID, uniqueTagIDs); err != nil {
		return err
	}
	return nil
}
