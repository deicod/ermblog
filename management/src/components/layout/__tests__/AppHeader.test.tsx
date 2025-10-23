import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLazyLoadQuery } from "react-relay";

import { LAYOUT_STATUS_TEXT } from "../constants";
import { useAuthActions } from "../../../session/SessionProvider";

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return {
    ...actual,
    useLazyLoadQuery: vi.fn(),
  };
});

vi.mock("../AppHeaderViewerQuery", () => ({
  appHeaderViewerQuery: {},
}));

vi.mock("../../../session/SessionProvider", async () => {
  const actual = await vi.importActual<typeof import("../../../session/SessionProvider")>(
    "../../../session/SessionProvider",
  );
  return {
    ...actual,
    useAuthActions: vi.fn(),
  };
});

const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseAuthActions = vi.mocked(useAuthActions);
let AppHeader: typeof import("../AppHeader")["AppHeader"];

describe("AppHeader", () => {
  beforeAll(async () => {
    ({ AppHeader } = await import("../AppHeader"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders viewer details and handles sign out", async () => {
    const clearSessionToken = vi.fn();
    mockedUseAuthActions.mockReturnValue({
      persistSessionToken: vi.fn(),
      clearSessionToken,
    });

    mockedUseLazyLoadQuery.mockReturnValue({
      viewer: {
        id: "user-1",
        displayName: "Alice Example",
        email: "alice@example.com",
        avatarURL: "https://example.com/avatar.png",
      },
    } as any);
    const user = userEvent.setup();

    render(<AppHeader />);

    expect(screen.getByText("Alice Example")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();

    const avatar = screen.getByRole("img", { name: /alice example/i });
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    await user.click(signOutButton);

    expect(clearSessionToken).toHaveBeenCalledTimes(1);
  });

  it("falls back gracefully when viewer data is unavailable", async () => {
    mockedUseAuthActions.mockReturnValue({
      persistSessionToken: vi.fn(),
      clearSessionToken: vi.fn(),
    });

    mockedUseLazyLoadQuery.mockReturnValue({ viewer: null } as any);

    render(<AppHeader />);

    expect(screen.getByText(LAYOUT_STATUS_TEXT)).toBeInTheDocument();
    expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });
});
