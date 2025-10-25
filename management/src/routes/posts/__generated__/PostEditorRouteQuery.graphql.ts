/**
 * @generated SignedSource<<25da606001c096aa0a66ad2191248947>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PostStatus = "archived" | "draft" | "pending" | "private" | "published" | "%future added value";
export type PostType = "custom" | "page" | "post" | "%future added value";
export type PostEditorRouteQuery$variables = {
  postId: string;
};
export type PostEditorRouteQuery$data = {
  readonly categories: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly name: string;
      } | null | undefined;
    }>;
  };
  readonly medias: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly title: string | null | undefined;
        readonly url: string;
      } | null | undefined;
    }>;
  };
  readonly post: {
    readonly categories: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly content: string | null | undefined;
    readonly excerpt: string | null | undefined;
    readonly featuredMedia: {
      readonly id: string;
      readonly title: string | null | undefined;
      readonly url: string;
    } | null | undefined;
    readonly featuredMediaID: string | null | undefined;
    readonly id: string;
    readonly publishedAt: any | null | undefined;
    readonly seo: any | null | undefined;
    readonly slug: string;
    readonly status: PostStatus;
    readonly tags: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly title: string;
    readonly type: PostType;
  } | null | undefined;
  readonly tags: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly name: string;
      } | null | undefined;
    }>;
  };
};
export type PostEditorRouteQuery = {
  response: PostEditorRouteQuery$data;
  variables: PostEditorRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "postId"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v3 = [
  (v1/*: any*/),
  (v2/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "url",
    "storageKey": null
  }
],
v4 = [
  (v1/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v5 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v6 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "postId"
      }
    ],
    "concreteType": "Post",
    "kind": "LinkedField",
    "name": "post",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      (v2/*: any*/),
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
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "type",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "excerpt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "content",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "seo",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "publishedAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "featuredMediaID",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Media",
        "kind": "LinkedField",
        "name": "featuredMedia",
        "plural": false,
        "selections": (v3/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Category",
        "kind": "LinkedField",
        "name": "categories",
        "plural": true,
        "selections": (v4/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Tag",
        "kind": "LinkedField",
        "name": "tags",
        "plural": true,
        "selections": (v4/*: any*/),
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": (v5/*: any*/),
    "concreteType": "CategoryConnection",
    "kind": "LinkedField",
    "name": "categories",
    "plural": false,
    "selections": [
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
            "selections": (v4/*: any*/),
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
    "args": (v5/*: any*/),
    "concreteType": "TagConnection",
    "kind": "LinkedField",
    "name": "tags",
    "plural": false,
    "selections": [
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
            "selections": (v4/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": "tags(first:100)"
  },
  {
    "alias": null,
    "args": (v5/*: any*/),
    "concreteType": "MediaConnection",
    "kind": "LinkedField",
    "name": "medias",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "MediaEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Media",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": (v3/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": "medias(first:100)"
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PostEditorRouteQuery",
    "selections": (v6/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PostEditorRouteQuery",
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "9e586a27dbf52a089fef3c3b7a556ac5",
    "id": null,
    "metadata": {},
    "name": "PostEditorRouteQuery",
    "operationKind": "query",
    "text": "query PostEditorRouteQuery(\n  $postId: ID!\n) {\n  post(id: $postId) {\n    id\n    title\n    slug\n    status\n    type\n    excerpt\n    content\n    seo\n    publishedAt\n    featuredMediaID\n    featuredMedia {\n      id\n      title\n      url\n    }\n    categories {\n      id\n      name\n    }\n    tags {\n      id\n      name\n    }\n  }\n  categories(first: 100) {\n    edges {\n      node {\n        id\n        name\n      }\n    }\n  }\n  tags(first: 100) {\n    edges {\n      node {\n        id\n        name\n      }\n    }\n  }\n  medias(first: 100) {\n    edges {\n      node {\n        id\n        title\n        url\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0acaff60e8eb78ba9733c483379d0819";

export default node;
