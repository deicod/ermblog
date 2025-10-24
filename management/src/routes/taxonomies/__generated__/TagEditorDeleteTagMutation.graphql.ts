/**
 * @generated SignedSource<<003002cc99884d8672b1d0d5f61062db>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteTagInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type TagEditorDeleteTagMutation$variables = {
  input: DeleteTagInput;
};
export type TagEditorDeleteTagMutation$data = {
  readonly deleteTag: {
    readonly deletedTagID: string;
  };
};
export type TagEditorDeleteTagMutation = {
  response: TagEditorDeleteTagMutation$data;
  variables: TagEditorDeleteTagMutation$variables;
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
    "concreteType": "DeleteTagPayload",
    "kind": "LinkedField",
    "name": "deleteTag",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedTagID",
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
    "name": "TagEditorDeleteTagMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TagEditorDeleteTagMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c481d895779da9d7d88ab7ef0d667622",
    "id": null,
    "metadata": {},
    "name": "TagEditorDeleteTagMutation",
    "operationKind": "mutation",
    "text": "mutation TagEditorDeleteTagMutation(\n  $input: DeleteTagInput!\n) {\n  deleteTag(input: $input) {\n    deletedTagID\n  }\n}\n"
  }
};
})();

(node as any).hash = "e2422dd9a4bd1d2cf69a07c128ffe7b1";

export default node;
