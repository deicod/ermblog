import { useEffect, useMemo, useState } from "react";
import { graphql, useFragment } from "react-relay";

import type {
  OptionsManagerFragment$key,
  OptionsManagerFragment$data,
} from "./__generated__/OptionsManagerFragment.graphql";
import { OptionCreator } from "./OptionCreator";
import { OptionEditor } from "./OptionEditor";
import { OptionList } from "./OptionList";

export type OptionRecord = {
  id: string;
  name: string;
  autoload: boolean;
  updatedAt: string | null;
  value: unknown;
};

type OptionsManagerProps = {
  queryRef: OptionsManagerFragment$key;
  onRefresh: () => void;
};

const optionsManagerFragment = graphql`
  fragment OptionsManagerFragment on Query {
    options(first: 100) {
      edges {
        node {
          id
          name
          autoload
          updatedAt
          value
        }
      }
    }
  }
`;

function normalizeOptions(connection: OptionsManagerFragment$data | null | undefined): OptionRecord[] {
  const edges = connection?.options?.edges ?? [];
  return edges
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .map((node) => ({
      id: node.id,
      name: node.name ?? "(unnamed)",
      autoload: Boolean(node.autoload),
      updatedAt: node.updatedAt ?? null,
      value: node.value,
    }));
}

export function OptionsManager({ queryRef, onRefresh }: OptionsManagerProps) {
  const data = useFragment(optionsManagerFragment, queryRef);
  const options = useMemo(() => normalizeOptions(data), [data]);
  const optionsById = useMemo(() => {
    return options.reduce<Map<string, OptionRecord>>((map, option) => {
      map.set(option.id, option);
      return map;
    }, new Map());
  }, [options]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);
  const [suppressAutoSelect, setSuppressAutoSelect] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }
    return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, options]);

  useEffect(() => {
    if (visibleOptions.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    if (pendingSelectionId) {
      const match = visibleOptions.find((option) => option.id === pendingSelectionId);
      if (match) {
        setSelectedId(match.id);
        setPendingSelectionId(null);
      }
      return;
    }

    if (suppressAutoSelect) {
      return;
    }

    if (selectedId === null || !visibleOptions.some((option) => option.id === selectedId)) {
      setSelectedId(visibleOptions[0].id);
    }
  }, [pendingSelectionId, selectedId, suppressAutoSelect, visibleOptions]);

  const selectedOption = selectedId ? optionsById.get(selectedId) ?? null : null;
  const emptyMessage = normalizedQuery
    ? "No options match the current search."
    : "No options are available yet.";

  const handleSelectOption = (optionId: string) => {
    setSelectedId(optionId);
    setPendingSelectionId(null);
    setSuppressAutoSelect(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSuppressAutoSelect(false);
  };

  const handleOptionCreated = (optionId: string | null) => {
    if (optionId) {
      setPendingSelectionId(optionId);
      setSelectedId(optionId);
    }
    setSuppressAutoSelect(false);
    onRefresh();
  };

  const handleOptionDeleted = (optionId: string) => {
    if (selectedId === optionId) {
      setSelectedId(null);
    }
    setPendingSelectionId(null);
    setSuppressAutoSelect(true);
    onRefresh();
  };

  return (
    <div className="options-manager">
      <div className="options-manager__layout">
        <div className="options-manager__list">
          <label className="options-manager__search">
            <span>Search options</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by option name"
            />
          </label>
          <OptionList
            options={visibleOptions}
            selectedOptionId={selectedId}
            onSelect={handleSelectOption}
            emptyMessage={emptyMessage}
          />
        </div>
        <div className="options-manager__details">
          <OptionEditor option={selectedOption} onDeleted={handleOptionDeleted} />
          <OptionCreator onCreated={handleOptionCreated} />
        </div>
      </div>
    </div>
  );
}

export default OptionsManager;
