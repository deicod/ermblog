import { graphql, useFragment } from "react-relay";

import type { CategoryHierarchyFragment$key } from "./__generated__/CategoryHierarchyFragment.graphql";

type CategoryHierarchyProps = {
  connectionRef: CategoryHierarchyFragment$key;
  onSelect: (id: string) => void;
  selectedId: string | null;
};

const categoryHierarchyFragment = graphql`
  fragment CategoryHierarchyFragment on CategoryConnection {
    totalCount
    edges {
      node {
        id
        name
        slug
        parentID
      }
    }
  }
`;

type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  parentID: string | null;
  children: CategoryTreeNode[];
};

function buildCategoryTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  nodeMap.forEach((node) => {
    if (node.parentID && nodeMap.has(node.parentID)) {
      nodeMap.get(node.parentID)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (entries: CategoryTreeNode[]) =>
    entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const sortTree = (entries: CategoryTreeNode[]) => {
    sortNodes(entries);
    entries.forEach((entry) => sortTree(entry.children));
  };

  sortTree(roots);
  return roots;
}

function renderTree(
  nodes: CategoryTreeNode[],
  onSelect: (id: string) => void,
  selectedId: string | null,
  isRoot: boolean,
): JSX.Element {
  if (nodes.length === 0) {
    return (
      <p className="category-hierarchy__empty" role="status">
        No categories are available yet. Create one to define the hierarchy.
      </p>
    );
  }

  const listClass = isRoot ? "category-hierarchy" : "category-hierarchy__group";

  return (
    <ul className={listClass} role={isRoot ? "tree" : "group"}>
      {nodes.map((node) => (
        <li key={node.id} role="treeitem" aria-expanded={node.children.length > 0}>
          <button
            type="button"
            className={
              node.id === selectedId
                ? "category-hierarchy__item category-hierarchy__item--selected"
                : "category-hierarchy__item"
            }
            aria-pressed={node.id === selectedId}
            onClick={() => onSelect(node.id)}
          >
            <span className="category-hierarchy__name">{node.name}</span>
            <span className="category-hierarchy__slug">/{node.slug}</span>
          </button>
          {node.children.length > 0
            ? renderTree(node.children, onSelect, selectedId, false)
            : null}
        </li>
      ))}
    </ul>
  );
}

export function CategoryHierarchy({ connectionRef, onSelect, selectedId }: CategoryHierarchyProps) {
  const data = useFragment(categoryHierarchyFragment, connectionRef);
  const nodes = (data?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .map((node) => ({
      id: node.id,
      name: node.name ?? "Untitled category",
      slug: node.slug ?? "",
      parentID: node.parentID ?? null,
      children: [],
    }));

  const tree = buildCategoryTree(nodes);

  return (
    <div className="category-hierarchy__container" aria-live="polite">
      <header className="category-hierarchy__header">
        <h3>Categories</h3>
        <p>Total categories: {data?.totalCount ?? 0}</p>
      </header>
      {renderTree(tree, onSelect, selectedId, true)}
    </div>
  );
}

export default CategoryHierarchy;
