/**
 * @generated SignedSource<<2ffae2ad6484fd06b312855bc12c47fc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateMediaInput = {
  altText?: string | null | undefined;
  caption?: string | null | undefined;
  clientMutationId?: string | null | undefined;
  createdAt?: any | null | undefined;
  description?: string | null | undefined;
  fileName?: string | null | undefined;
  fileSizeBytes?: number | null | undefined;
  id?: string | null | undefined;
  metadata?: any | null | undefined;
  mimeType?: string | null | undefined;
  storageKey?: string | null | undefined;
  title?: string | null | undefined;
  updatedAt?: any | null | undefined;
  uploadedByID?: string | null | undefined;
  url?: string | null | undefined;
};
export type MediaUploadDialogCreateMediaMutation$variables = {
  input: CreateMediaInput;
};
export type MediaUploadDialogCreateMediaMutation$data = {
  readonly createMedia: {
    readonly media: {
      readonly altText: string | null | undefined;
      readonly caption: string | null | undefined;
      readonly createdAt: any;
      readonly description: string | null | undefined;
      readonly fileName: string;
      readonly fileSizeBytes: number | null | undefined;
      readonly id: string;
      readonly mimeType: string;
      readonly title: string | null | undefined;
      readonly updatedAt: any;
      readonly uploadedByID: string | null | undefined;
      readonly url: string;
    } | null | undefined;
  };
};
export type MediaUploadDialogCreateMediaMutation = {
  response: MediaUploadDialogCreateMediaMutation$data;
  variables: MediaUploadDialogCreateMediaMutation$variables;
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
    "concreteType": "CreateMediaPayload",
    "kind": "LinkedField",
    "name": "createMedia",
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
            "name": "fileName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "mimeType",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "fileSizeBytes",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "uploadedByID",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "createdAt",
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
            "name": "url",
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
    "name": "MediaUploadDialogCreateMediaMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "MediaUploadDialogCreateMediaMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6903d9cac49a15d25c406670b926254b",
    "id": null,
    "metadata": {},
    "name": "MediaUploadDialogCreateMediaMutation",
    "operationKind": "mutation",
    "text": "mutation MediaUploadDialogCreateMediaMutation(\n  $input: CreateMediaInput!\n) {\n  createMedia(input: $input) {\n    media {\n      id\n      fileName\n      mimeType\n      fileSizeBytes\n      uploadedByID\n      createdAt\n      updatedAt\n      title\n      altText\n      caption\n      description\n      url\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "35b4bc40cde788c962b9da97d502465f";

export default node;
