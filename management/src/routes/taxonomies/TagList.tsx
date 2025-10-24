import { graphql, useFragment } from "react-relay";

import type { TagListFragment$key } from "./__generated__/TagListFragment.graphql";

type TagListProps = {
  connectionRef: TagListFragment$key;
  onSelect: (id: string) => void;
  selectedId: string | null;
};

const tagListFragment = graphql`
  fragment TagListFragment on TagConnection {
    totalCount
    edges {
      node {
        id
        name
        slug
      }
    }
  }
`;

export function TagList({ connectionRef, onSelect, selectedId }: TagListProps) {
  const data = useFragment(tagListFragment, connectionRef);
  const nodes = (data?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  if (nodes.length === 0) {
    return (
      <div className="tag-list__container" aria-live="polite">
        <header className="tag-list__header">
          <h3>Tags</h3>
          <p>Total tags: {data?.totalCount ?? 0}</p>
        </header>
        <p className="tag-list__empty" role="status">
          No tags are available yet. Create one to describe content topics.
        </p>
      </div>
    );
  }

  return (
    <div className="tag-list__container" aria-live="polite">
      <header className="tag-list__header">
        <h3>Tags</h3>
        <p>Total tags: {data?.totalCount ?? 0}</p>
      </header>
      <ul className="tag-list" role="list">
        {nodes.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              className={
                node.id === selectedId ? "tag-list__item tag-list__item--selected" : "tag-list__item"
              }
              aria-pressed={node.id === selectedId}
              onClick={() => onSelect(node.id)}
            >
              <span className="tag-list__name">{node.name ?? "Untitled tag"}</span>
              <span className="tag-list__slug">/{node.slug ?? ""}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TagList;
