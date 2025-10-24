import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { graphql, useFragment, useMutation } from "react-relay";

import type { CategoryEditorFragment$key } from "./__generated__/CategoryEditorFragment.graphql";
import type { CategoryEditorCreateCategoryMutation } from "./__generated__/CategoryEditorCreateCategoryMutation.graphql";
import type { CategoryEditorDeleteCategoryMutation } from "./__generated__/CategoryEditorDeleteCategoryMutation.graphql";
import type { CategoryEditorUpdateCategoryMutation } from "./__generated__/CategoryEditorUpdateCategoryMutation.graphql";
import { CategoryHierarchy } from "./CategoryHierarchy";
import type { CategoryHierarchyFragment$key } from "./__generated__/CategoryHierarchyFragment.graphql";

type CategoryEditorProps = {
  connectionRef: CategoryEditorFragment$key | null;
  onRefresh: () => void;
};

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentID: string | null;
};

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parentID: string;
};

type ValidationErrors = Partial<Record<keyof CategoryFormState, string>>;

const initialFormState: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  parentID: "",
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const categoryEditorFragment = graphql`
  fragment CategoryEditorFragment on CategoryConnection {
    totalCount
    edges {
      node {
        id
        name
        slug
        description
        parentID
      }
    }
  }
`;

const createCategoryMutation = graphql`
  mutation CategoryEditorCreateCategoryMutation($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      category {
        id
        name
        slug
        description
        parentID
      }
    }
  }
`;

const updateCategoryMutation = graphql`
  mutation CategoryEditorUpdateCategoryMutation($input: UpdateCategoryInput!) {
    updateCategory(input: $input) {
      category {
        id
        name
        slug
        description
        parentID
      }
    }
  }
`;

const deleteCategoryMutation = graphql`
  mutation CategoryEditorDeleteCategoryMutation($input: DeleteCategoryInput!) {
    deleteCategory(input: $input) {
      deletedCategoryID
    }
  }
`;

export function CategoryEditor({ connectionRef, onRefresh }: CategoryEditorProps) {
  const data = useFragment(categoryEditorFragment, connectionRef);
  const categories = useMemo<CategoryNode[]>(() => {
    return (data?.edges ?? [])
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .map((node) => ({
        id: node.id,
        name: node.name ?? "Untitled category",
        slug: node.slug ?? "",
        description: node.description ?? "",
        parentID: node.parentID ?? null,
      }));
  }, [data]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId],
  );

  const [commitCreate, isCreating] = useMutation<CategoryEditorCreateCategoryMutation>(
    createCategoryMutation,
  );
  const [commitUpdate, isUpdating] = useMutation<CategoryEditorUpdateCategoryMutation>(
    updateCategoryMutation,
  );
  const [commitDelete, isDeleting] = useMutation<CategoryEditorDeleteCategoryMutation>(
    deleteCategoryMutation,
  );

  const isSubmitting = isCreating || isUpdating;

  const resetForm = (preserveStatus = false) => {
    setFormState(initialFormState);
    setErrors({});
    if (!preserveStatus) {
      setStatusMessage(null);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    if (selectedId === categoryId && mode === "edit") {
      return;
    }
    setMode("edit");
    setSelectedId(categoryId);
    const nextCategory = categories.find((category) => category.id === categoryId);
    if (nextCategory) {
      setFormState({
        name: nextCategory.name,
        slug: nextCategory.slug,
        description: nextCategory.description,
        parentID: nextCategory.parentID ?? "",
      });
      setStatusMessage(null);
      setErrors({});
    }
  };

  const handleCreateMode = (options?: { preserveStatus?: boolean }) => {
    setMode("create");
    setSelectedId(null);
    resetForm(options?.preserveStatus === true);
  };

  const validate = (state: CategoryFormState): ValidationErrors => {
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
    if (state.parentID && state.parentID === selectedId) {
      validation.parentID = "A category cannot be its own parent.";
    }
    return validation;
  };

  const handleChange = (field: keyof CategoryFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
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
      parentID: formState.parentID ? formState.parentID : null,
    };

    if (mode === "create") {
      commitCreate({
        variables: { input },
        onCompleted: () => {
          handleCreateMode({ preserveStatus: true });
          setStatusMessage("Category created successfully.");
          onRefresh();
        },
        onError: (error) => {
          setStatusMessage(error.message);
        },
      });
      return;
    }

    if (!selectedCategory) {
      setStatusMessage("Select a category to update.");
      return;
    }

    commitUpdate({
      variables: {
        input: {
          id: selectedCategory.id,
          ...input,
        },
      },
      onCompleted: () => {
        setStatusMessage("Category updated successfully.");
        onRefresh();
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedCategory) {
      setStatusMessage("Select a category to delete.");
      return;
    }
    commitDelete({
      variables: { input: { id: selectedCategory.id } },
      onCompleted: () => {
        handleCreateMode({ preserveStatus: true });
        setStatusMessage("Category deleted successfully.");
        onRefresh();
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  const parentOptions = useMemo(() => {
    return categories.filter((category) => category.id !== selectedCategory?.id);
  }, [categories, selectedCategory?.id]);

  return (
    <section className="category-editor" aria-labelledby="category-editor-heading">
      <div className="category-editor__toolbar">
        <button type="button" onClick={handleCreateMode} className="category-editor__create">
          Add category
        </button>
        <span className="category-editor__total" aria-live="polite">
          Total categories: {data?.totalCount ?? 0}
        </span>
      </div>
      {connectionRef ? (
        <CategoryHierarchy
          connectionRef={connectionRef as unknown as CategoryHierarchyFragment$key}
          onSelect={handleSelectCategory}
          selectedId={selectedId}
        />
      ) : null}
      <form className="category-editor__form" onSubmit={handleSubmit} noValidate>
        <h3 id="category-editor-heading">
          {mode === "create" ? "Create a new category" : "Edit category"}
        </h3>
        <label>
          <span>Name</span>
          <input
            name="name"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "category-name-error" : undefined}
          />
        </label>
        {errors.name ? (
          <p id="category-name-error" role="alert" className="category-editor__error">
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
            aria-describedby={errors.slug ? "category-slug-error" : undefined}
          />
        </label>
        {errors.slug ? (
          <p id="category-slug-error" role="alert" className="category-editor__error">
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
        <label>
          <span>Parent category</span>
          <select
            name="parentID"
            value={formState.parentID}
            onChange={(event) => handleChange("parentID", event.target.value)}
            aria-invalid={errors.parentID ? "true" : undefined}
            aria-describedby={errors.parentID ? "category-parent-error" : undefined}
          >
            <option value="">No parent</option>
            {parentOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {errors.parentID ? (
          <p id="category-parent-error" role="alert" className="category-editor__error">
            {errors.parentID}
          </p>
        ) : null}
        <div className="category-editor__actions">
          <button type="submit" disabled={isSubmitting}>
            {mode === "create" ? "Create category" : "Update category"}
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="category-editor__delete"
            >
              Delete category
            </button>
          ) : null}
        </div>
        {statusMessage ? (
          <p className="category-editor__status" role="status">
            {statusMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}

export default CategoryEditor;
