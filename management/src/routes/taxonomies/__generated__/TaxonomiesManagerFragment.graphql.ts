/**
 * @generated SignedSource<<fc8e6e17bc1ff50fd2750c392584a0f9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TaxonomiesManagerFragment$data = {
  readonly categories: {
    readonly " $fragmentSpreads": FragmentRefs<"CategoryEditorFragment" | "CategoryHierarchyFragment">;
  };
  readonly tags: {
    readonly " $fragmentSpreads": FragmentRefs<"TagEditorFragment" | "TagListFragment">;
  };
  readonly " $fragmentType": "TaxonomiesManagerFragment";
};
export type TaxonomiesManagerFragment$key = {
  readonly " $data"?: TaxonomiesManagerFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"TaxonomiesManagerFragment">;
};

const node: ReaderFragment = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TaxonomiesManagerFragment",
  "selections": [
    {
      "alias": null,
      "args": (v0/*: any*/),
      "concreteType": "CategoryConnection",
      "kind": "LinkedField",
      "name": "categories",
      "plural": false,
      "selections": [
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "CategoryEditorFragment"
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "CategoryHierarchyFragment"
        }
      ],
      "storageKey": "categories(first:100)"
    },
    {
      "alias": null,
      "args": (v0/*: any*/),
      "concreteType": "TagConnection",
      "kind": "LinkedField",
      "name": "tags",
      "plural": false,
      "selections": [
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "TagEditorFragment"
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "TagListFragment"
        }
      ],
      "storageKey": "tags(first:100)"
    }
  ],
  "type": "Query",
  "abstractKey": null
};
})();

(node as any).hash = "dea924740b870c47455075cc5d703b77";

export default node;
