import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MEDIA_PAGE_SIZE, MediaRoute } from "../../media";

function renderMedia(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <MediaRoute />
    </RelayEnvironmentProvider>,
  );
  return environment;
}

type MediaNodeInput = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedByID?: string | null;
  createdAt: string;
  updatedAt: string;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  url?: string | null;
};

function buildMediaPayload(
  medias: MediaNodeInput[],
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null },
) {
  const edges = medias.map((media, index) => ({
    cursor: `cursor-${index + 1}`,
    node: {
      __typename: "Media",
      ...media,
      uploadedByID: media.uploadedByID ?? null,
      title: media.title ?? null,
      altText: media.altText ?? null,
      caption: media.caption ?? null,
      description: media.description ?? null,
      url: media.url ?? null,
    },
  }));

  return {
    medias: {
      __typename: "MediaConnection",
      totalCount: medias.length,
      edges,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: pageInfo?.hasNextPage ?? false,
        hasPreviousPage: false,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: pageInfo?.endCursor ?? edges[edges.length - 1]?.cursor ?? null,
      },
    },
  };
}

describe("MediaRoute", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error -- reset fetch to undefined when not provided
      delete global.fetch;
    }
    vi.restoreAllMocks();
  });

  it("renders media entries in a table with metadata", async () => {
    const environment = renderMedia();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildMediaPayload([
          {
            id: "media-1",
            fileName: "banner.jpg",
            mimeType: "image/jpeg",
            fileSizeBytes: 204800,
            uploadedByID: "user-1",
            createdAt: "2024-10-10T10:00:00.000Z",
            updatedAt: "2024-10-11T11:00:00.000Z",
            title: "Homepage banner",
            url: "https://cdn.example/banner.jpg",
          },
        ]),
      });
    });

    const table = await screen.findByRole("table");
    const row = within(table).getByRole("row", { name: /banner\.jpg/ });
    expect(within(row).getByText("image/jpeg")).toBeInTheDocument();
    expect(within(row).getByText(/200 KB/)).toBeInTheDocument();
    expect(within(row).getByText("user-1")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Edit metadata" })).toBeInTheDocument();
  });

  it("loads additional pages when requesting more entries", async () => {
    const environment = renderMedia();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildMediaPayload(
          [
            {
              id: "media-1",
              fileName: "cover.png",
              mimeType: "image/png",
              fileSizeBytes: 1024,
              uploadedByID: "user-1",
              createdAt: "2024-10-10T10:00:00.000Z",
              updatedAt: "2024-10-10T10:00:00.000Z",
              url: "https://cdn.example/cover.png",
            },
          ],
          { hasNextPage: true, endCursor: "cursor-1" },
        ),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    const paginationOperation = environment.mock.getMostRecentOperation();
    expect(paginationOperation.fragment.node.name).toBe("MediaLibraryPaginationQuery");
    expect(paginationOperation.request.variables).toMatchObject({ first: MEDIA_PAGE_SIZE });
  });

  it("uploads a file via the storage endpoint before creating the media entry", async () => {
    const environment = renderMedia();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildMediaPayload([]) });
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ storageKey: "storage-key", url: "https://cdn.example/media.png" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await userEvent.click(screen.getByRole("button", { name: "Upload media" }));

    const fileInput = screen.getByLabelText("Select file");
    const file = new File(["media"], "upload.png", { type: "image/png" });
    await userEvent.upload(fileInput, file);
    await userEvent.type(screen.getByLabelText("Title"), "Uploaded asset");
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/storage/upload",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );

    const fetchCall = fetchMock.mock.calls[0];
    const requestBody = fetchCall?.[1]?.body as FormData | undefined;
    expect(requestBody).toBeInstanceOf(FormData);
    expect(requestBody?.get("file")).toBeDefined();

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("MediaUploadDialogCreateMediaMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      fileName: "upload.png",
      mimeType: "image/png",
      fileSizeBytes: file.size,
      storageKey: "storage-key",
      url: "https://cdn.example/media.png",
      title: "Uploaded asset",
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          createMedia: {
            __typename: "CreateMediaPayload",
            media: {
              __typename: "Media",
              id: "media-2",
              fileName: "upload.png",
              mimeType: "image/png",
              fileSizeBytes: file.size,
              uploadedByID: null,
              createdAt: "2024-10-12T12:00:00.000Z",
              updatedAt: "2024-10-12T12:00:00.000Z",
              title: "Uploaded asset",
              altText: null,
              caption: null,
              description: null,
              url: "https://cdn.example/media.png",
            },
          },
        },
      });
      await Promise.resolve();
    });

    const refetchOperation = environment.mock.getMostRecentOperation();
    expect(refetchOperation.fragment.node.name).toBe("MediaLibraryPaginationQuery");

    await act(async () => {
      environment.mock.resolve(refetchOperation, {
        data: buildMediaPayload([
          {
            id: "media-2",
            fileName: "upload.png",
            mimeType: "image/png",
            fileSizeBytes: file.size,
            uploadedByID: null,
            createdAt: "2024-10-12T12:00:00.000Z",
            updatedAt: "2024-10-12T12:00:00.000Z",
            title: "Uploaded asset",
            altText: null,
            caption: null,
            description: null,
            url: "https://cdn.example/media.png",
          },
        ]),
      });
    });

    await screen.findByText("Media uploaded successfully.");
  });

  it("surfaces errors when the storage upload fails", async () => {
    const environment = renderMedia();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, { data: buildMediaPayload([]) });
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    global.fetch = fetchMock as unknown as typeof fetch;

    await userEvent.click(screen.getByRole("button", { name: "Upload media" }));

    const fileInput = screen.getByLabelText("Select file");
    await userEvent.upload(fileInput, new File(["media"], "failed.png", { type: "image/png" }));
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    await screen.findByText("Uploading the file failed. Check the storage service and retry.");
    expect(environment.mock.getAllOperations().filter((op) => op.fragment.node.name === "MediaUploadDialogCreateMediaMutation")).toHaveLength(0);
  });

  it("edits media metadata via the updateMedia mutation", async () => {
    const environment = renderMedia();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildMediaPayload([
          {
            id: "media-1",
            fileName: "hero.jpg",
            mimeType: "image/jpeg",
            fileSizeBytes: 4096,
            uploadedByID: "uploader-1",
            createdAt: "2024-10-10T10:00:00.000Z",
            updatedAt: "2024-10-11T10:00:00.000Z",
            title: "Hero",
            altText: "Old alt",
            caption: "Old caption",
            description: "Old description",
            url: "https://cdn.example/hero.jpg",
          },
        ]),
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit metadata" }));

    const titleField = screen.getByLabelText("Title");
    await userEvent.clear(titleField);
    await userEvent.type(titleField, "Updated hero");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const mutationOperation = environment.mock.getMostRecentOperation();
    expect(mutationOperation.fragment.node.name).toBe("MediaEditDialogUpdateMediaMutation");
    expect(mutationOperation.request.variables.input).toMatchObject({
      id: "media-1",
      title: "Updated hero",
      altText: "Old alt",
      caption: "Old caption",
      description: "Old description",
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          updateMedia: {
            __typename: "UpdateMediaPayload",
            media: {
              __typename: "Media",
              id: "media-1",
              title: "Updated hero",
              altText: "Old alt",
              caption: "Old caption",
              description: "Old description",
              updatedAt: "2024-10-12T12:00:00.000Z",
            },
          },
        },
      });
      await Promise.resolve();
    });

    await screen.findByText("Media metadata updated successfully.");
    expect(screen.queryByRole("dialog", { name: /Edit metadata/ })).not.toBeInTheDocument();
  });
});
