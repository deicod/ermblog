import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { graphql, useFragment, useMutation } from "react-relay";

import type { TagEditorFragment$key } from "./__generated__/TagEditorFragment.graphql";
import type { TagEditorCreateTagMutation } from "./__generated__/TagEditorCreateTagMutation.graphql";
import type { TagEditorDeleteTagMutation } from "./__generated__/TagEditorDeleteTagMutation.graphql";
import type { TagEditorUpdateTagMutation } from "./__generated__/TagEditorUpdateTagMutation.graphql";
import { TagList } from "./TagList";
import type { TagListFragment$key } from "./__generated__/TagListFragment.graphql";

type TagEditorProps = {
  connectionRef: TagEditorFragment$key | null;
  onRefresh: () => void;
};

type TagNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

type TagFormState = {
  name: string;
  slug: string;
  description: string;
};

type ValidationErrors = Partial<Record<keyof TagFormState, string>>;

const initialFormState: TagFormState = {
  name: "",
  slug: "",
  description: "",
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const tagEditorFragment = graphql`
  fragment TagEditorFragment on TagConnection {
    totalCount
    edges {
      node {
        id
        name
        slug
        description
      }
    }
  }
`;

const createTagMutation = graphql`
  mutation TagEditorCreateTagMutation($input: CreateTagInput!) {
    createTag(input: $input) {
      tag {
        id
        name
        slug
        description
      }
    }
  }
`;

const updateTagMutation = graphql`
  mutation TagEditorUpdateTagMutation($input: UpdateTagInput!) {
    updateTag(input: $input) {
      tag {
        id
        name
        slug
        description
      }
    }
  }
`;

const deleteTagMutation = graphql`
  mutation TagEditorDeleteTagMutation($input: DeleteTagInput!) {
    deleteTag(input: $input) {
      deletedTagID
    }
  }
`;

export function TagEditor({ connectionRef, onRefresh }: TagEditorProps) {
  const data = useFragment(tagEditorFragment, connectionRef);
  const tags = useMemo<TagNode[]>(() => {
    return (data?.edges ?? [])
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .map((node) => ({
        id: node.id,
        name: node.name ?? "Untitled tag",
        slug: node.slug ?? "",
        description: node.description ?? "",
      }));
  }, [data]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TagFormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.id === selectedId) ?? null,
    [tags, selectedId],
  );

  const [commitCreate, isCreating] = useMutation<TagEditorCreateTagMutation>(createTagMutation);
  const [commitUpdate, isUpdating] = useMutation<TagEditorUpdateTagMutation>(updateTagMutation);
  const [commitDelete, isDeleting] = useMutation<TagEditorDeleteTagMutation>(deleteTagMutation);

  const isSubmitting = isCreating || isUpdating;

  const resetForm = (preserveStatus = false) => {
    setFormState(initialFormState);
    setErrors({});
    if (!preserveStatus) {
      setStatusMessage(null);
    }
  };

  const handleSelectTag = (tagId: string) => {
    if (selectedId === tagId && mode === "edit") {
      return;
    }
    setMode("edit");
    setSelectedId(tagId);
    const nextTag = tags.find((tag) => tag.id === tagId);
    if (nextTag) {
      setFormState({
        name: nextTag.name,
        slug: nextTag.slug,
        description: nextTag.description,
      });
      setErrors({});
      setStatusMessage(null);
    }
  };

  const handleCreateMode = (options?: { preserveStatus?: boolean }) => {
    setMode("create");
    setSelectedId(null);
    resetForm(options?.preserveStatus === true);
  };

  const handleChange = (field: keyof TagFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const validate = (state: TagFormState): ValidationErrors => {
    const validation: ValidationErrors = {};
    if (!state.name.trim()) {
      validation.name = "Name is required.";
    }
    const slug = state.slug.trim();
    if (!slug) {
      validation.slug = "Slug is required.";
    } else if (!slugPattern.test(slug)) {
      validation.slug = "Slugs may only contain lowercase letters, numbers, and hyphens.";
    }
    return validation;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(formState);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setStatusMessage(null);

    const input = {
      name: formState.name.trim(),
      slug: formState.slug.trim(),
      description: formState.description.trim() || null,
    };

    if (mode === "create") {
      commitCreate({
        variables: { input },
        onCompleted: () => {
          handleCreateMode({ preserveStatus: true });
          setStatusMessage("Tag created successfully.");
          onRefresh();
        },
        onError: (error) => {
          setStatusMessage(error.message);
        },
      });
      return;
    }

    if (!selectedTag) {
      setStatusMessage("Select a tag to update.");
      return;
    }

    commitUpdate({
      variables: {
        input: {
          id: selectedTag.id,
          ...input,
        },
      },
      onCompleted: () => {
        setStatusMessage("Tag updated successfully.");
        onRefresh();
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedTag) {
      setStatusMessage("Select a tag to delete.");
      return;
    }
    commitDelete({
      variables: { input: { id: selectedTag.id } },
      onCompleted: () => {
        handleCreateMode({ preserveStatus: true });
        setStatusMessage("Tag deleted successfully.");
        onRefresh();
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  return (
    <section className="tag-editor" aria-labelledby="tag-editor-heading">
      <div className="tag-editor__toolbar">
        <button type="button" onClick={handleCreateMode} className="tag-editor__create">
          Add tag
        </button>
        <span className="tag-editor__total" aria-live="polite">
          Total tags: {data?.totalCount ?? 0}
        </span>
      </div>
      {connectionRef ? (
        <TagList
          connectionRef={connectionRef as unknown as TagListFragment$key}
          onSelect={handleSelectTag}
          selectedId={selectedId}
        />
      ) : null}
      <form className="tag-editor__form" onSubmit={handleSubmit} noValidate>
        <h3 id="tag-editor-heading">{mode === "create" ? "Create a new tag" : "Edit tag"}</h3>
        <label>
          <span>Name</span>
          <input
            name="name"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "tag-name-error" : undefined}
          />
        </label>
        {errors.name ? (
          <p id="tag-name-error" role="alert" className="tag-editor__error">
            {errors.name}
          </p>
        ) : null}
        <label>
          <span>Slug</span>
          <input
            name="slug"
            value={formState.slug}
            onChange={(event) => handleChange("slug", event.target.value)}
            aria-invalid={errors.slug ? "true" : undefined}
            aria-describedby={errors.slug ? "tag-slug-error" : undefined}
          />
        </label>
        {errors.slug ? (
          <p id="tag-slug-error" role="alert" className="tag-editor__error">
            {errors.slug}
          </p>
        ) : null}
        <label>
          <span>Description</span>
          <textarea
            name="description"
            value={formState.description}
            onChange={(event) => handleChange("description", event.target.value)}
          />
        </label>
        <div className="tag-editor__actions">
          <button type="submit" disabled={isSubmitting}>
            {mode === "create" ? "Create tag" : "Update tag"}
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="tag-editor__delete"
            >
              Delete tag
            </button>
          ) : null}
        </div>
        {statusMessage ? (
          <p className="tag-editor__status" role="status">
            {statusMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}

export default TagEditor;
