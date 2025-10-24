/**
 * @generated SignedSource<<acf41d6c32e8f7ebda3b6eb57d5fa184>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TagEditorFragment$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    } | null | undefined;
  }>;
  readonly totalCount: number;
  readonly " $fragmentType": "TagEditorFragment";
};
export type TagEditorFragment$key = {
  readonly " $data"?: TagEditorFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"TagEditorFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TagEditorFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "totalCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TagEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Tag",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "id",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "name",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "slug",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "description",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "TagConnection",
  "abstractKey": null
};

(node as any).hash = "8bc2aa6e9cf8326dddb74508c5078022";

export default node;
