import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { graphql, useMutation } from "react-relay";

import type { PostEditorRouteQuery$data } from "../__generated__/PostEditorRouteQuery.graphql";
import type { PostEditorUpdatePostMutation } from "../__generated__/PostEditorUpdatePostMutation.graphql";
import { PostRelationshipsSelector } from "./PostRelationshipsSelector";

type CategoryNode = NonNullable<
  NonNullable<PostEditorRouteQuery$data["categories"]>["edges"][number]
>["node"];

type TagNode = NonNullable<
  NonNullable<PostEditorRouteQuery$data["tags"]>["edges"][number]
>["node"];

type MediaNode = NonNullable<
  NonNullable<PostEditorRouteQuery$data["medias"]>["edges"][number]
>["node"];

type PostEditorProps = {
  post: NonNullable<PostEditorRouteQuery$data["post"]>;
  categories: CategoryNode[];
  tags: TagNode[];
  media: MediaNode[];
};

type FormState = {
  title: string;
  slug: string;
  status: string;
  type: string;
  excerpt: string;
  content: string;
  seoDraft: string;
  publishedAt: string;
  featuredMediaID: string | null;
  categoryIDs: string[];
  tagIDs: string[];
};

type ValidationErrors = Partial<Record<"title" | "slug" | "seo", string>>;

const updatePostMutation = graphql`
  mutation PostEditorUpdatePostMutation($input: UpdatePostInput!) {
    updatePost(input: $input) {
      post {
        id
        title
        slug
        status
        type
        excerpt
        content
        seo
        publishedAt
        featuredMediaID
        featuredMedia {
          id
          title
          url
        }
        categories {
          id
          name
        }
        tags {
          id
          name
        }
      }
    }
  }
`;

function formatSeo(value: unknown): string {
  try {
    if (value === null || value === undefined) {
      return "";
    }
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return "";
  }
}

function toDateInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildInitialState(post: NonNullable<PostEditorRouteQuery$data["post"]>): FormState {
  return {
    title: post.title ?? "",
    slug: post.slug ?? "",
    status: post.status ?? "draft",
    type: post.type ?? "post",
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",
    seoDraft: formatSeo(post.seo),
    publishedAt: toDateInput(post.publishedAt ?? null),
    featuredMediaID: post.featuredMediaID ?? null,
    categoryIDs: post.categories?.map((category) => category?.id).filter(Boolean) as string[],
    tagIDs: post.tags?.map((tag) => tag?.id).filter(Boolean) as string[],
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function PostEditor({ post, categories, tags, media }: PostEditorProps) {
  const [commitUpdate, isInFlight] = useMutation<PostEditorUpdatePostMutation>(updatePostMutation);
  const [formState, setFormState] = useState<FormState>(() => buildInitialState(post));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const lastPostIdRef = useRef(post.id);

  useEffect(() => {
    setFormState(buildInitialState(post));
    setErrors({});
  }, [post]);

  useEffect(() => {
    if (lastPostIdRef.current !== post.id) {
      lastPostIdRef.current = post.id;
      setStatusMessage(null);
    }
  }, [post.id]);

  const initialState = useMemo(() => buildInitialState(post), [post]);

  const hasChanges = useMemo(() => {
    return (
      formState.title !== initialState.title ||
      formState.slug !== initialState.slug ||
      formState.status !== initialState.status ||
      formState.type !== initialState.type ||
      formState.excerpt !== initialState.excerpt ||
      formState.content !== initialState.content ||
      formState.seoDraft !== initialState.seoDraft ||
      formState.publishedAt !== initialState.publishedAt ||
      formState.featuredMediaID !== initialState.featuredMediaID ||
      !arraysEqual(formState.categoryIDs, initialState.categoryIDs) ||
      !arraysEqual(formState.tagIDs, initialState.tagIDs)
    );
  }, [formState, initialState]);

  const handleFieldChange = (
    field: keyof FormState,
    value: string | string[] | null,
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleTextChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    handleFieldChange(field, event.target.value);
  };

  const handleTextareaChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    handleFieldChange(field, event.target.value);
  };

  const handleCategoryToggle = (categoryId: string, selected: boolean) => {
    setFormState((current) => {
      const next = new Set(current.categoryIDs);
      if (selected) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }
      return {
        ...current,
        categoryIDs: Array.from(next),
      };
    });
  };

  const handleTagToggle = (tagId: string, selected: boolean) => {
    setFormState((current) => {
      const next = new Set(current.tagIDs);
      if (selected) {
        next.add(tagId);
      } else {
        next.delete(tagId);
      }
      return {
        ...current,
        tagIDs: Array.from(next),
      };
    });
  };

  const handleMediaChange = (mediaId: string | null) => {
    handleFieldChange("featuredMediaID", mediaId);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ValidationErrors = {};
    const trimmedTitle = formState.title.trim();
    const trimmedSlug = formState.slug.trim();

    if (!trimmedTitle) {
      nextErrors.title = "Title is required.";
    }

    if (!trimmedSlug) {
      nextErrors.slug = "Slug is required.";
    }

    let seoValue: unknown = null;
    const seoDraft = formState.seoDraft.trim();

    if (seoDraft) {
      try {
        seoValue = JSON.parse(seoDraft);
      } catch (error) {
        nextErrors.seo = "SEO JSON must be valid JSON.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage(null);
      return;
    }

    setErrors({});

    const publishedAtISO = formState.publishedAt
      ? new Date(formState.publishedAt).toISOString()
      : null;

    commitUpdate({
      variables: {
        input: {
          id: post.id,
          title: trimmedTitle,
          slug: trimmedSlug,
          status: formState.status,
          type: formState.type,
          excerpt: formState.excerpt.trim() || null,
          content: formState.content.trim() || null,
          seo: seoValue,
          publishedAt: publishedAtISO,
          featuredMediaID: formState.featuredMediaID,
          categoryIDs: formState.categoryIDs,
          tagIDs: formState.tagIDs,
        },
      },
      onCompleted: () => {
        setStatusMessage("Post updated successfully.");
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="post-editor" aria-labelledby="post-editor-heading">
      <h2 id="post-editor-heading">Post details</h2>
      <p className="post-editor__intro">
        Update the core content and metadata for this post. Changes are saved immediately after
        clicking the save button below.
      </p>
      <div className="post-editor__grid">
        <section className="post-editor__panel" aria-labelledby="post-content-heading">
          <h3 id="post-content-heading">Content</h3>
          <label className="post-editor__field">
            <span>Title</span>
            <input
              value={formState.title}
              onChange={handleTextChange("title")}
              aria-invalid={Boolean(errors.title)}
            />
          </label>
          {errors.title ? (
            <p role="alert" className="post-editor__error">
              {errors.title}
            </p>
          ) : null}
          <label className="post-editor__field">
            <span>Slug</span>
            <input
              value={formState.slug}
              onChange={handleTextChange("slug")}
              aria-invalid={Boolean(errors.slug)}
            />
          </label>
          {errors.slug ? (
            <p role="alert" className="post-editor__error">
              {errors.slug}
            </p>
          ) : null}
          <div className="post-editor__field-group">
            <label className="post-editor__field">
              <span>Status</span>
              <select value={formState.status} onChange={handleTextChange("status")}> 
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="private">Private</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="post-editor__field">
              <span>Type</span>
              <select value={formState.type} onChange={handleTextChange("type")}>
                <option value="post">Post</option>
                <option value="page">Page</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <label className="post-editor__field">
            <span>Publish at</span>
            <input
              type="datetime-local"
              value={formState.publishedAt}
              onChange={handleTextChange("publishedAt")}
            />
          </label>
          <label className="post-editor__field post-editor__field--stacked">
            <span>Excerpt</span>
            <textarea value={formState.excerpt} onChange={handleTextareaChange("excerpt")} rows={4} />
          </label>
          <label className="post-editor__field post-editor__field--stacked">
            <span>Content</span>
            <textarea value={formState.content} onChange={handleTextareaChange("content")} rows={8} />
          </label>
        </section>
        <section className="post-editor__panel" aria-labelledby="post-seo-heading">
          <h3 id="post-seo-heading">SEO</h3>
          <p className="post-editor__section-intro">
            Provide structured metadata in JSON format to enhance search engine appearance.
          </p>
          <label className="post-editor__field post-editor__field--stacked">
            <span>SEO JSON</span>
            <textarea
              value={formState.seoDraft}
              onChange={handleTextareaChange("seoDraft")}
              aria-invalid={Boolean(errors.seo)}
              rows={10}
            />
          </label>
          {errors.seo ? (
            <p role="alert" className="post-editor__error">
              {errors.seo}
            </p>
          ) : null}
        </section>
      </div>
      <PostRelationshipsSelector
        categories={categories}
        tags={tags}
        media={media}
        selectedCategoryIds={formState.categoryIDs}
        selectedTagIds={formState.tagIDs}
        selectedMediaId={formState.featuredMediaID}
        onCategoryToggle={handleCategoryToggle}
        onTagToggle={handleTagToggle}
        onMediaChange={handleMediaChange}
      />
      {statusMessage ? (
        <p role="status" className="post-editor__status">
          {statusMessage}
        </p>
      ) : null}
      <div className="post-editor__actions">
        <button type="submit" disabled={!hasChanges || isInFlight}>
          {isInFlight ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default PostEditor;
