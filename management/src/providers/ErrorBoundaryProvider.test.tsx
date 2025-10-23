import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayNetworkError } from "../RelayEnvironment";
import {
  ErrorBoundaryProvider,
  useHandledErrorReporter,
} from "./ErrorBoundaryProvider";
import type { ReactNode } from "react";

function ThrowingComponent() {
  throw new RelayNetworkError("Simulated network failure", { status: 503 });
}

function ReportHandledErrorButton() {
  const reportError = useHandledErrorReporter();
  return (
    <button
      type="button"
      onClick={() => reportError(new RelayNetworkError("Handled network issue", { status: 504 }))}
    >
      Report handled error
    </button>
  );
}

function renderWithBoundary(ui: ReactNode) {
  return render(<ErrorBoundaryProvider>{ui}</ErrorBoundaryProvider>);
}

describe("ErrorBoundaryProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the fallback when a RelayNetworkError is thrown", () => {
    renderWithBoundary(<ThrowingComponent />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Simulated network failure")).toBeInTheDocument();
    expect(screen.getByText(/status 503/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go home/i })).toBeInTheDocument();
  });

  it("allows handled errors to be reported to the boundary", async () => {
    const user = userEvent.setup();

    renderWithBoundary(
      <div>
        <p>Safe content</p>
        <ReportHandledErrorButton />
      </div>,
    );

    expect(screen.getByText("Safe content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /report handled error/i }));

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Handled network issue")).toBeInTheDocument();
  });
});
