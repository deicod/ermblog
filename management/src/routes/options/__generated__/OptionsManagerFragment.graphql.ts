/**
 * @generated SignedSource<<0e8ed305916d6676207b03d99ee0c7ab>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OptionsManagerFragment$data = {
  readonly options: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly autoload: boolean;
        readonly id: string;
        readonly name: string;
        readonly updatedAt: any;
        readonly value: any;
      } | null | undefined;
    }>;
  };
  readonly " $fragmentType": "OptionsManagerFragment";
};
export type OptionsManagerFragment$key = {
  readonly " $data"?: OptionsManagerFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"OptionsManagerFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "OptionsManagerFragment",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 100
        }
      ],
      "concreteType": "OptionConnection",
      "kind": "LinkedField",
      "name": "options",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "OptionEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "Option",
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
                  "name": "autoload",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "updatedAt",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "value",
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "options(first:100)"
    }
  ],
  "type": "Query",
  "abstractKey": null
};

(node as any).hash = "d9d1a95322bb0cd6b1b3efdda448ba0a";

export default node;
