import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelayEnvironmentProvider } from "react-relay";
import { createMockEnvironment } from "relay-test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OptionsRoute } from "../../options";

type OptionNodeInput = {
  id: string;
  name: string;
  autoload: boolean;
  updatedAt: string;
  value: unknown;
};

function renderOptions(environment = createMockEnvironment()) {
  render(
    <RelayEnvironmentProvider environment={environment}>
      <OptionsRoute />
    </RelayEnvironmentProvider>,
  );
  return environment;
}

function buildOptionsPayload(options: OptionNodeInput[]) {
  return {
    options: {
      __typename: "OptionConnection",
      totalCount: options.length,
      edges: options.map((option, index) => ({
        cursor: `cursor-${index + 1}`,
        node: {
          __typename: "Option",
          id: option.id,
          name: option.name,
          autoload: option.autoload,
          updatedAt: option.updatedAt,
          value: option.value,
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

describe("OptionsRoute", () => {
  let environment: ReturnType<typeof createMockEnvironment>;

  beforeEach(() => {
    environment = renderOptions();
  });

  it("renders options, filters results, and updates the selected entry", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();
    expect(initialOperation.fragment.node.name).toBe("optionsRouteQuery");

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildOptionsPayload([
          {
            id: "option-1",
            name: "site_title",
            autoload: true,
            updatedAt: "2024-10-10T10:00:00.000Z",
            value: { title: "Example" },
          },
          {
            id: "option-2",
            name: "admin_email",
            autoload: false,
            updatedAt: "2024-10-09T09:30:00.000Z",
            value: "admin@example.com",
          },
        ]),
      });
    });

    const table = await screen.findByRole("table", { name: "Options" });
    expect(within(table).getByRole("button", { name: "site_title" })).toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "admin_email" })).toBeInTheDocument();

    const searchField = screen.getByLabelText("Search options");
    await userEvent.clear(searchField);
    await userEvent.type(searchField, "missing");

    expect(await screen.findByText("No options match the current search.")).toBeInTheDocument();

    await userEvent.clear(searchField);
    await userEvent.type(searchField, "site");

    const siteButton = await screen.findByRole("button", { name: "site_title" });
    await userEvent.click(siteButton);

    expect(screen.getByText(/Editing “site_title”/)).toBeInTheDocument();
  });

  it("updates an option when provided with valid JSON", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildOptionsPayload([
          {
            id: "option-1",
            name: "site_title",
            autoload: true,
            updatedAt: "2024-10-10T10:00:00.000Z",
            value: { title: "Example" },
          },
        ]),
      });
    });

    const textarea = await screen.findByLabelText("Option value");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: '{"title":"Updated"}' } });
    });
    expect(screen.getByRole("button", { name: "Update option" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Update option" }));

    let mutationOperation;
    await waitFor(() => {
      const operations = environment.mock.getAllOperations();
      expect(operations.length).toBeGreaterThan(0);
      mutationOperation = operations[operations.length - 1];
      expect(mutationOperation.fragment.node.name).toBe("OptionEditorUpdateOptionMutation");
    });
    expect(mutationOperation.request.variables.input).toMatchObject({
      id: "option-1",
      value: { title: "Updated" },
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          updateOption: {
            __typename: "UpdateOptionPayload",
            option: {
              __typename: "Option",
              id: "option-1",
              value: { title: "Updated" },
              updatedAt: "2024-10-11T10:00:00.000Z",
            },
          },
        },
      });
      await Promise.resolve();
    });

    const table = screen.getByRole("table", { name: "Options" });
    expect(within(table).getByText("Oct 11, 2024, 10:00 AM")).toBeInTheDocument();
    expect(screen.getByLabelText("Option value")).toHaveValue(`{
  "title": "Updated"
}`);
  });

  it("prevents updating an option when JSON is invalid", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildOptionsPayload([
          {
            id: "option-1",
            name: "site_title",
            autoload: true,
            updatedAt: "2024-10-10T10:00:00.000Z",
            value: { title: "Example" },
          },
        ]),
      });
    });

    const textarea = await screen.findByLabelText("Option value");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "{invalid" } });
    });

    expect(await screen.findByText("Value must be valid JSON.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update option" })).toBeDisabled();
  });

  it("creates a new option and refetches the list", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildOptionsPayload([
          {
            id: "option-1",
            name: "site_title",
            autoload: true,
            updatedAt: "2024-10-10T10:00:00.000Z",
            value: { title: "Example" },
          },
        ]),
      });
    });

    await userEvent.type(screen.getByLabelText("Option name"), "theme_color");
    await userEvent.click(screen.getByLabelText("Autoload"));
    const valueField = screen.getByLabelText("New option value");
    await act(async () => {
      fireEvent.change(valueField, { target: { value: '{"color":"#fff"}' } });
    });
    await userEvent.click(screen.getByRole("button", { name: "Create option" }));

    let mutationOperation;
    await waitFor(() => {
      const operations = environment.mock.getAllOperations();
      expect(operations.length).toBeGreaterThan(0);
      mutationOperation = operations[operations.length - 1];
      expect(mutationOperation.fragment.node.name).toBe("OptionCreatorCreateOptionMutation");
    });
    expect(mutationOperation.request.variables.input).toMatchObject({
      name: "theme_color",
      autoload: true,
      value: { color: "#fff" },
    });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          createOption: {
            __typename: "CreateOptionPayload",
            option: {
              __typename: "Option",
              id: "option-2",
              name: "theme_color",
              autoload: true,
              updatedAt: "2024-10-11T09:00:00.000Z",
              value: { color: "#fff" },
            },
          },
        },
      });
      await Promise.resolve();
    });

    expect(await screen.findByText("Option created successfully.")).toBeInTheDocument();
    expect(screen.getByLabelText("Option name")).toHaveValue("");
    expect(screen.getByLabelText("New option value")).toHaveValue("null");
  });

  it("deletes an option after confirmation and refetches the list", async () => {
    const initialOperation = environment.mock.getMostRecentOperation();

    await act(async () => {
      environment.mock.resolve(initialOperation, {
        data: buildOptionsPayload([
          {
            id: "option-1",
            name: "site_title",
            autoload: true,
            updatedAt: "2024-10-10T10:00:00.000Z",
            value: { title: "Example" },
          },
        ]),
      });
    });

    const confirmSpy = vi.fn().mockReturnValue(true);
    const originalConfirm = window.confirm;
    Object.defineProperty(window, "confirm", {
      configurable: true,
      writable: true,
      value: confirmSpy,
    });
    await userEvent.click(screen.getByRole("button", { name: "Delete option" }));

    let mutationOperation;
    await waitFor(() => {
      const operations = environment.mock.getAllOperations();
      expect(operations.length).toBeGreaterThan(0);
      mutationOperation = operations[operations.length - 1];
      expect(mutationOperation.fragment.node.name).toBe("OptionEditorDeleteOptionMutation");
    });
    expect(mutationOperation.request.variables.input).toMatchObject({ id: "option-1" });

    await act(async () => {
      environment.mock.resolve(mutationOperation, {
        data: {
          deleteOption: {
            __typename: "DeleteOptionPayload",
            deletedOptionID: "option-1",
          },
        },
      });
      await Promise.resolve();
    });

    Object.defineProperty(window, "confirm", {
      configurable: true,
      writable: true,
      value: originalConfirm,
    });

    expect(
      await screen.findByText("Select an option to view and edit its JSON value."),
    ).toBeInTheDocument();
  });
});
