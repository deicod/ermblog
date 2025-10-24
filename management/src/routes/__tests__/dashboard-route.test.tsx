import { act, render, screen, within } from "@testing-library/react";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { describe, expect, it } from "vitest";

import { DashboardRoute } from "../dashboard";

describe("DashboardRoute", () => {
  function renderDashboard(environment = createMockEnvironment()) {
    render(
      <RelayEnvironmentProvider environment={environment}>
        <DashboardRoute />
      </RelayEnvironmentProvider>,
    );

    return environment;
  }

  it("fetches the dashboard stats and renders metric cards", async () => {
    const environment = renderDashboard();
    const initialOperation = environment.mock.getMostRecentOperation();

    expect(initialOperation.fragment.node.name).toBe("dashboardHealthQuery");
    const selections = initialOperation.fragment.node.selections as readonly any[];
    expect(
      selections.some(
        (selection) => selection.kind === "LinkedField" && selection.name === "managementStats",
      ),
    ).toBe(true);

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: {
          health: "ok",
          managementStats: {
            __typename: "ManagementStats",
            posts: 24,
            comments: 12,
            mediaItems: 6,
            taxonomies: 3,
            users: 8,
          },
        },
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent("API health: ok");

    const postsCard = await screen.findByRole("article", { name: "Posts" });
    expect(within(postsCard).getByText("24")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Comments" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Media items" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Taxonomies" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Users" })).toBeInTheDocument();
  });

  it("renders an empty state when stats are unavailable", async () => {
    const environment = renderDashboard();
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: {
          health: "degraded",
          managementStats: null,
        },
      });
    });

    expect(await screen.findByText(
      "Statistics are not available yet. Connect the API or start creating content to populate these totals.",
    )).toBeInTheDocument();
  });
});
