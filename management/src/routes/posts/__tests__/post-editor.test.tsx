import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it } from "vitest";

import { PostEditorRoute } from "../PostEditorRoute";

type BuildPayloadOptions = {
  postOverrides?: Partial<Record<string, unknown>>;
};

function renderPostEditor(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <MemoryRouter initialEntries={["/posts/post-1"]}>
        <Routes>
          <Route path="/posts/:postId" element={<PostEditorRoute />} />
          <Route path="/posts" element={<div data-testid="posts-list">Posts list</div>} />
        </Routes>
      </MemoryRouter>
    </RelayEnvironmentProvider>,
  );
  return environment;
}

function buildQueryPayload({ postOverrides = {} }: BuildPayloadOptions = {}) {
  return {
    post: {
      __typename: "Post",
      id: "post-1",
      title: "Launch announcement",
      slug: "launch-announcement",
      status: "draft",
      type: "post",
      excerpt: "Initial excerpt",
      content: "Initial content",
      seo: { description: "Initial" },
      publishedAt: "2024-01-01T12:00:00.000Z",
      featuredMediaID: "media-1",
      featuredMedia: {
        __typename: "Media",
        id: "media-1",
        title: "Hero image",
        url: "https://example.com/hero.jpg",
      },
      categories: [
        { __typename: "Category", id: "cat-1", name: "News" },
        { __typename: "Category", id: "cat-2", name: "Product" },
      ],
      tags: [
        { __typename: "Tag", id: "tag-1", name: "Launch" },
      ],
      ...postOverrides,
    },
    categories: {
      __typename: "CategoryConnection",
      edges: [
        { __typename: "CategoryEdge", node: { __typename: "Category", id: "cat-1", name: "News" } },
        { __typename: "CategoryEdge", node: { __typename: "Category", id: "cat-2", name: "Product" } },
      ],
    },
    tags: {
      __typename: "TagConnection",
      edges: [
        { __typename: "TagEdge", node: { __typename: "Tag", id: "tag-1", name: "Launch" } },
        { __typename: "TagEdge", node: { __typename: "Tag", id: "tag-2", name: "Update" } },
      ],
    },
    medias: {
      __typename: "MediaConnection",
      edges: [
        {
          __typename: "MediaEdge",
          node: { __typename: "Media", id: "media-1", title: "Hero image", url: "https://example.com/hero.jpg" },
        },
        {
          __typename: "MediaEdge",
          node: { __typename: "Media", id: "media-2", title: "Secondary", url: "https://example.com/secondary.jpg" },
        },
      ],
    },
  };
}

describe("PostEditorRoute", () => {
  it("saves updates and commits the updatePost mutation", async () => {
    const environment = renderPostEditor();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildQueryPayload() });
    });

    const titleInput = await screen.findByLabelText("Title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated headline");

    const slugInput = screen.getByLabelText("Slug");
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, "updated-headline");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "published");
    await userEvent.selectOptions(screen.getByLabelText("Type"), "page");

    const publishInput = screen.getByLabelText("Publish at");
    await userEvent.clear(publishInput);
    await userEvent.type(publishInput, "2024-05-01T15:30");

    const excerptField = screen.getByRole("textbox", { name: "Excerpt" });
    await userEvent.clear(excerptField);
    await userEvent.type(excerptField, "Updated excerpt");

    const contentField = screen.getByRole("textbox", { name: "Content" });
    await userEvent.clear(contentField);
    await userEvent.type(contentField, "Updated content body");

    const seoField = screen.getByLabelText("SEO JSON");
    await userEvent.clear(seoField);
    await act(async () => {
      fireEvent.change(seoField, { target: { value: '{"description":"Updated"}' } });
    });

    const categoryNews = screen.getByRole("checkbox", { name: "News" });
    const categoryProduct = screen.getByRole("checkbox", { name: "Product" });
    if (categoryNews.checked) {
      await userEvent.click(categoryNews);
    }
    if (!categoryProduct.checked) {
      await userEvent.click(categoryProduct);
    }

    const tagLaunch = screen.getByRole("checkbox", { name: "Launch" });
    const tagUpdate = screen.getByRole("checkbox", { name: "Update" });
    if (!tagLaunch.checked) {
      await userEvent.click(tagLaunch);
    }
    if (!tagUpdate.checked) {
      await userEvent.click(tagUpdate);
    }

    await userEvent.selectOptions(screen.getByLabelText("Select a featured asset"), "media-2");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("PostEditorUpdatePostMutation");

    const input = mutationOperation.request.variables.input;
    expect(input.id).toBe("post-1");
    expect(input.title).toBe("Updated headline");
    expect(input.slug).toBe("updated-headline");
    expect(input.status).toBe("published");
    expect(input.type).toBe("page");
    expect(input.excerpt).toBe("Updated excerpt");
    expect(input.content).toBe("Updated content body");
    expect(input.featuredMediaID).toBe("media-2");
    expect(new Set(input.categoryIDs)).toEqual(new Set(["cat-2"]));
    expect(new Set(input.tagIDs)).toEqual(new Set(["tag-1", "tag-2"]));
    expect(input.seo).toEqual({ description: "Updated" });
    expect(input.publishedAt).toBe(new Date("2024-05-01T15:30").toISOString());

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          updatePost: {
            __typename: "UpdatePostPayload",
            post: {
              __typename: "Post",
              id: "post-1",
              title: "Updated headline",
              slug: "updated-headline",
              status: "published",
              type: "page",
              excerpt: "Updated excerpt",
              content: "Updated content body",
              seo: { description: "Updated" },
              publishedAt: "2024-05-01T15:30:00.000Z",
              featuredMediaID: "media-2",
              featuredMedia: {
                __typename: "Media",
                id: "media-2",
                title: "Secondary",
                url: "https://example.com/secondary.jpg",
              },
              categories: [
                { __typename: "Category", id: "cat-2", name: "Product" },
              ],
              tags: [
                { __typename: "Tag", id: "tag-1", name: "Launch" },
                { __typename: "Tag", id: "tag-2", name: "Update" },
              ],
            },
          },
        },
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Post updated successfully.");
  });

  it("shows validation errors when required fields are empty or SEO JSON is invalid", async () => {
    const environment = renderPostEditor();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildQueryPayload() });
    });

    const titleInput = await screen.findByLabelText("Title");
    await userEvent.clear(titleInput);
    const slugInput = screen.getByLabelText("Slug");
    await userEvent.clear(slugInput);
    const seoField = screen.getByLabelText("SEO JSON");
    await userEvent.clear(seoField);
    await act(async () => {
      fireEvent.change(seoField, { target: { value: "not-json" } });
    });

    const operationsBeforeSave = environment.mock.getAllOperations().length;
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Slug is required.")).toBeInTheDocument();
    expect(screen.getByText("SEO JSON must be valid JSON.")).toBeInTheDocument();
    expect(environment.mock.getAllOperations().length).toBe(operationsBeforeSave);
  });

  it("navigates back to the posts list", async () => {
    const environment = renderPostEditor();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildQueryPayload() });
    });

    const backLink = await screen.findByRole("link", { name: "← Back to posts" });
    await userEvent.click(backLink);

    await waitFor(() => {
      expect(screen.getByTestId("posts-list")).toBeInTheDocument();
    });
  });
});
