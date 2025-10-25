import type { ChangeEvent } from "react";

type CategoryOption = {
  id: string;
  name: string;
};

type TagOption = {
  id: string;
  name: string;
};

type MediaOption = {
  id: string;
  title?: string | null;
  url?: string | null;
};

type PostRelationshipsSelectorProps = {
  categories: CategoryOption[];
  tags: TagOption[];
  media: MediaOption[];
  selectedCategoryIds: string[];
  selectedTagIds: string[];
  selectedMediaId: string | null;
  onCategoryToggle: (categoryId: string, selected: boolean) => void;
  onTagToggle: (tagId: string, selected: boolean) => void;
  onMediaChange: (mediaId: string | null) => void;
};

export function PostRelationshipsSelector({
  categories,
  tags,
  media,
  selectedCategoryIds,
  selectedTagIds,
  selectedMediaId,
  onCategoryToggle,
  onTagToggle,
  onMediaChange,
}: PostRelationshipsSelectorProps) {
  const handleMediaChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onMediaChange(value === "" ? null : value);
  };

  return (
    <section className="post-editor__relationships" aria-labelledby="post-relationships-heading">
      <h3 id="post-relationships-heading">Relationships</h3>
      <p className="post-editor__section-intro">
        Associate the post with featured media, categories, and tags to improve discovery and
        presentation across the site.
      </p>
      <div className="post-editor__relationship-grid">
        <fieldset className="post-editor__relationship-group">
          <legend>Featured media</legend>
          <label className="post-editor__field post-editor__field--stacked">
            <span>Select a featured asset</span>
            <select value={selectedMediaId ?? ""} onChange={handleMediaChange}>
              <option value="">No featured media</option>
              {media.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title?.trim() || item.url || item.id}
                </option>
              ))}
            </select>
          </label>
          {media.length === 0 ? (
            <p className="post-editor__hint">Upload media to feature it in posts.</p>
          ) : null}
        </fieldset>
        <fieldset className="post-editor__relationship-group">
          <legend>Categories</legend>
          {categories.length === 0 ? (
            <p className="post-editor__hint">No categories available yet.</p>
          ) : (
            <ul className="post-editor__relationship-list">
              {categories.map((category) => {
                const inputId = `category-${category.id}`;
                const checked = selectedCategoryIds.includes(category.id);
                return (
                  <li key={category.id}>
                    <label className="post-editor__checkbox">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onCategoryToggle(category.id, event.target.checked)}
                      />
                      <span>{category.name ?? category.id}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>
        <fieldset className="post-editor__relationship-group">
          <legend>Tags</legend>
          {tags.length === 0 ? (
            <p className="post-editor__hint">Create tags to organize related content.</p>
          ) : (
            <ul className="post-editor__relationship-list">
              {tags.map((tag) => {
                const inputId = `tag-${tag.id}`;
                const checked = selectedTagIds.includes(tag.id);
                return (
                  <li key={tag.id}>
                    <label className="post-editor__checkbox">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onTagToggle(tag.id, event.target.checked)}
                      />
                      <span>{tag.name ?? tag.id}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>
      </div>
    </section>
  );
}

export default PostRelationshipsSelector;
