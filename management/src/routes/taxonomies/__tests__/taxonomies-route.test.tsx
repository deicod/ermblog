import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it } from "vitest";

import { TaxonomiesRoute } from "../../taxonomies";

type CategoryNodeInput = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentID?: string | null;
};

type TagNodeInput = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

function renderTaxonomies(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <TaxonomiesRoute />
    </RelayEnvironmentProvider>,
  );
  return environment;
}

function buildTaxonomiesPayload(categories: CategoryNodeInput[], tags: TagNodeInput[]) {
  return {
    categories: {
      __typename: "CategoryConnection",
      totalCount: categories.length,
      edges: categories.map((category, index) => ({
        cursor: `cursor-category-${index + 1}`,
        node: {
          __typename: "Category",
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          parentID: category.parentID ?? null,
        },
      })),
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
    tags: {
      __typename: "TagConnection",
      totalCount: tags.length,
      edges: tags.map((tag, index) => ({
        cursor: `cursor-tag-${index + 1}`,
        node: {
          __typename: "Tag",
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description ?? null,
        },
      })),
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
  };
}

describe("TaxonomiesRoute", () => {
  it("switches between category and tag vocabularies", async () => {
    const environment = renderTaxonomies();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildTaxonomiesPayload(
          [
            { id: "cat-1", name: "News", slug: "news" },
            { id: "cat-2", name: "World", slug: "world", parentID: "cat-1" },
          ],
          [
            { id: "tag-1", name: "Politics", slug: "politics" },
            { id: "tag-2", name: "Economy", slug: "economy" },
          ],
        ),
      });
    });

    const hierarchy = await screen.findByRole("tree");
    expect(within(hierarchy).getByRole("button", { name: /News/ })).toBeInTheDocument();
    expect(within(hierarchy).getByRole("button", { name: /World/ })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Vocabulary"), "tags");

    const tagList = await screen.findByRole("list");
    expect(within(tagList).getByRole("button", { name: /Politics/ })).toBeInTheDocument();
    expect(within(tagList).getByRole("button", { name: /Economy/ })).toBeInTheDocument();
  });

  it("creates a new category and refetches the taxonomy data", async () => {
    const environment = renderTaxonomies();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildTaxonomiesPayload(
          [{ id: "cat-1", name: "News", slug: "news" }],
          [],
        ),
      });
    });

    await userEvent.type(screen.getByLabelText("Name"), "Features");
    await userEvent.type(screen.getByLabelText("Slug"), "features");
    await userEvent.click(screen.getByRole("button", { name: "Create category" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("CategoryEditorCreateCategoryMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      name: "Features",
      slug: "features",
      parentID: null,
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          createCategory: {
            __typename: "CreateCategoryPayload",
            category: {
              __typename: "Category",
              id: "cat-2",
              name: "Features",
              slug: "features",
              description: null,
              parentID: null,
            },
          },
        },
      });
      await Promise.resolve();
    });

    await screen.findByText("Category created successfully.");
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Slug")).toHaveValue("");
  });

  it("updates an existing tag", async () => {
    const environment = renderTaxonomies();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildTaxonomiesPayload(
          [],
          [
            { id: "tag-1", name: "Politics", slug: "politics" },
            { id: "tag-2", name: "Economy", slug: "economy" },
          ],
        ),
      });
    });

    await userEvent.selectOptions(screen.getByLabelText("Vocabulary"), "tags");
    await userEvent.click(screen.getByRole("button", { name: /Economy/ }));

    const slugField = screen.getByLabelText("Slug");
    await userEvent.clear(slugField);
    await userEvent.type(slugField, "global-economy");
    await userEvent.click(screen.getByRole("button", { name: "Update tag" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("TagEditorUpdateTagMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      id: "tag-2",
      slug: "global-economy",
      name: "Economy",
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          updateTag: {
            __typename: "UpdateTagPayload",
            tag: {
              __typename: "Tag",
              id: "tag-2",
              name: "Economy",
              slug: "global-economy",
              description: null,
            },
          },
        },
      });
      await Promise.resolve();
    });

    await screen.findByText("Tag updated successfully.");
    expect(screen.getByLabelText("Slug")).toHaveValue("global-economy");
  });

  it("deletes a selected category", async () => {
    const environment = renderTaxonomies();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildTaxonomiesPayload(
          [
            { id: "cat-1", name: "News", slug: "news" },
            { id: "cat-2", name: "Features", slug: "features" },
          ],
          [],
        ),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: /Features/ }));
    await userEvent.click(screen.getByRole("button", { name: "Delete category" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("CategoryEditorDeleteCategoryMutation");
    expect(mutationOperation.request.variables.input).toEqual({ id: "cat-2" });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          deleteCategory: {
            __typename: "DeleteCategoryPayload",
            deletedCategoryID: "cat-2",
          },
        },
      });
      await Promise.resolve();
    });

    await screen.findByText("Category deleted successfully.");
    expect(screen.getByRole("heading", { name: "Create a new category" })).toBeInTheDocument();
  });
});
