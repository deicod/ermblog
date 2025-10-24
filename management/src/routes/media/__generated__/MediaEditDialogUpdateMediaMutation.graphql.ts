/**
 * @generated SignedSource<<c35252d0c78ca92a6e50a9069f8dea34>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateMediaInput = {
  altText?: string | null | undefined;
  caption?: string | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  fileName?: string | null | undefined;
  fileSizeBytes?: number | null | undefined;
  id: string;
  metadata?: any | null | undefined;
  mimeType?: string | null | undefined;
  storageKey?: string | null | undefined;
  title?: string | null | undefined;
  updatedAt?: any | null | undefined;
  uploadedByID?: string | null | undefined;
  url?: string | null | undefined;
};
export type MediaEditDialogUpdateMediaMutation$variables = {
  input: UpdateMediaInput;
};
export type MediaEditDialogUpdateMediaMutation$data = {
  readonly updateMedia: {
    readonly media: {
      readonly altText: string | null | undefined;
      readonly caption: string | null | undefined;
      readonly description: string | null | undefined;
      readonly id: string;
      readonly title: string | null | undefined;
      readonly updatedAt: any;
    } | null | undefined;
  };
};
export type MediaEditDialogUpdateMediaMutation = {
  response: MediaEditDialogUpdateMediaMutation$data;
  variables: MediaEditDialogUpdateMediaMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateMediaPayload",
    "kind": "LinkedField",
    "name": "updateMedia",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Media",
        "kind": "LinkedField",
        "name": "media",
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
            "name": "title",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "altText",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "caption",
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
            "name": "updatedAt",
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
    "name": "MediaEditDialogUpdateMediaMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "MediaEditDialogUpdateMediaMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "8ea0e08b3dfd3b4ca49c6ee7b7d7b446",
    "id": null,
    "metadata": {},
    "name": "MediaEditDialogUpdateMediaMutation",
    "operationKind": "mutation",
    "text": "mutation MediaEditDialogUpdateMediaMutation(\n  $input: UpdateMediaInput!\n) {\n  updateMedia(input: $input) {\n    media {\n      id\n      title\n      altText\n      caption\n      description\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "11aa65d6fd306de9ea312c60c24cca29";

export default node;
