/**
 * @generated SignedSource<<84ccdad5b6011661338f5892fe371d07>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type optionsRouteQuery$variables = Record<PropertyKey, never>;
export type optionsRouteQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"OptionsManagerFragment">;
};
export type optionsRouteQuery = {
  response: optionsRouteQuery$data;
  variables: optionsRouteQuery$variables;
};

const node: ConcreteRequest = {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "optionsRouteQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "OptionsManagerFragment"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "optionsRouteQuery",
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
    ]
  },
  "params": {
    "cacheID": "6dd32e428813c89f988129ee27955c56",
    "id": null,
    "metadata": {},
    "name": "optionsRouteQuery",
    "operationKind": "query",
    "text": "query optionsRouteQuery {\n  ...OptionsManagerFragment\n}\n\nfragment OptionsManagerFragment on Query {\n  options(first: 100) {\n    edges {\n      node {\n        id\n        name\n        autoload\n        updatedAt\n        value\n      }\n    }\n  }\n}\n"
  }
};

(node as any).hash = "38e3173b0257b47faaba9e2d17cc0ea2";

export default node;
