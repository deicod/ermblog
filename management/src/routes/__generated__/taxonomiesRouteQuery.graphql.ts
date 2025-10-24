/**
 * @generated SignedSource<<10605a6fe4abbaaae3b12bb7c6fa044c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type taxonomiesRouteQuery$variables = Record<PropertyKey, never>;
export type taxonomiesRouteQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"TaxonomiesManagerFragment">;
};
export type taxonomiesRouteQuery = {
  response: taxonomiesRouteQuery$data;
  variables: taxonomiesRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalCount",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "taxonomiesRouteQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "TaxonomiesManagerFragment"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "taxonomiesRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v0/*: any*/),
        "concreteType": "CategoryConnection",
        "kind": "LinkedField",
        "name": "categories",
        "plural": false,
        "selections": [
          (v1/*: any*/),
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
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v5/*: any*/),
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
          (v1/*: any*/),
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
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v5/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": "tags(first:100)"
      }
    ]
  },
  "params": {
    "cacheID": "82e3d4789944af995df323fd98ba6f26",
    "id": null,
    "metadata": {},
    "name": "taxonomiesRouteQuery",
    "operationKind": "query",
    "text": "query taxonomiesRouteQuery {\n  ...TaxonomiesManagerFragment\n}\n\nfragment CategoryEditorFragment on CategoryConnection {\n  totalCount\n  edges {\n    node {\n      id\n      name\n      slug\n      description\n      parentID\n    }\n  }\n}\n\nfragment CategoryHierarchyFragment on CategoryConnection {\n  totalCount\n  edges {\n    node {\n      id\n      name\n      slug\n      parentID\n    }\n  }\n}\n\nfragment TagEditorFragment on TagConnection {\n  totalCount\n  edges {\n    node {\n      id\n      name\n      slug\n      description\n    }\n  }\n}\n\nfragment TagListFragment on TagConnection {\n  totalCount\n  edges {\n    node {\n      id\n      name\n      slug\n    }\n  }\n}\n\nfragment TaxonomiesManagerFragment on Query {\n  categories(first: 100) {\n    ...CategoryEditorFragment\n    ...CategoryHierarchyFragment\n  }\n  tags(first: 100) {\n    ...TagEditorFragment\n    ...TagListFragment\n  }\n}\n"
  }
};
})();

(node as any).hash = "7aba32ab22103a2ea53a9adfb43a167a";

export default node;
