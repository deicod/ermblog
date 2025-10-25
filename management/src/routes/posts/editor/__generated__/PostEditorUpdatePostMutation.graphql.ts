/**
 * @generated SignedSource<<9012ac3df7f8dc5b13321b126624fd88>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PostStatus = "archived" | "draft" | "pending" | "private" | "published" | "%future added value";
export type PostType = "custom" | "page" | "post" | "%future added value";
export type UpdatePostInput = {
  authorID?: string | null | undefined;
  categoryIDs?: ReadonlyArray<string> | null | undefined;
  clientMutationId?: string | null | undefined;
  content?: string | null | undefined;
  createdAt?: any | null | undefined;
  excerpt?: string | null | undefined;
  featuredMediaID?: string | null | undefined;
  id: string;
  publishedAt?: any | null | undefined;
  seo?: any | null | undefined;
  slug?: string | null | undefined;
  status?: PostStatus | null | undefined;
  tagIDs?: ReadonlyArray<string> | null | undefined;
  title?: string | null | undefined;
  type?: PostType | null | undefined;
  updatedAt?: any | null | undefined;
};
export type PostEditorUpdatePostMutation$variables = {
  input: UpdatePostInput;
};
export type PostEditorUpdatePostMutation$data = {
  readonly updatePost: {
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
  };
};
export type PostEditorUpdatePostMutation = {
  response: PostEditorUpdatePostMutation$data;
  variables: PostEditorUpdatePostMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
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
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdatePostPayload",
    "kind": "LinkedField",
    "name": "updatePost",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
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
            "selections": [
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
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Category",
            "kind": "LinkedField",
            "name": "categories",
            "plural": true,
            "selections": (v3/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Tag",
            "kind": "LinkedField",
            "name": "tags",
            "plural": true,
            "selections": (v3/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PostEditorUpdatePostMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PostEditorUpdatePostMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "0829c071e3c9174f8c66a33cbc80cc52",
    "id": null,
    "metadata": {},
    "name": "PostEditorUpdatePostMutation",
    "operationKind": "mutation",
    "text": "mutation PostEditorUpdatePostMutation(\n  $input: UpdatePostInput!\n) {\n  updatePost(input: $input) {\n    post {\n      id\n      title\n      slug\n      status\n      type\n      excerpt\n      content\n      seo\n      publishedAt\n      featuredMediaID\n      featuredMedia {\n        id\n        title\n        url\n      }\n      categories {\n        id\n        name\n      }\n      tags {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2d32d9a4be0426c2baeafde474e4b15d";

export default node;
