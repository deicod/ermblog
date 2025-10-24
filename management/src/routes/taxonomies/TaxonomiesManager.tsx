import { useMemo, useState } from "react";
import { graphql, useFragment } from "react-relay";

import type { TaxonomiesManagerFragment$key } from "./__generated__/TaxonomiesManagerFragment.graphql";
import { CategoryEditor } from "./CategoryEditor";
import { TagEditor } from "./TagEditor";

type Vocabulary = "categories" | "tags";

type TaxonomiesManagerProps = {
  queryRef: TaxonomiesManagerFragment$key;
  onRefresh: () => void;
};

const taxonomiesManagerFragment = graphql`
  fragment TaxonomiesManagerFragment on Query {
    categories(first: 100) {
      ...CategoryEditorFragment
      ...CategoryHierarchyFragment
    }
    tags(first: 100) {
      ...TagEditorFragment
      ...TagListFragment
    }
  }
`;

export function TaxonomiesManager({ queryRef, onRefresh }: TaxonomiesManagerProps) {
  const data = useFragment(taxonomiesManagerFragment, queryRef);
  const [vocabulary, setVocabulary] = useState<Vocabulary>("categories");

  const vocabularyOptions = useMemo(
    () => [
      { value: "categories" as const, label: "Categories" },
      { value: "tags" as const, label: "Tags" },
    ],
    [],
  );

  const handleVocabularyChange = (nextValue: string) => {
    if (nextValue === "categories" || nextValue === "tags") {
      setVocabulary(nextValue);
    }
  };

  return (
    <div className="taxonomies-manager">
      <div className="taxonomies-manager__controls">
        <label className="taxonomies-manager__control">
          <span>Vocabulary</span>
          <select
            value={vocabulary}
            onChange={(event) => handleVocabularyChange(event.target.value)}
          >
            {vocabularyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {vocabulary === "categories" ? (
        <CategoryEditor connectionRef={data.categories} onRefresh={onRefresh} />
      ) : (
        <TagEditor connectionRef={data.tags} onRefresh={onRefresh} />
      )}
    </div>
  );
}

export default TaxonomiesManager;
