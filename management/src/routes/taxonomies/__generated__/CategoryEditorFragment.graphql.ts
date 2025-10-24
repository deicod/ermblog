/**
 * @generated SignedSource<<b7c2bf931a35e928f09be86313dd487f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CategoryEditorFragment$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly description: string | null | undefined;
      readonly id: string;
      readonly name: string;
      readonly parentID: string | null | undefined;
      readonly slug: string;
    } | null | undefined;
  }>;
  readonly totalCount: number;
  readonly " $fragmentType": "CategoryEditorFragment";
};
export type CategoryEditorFragment$key = {
  readonly " $data"?: CategoryEditorFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"CategoryEditorFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CategoryEditorFragment",
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
      "concreteType": "CategoryEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Category",
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
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "parentID",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "CategoryConnection",
  "abstractKey": null
};

(node as any).hash = "9c089487809abbe0b1429d8f4b8834c3";

export default node;
