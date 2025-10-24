import { useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { FormEvent } from "react";
import type { OptionEditorDeleteOptionMutation } from "./__generated__/OptionEditorDeleteOptionMutation.graphql";
import type { OptionEditorUpdateOptionMutation } from "./__generated__/OptionEditorUpdateOptionMutation.graphql";
import type { OptionRecord } from "./OptionsManager";

type OptionEditorProps = {
  option: OptionRecord | null;
  onDeleted: (optionId: string) => void;
};

const updateOptionMutation = graphql`
  mutation OptionEditorUpdateOptionMutation($input: UpdateOptionInput!) {
    updateOption(input: $input) {
      option {
        id
        value
        updatedAt
      }
    }
  }
`;

const deleteOptionMutation = graphql`
  mutation OptionEditorDeleteOptionMutation($input: DeleteOptionInput!) {
    deleteOption(input: $input) {
      deletedOptionID
    }
  }
`;

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch (error) {
    return "null";
  }
}

export function OptionEditor({ option, onDeleted }: OptionEditorProps) {
  const [commitUpdate, isUpdating] = useMutation<OptionEditorUpdateOptionMutation>(updateOptionMutation);
  const [commitDelete, isDeleting] = useMutation<OptionEditorDeleteOptionMutation>(deleteOptionMutation);

  const initialValue = useMemo(() => (option ? formatJson(option.value) : ""), [option]);
  const [draftValue, setDraftValue] = useState(initialValue);
  const [valueIsValid, setValueIsValid] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftValue(initialValue);
    setValueIsValid(true);
    setStatusMessage(null);
  }, [initialValue]);

  useEffect(() => {
    if (!option) {
      setDraftValue("");
      setValueIsValid(true);
      setStatusMessage(null);
    }
  }, [option]);

  const handleChange = (value: string) => {
    setDraftValue(value);
    try {
      JSON.parse(value);
      setValueIsValid(true);
    } catch (error) {
      setValueIsValid(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!option || !valueIsValid) {
      return;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(draftValue);
    } catch (error) {
      setValueIsValid(false);
      return;
    }

    commitUpdate({
      variables: {
        input: {
          id: option.id,
          value: parsedValue,
        },
      },
      onCompleted: () => {
        setStatusMessage("Option updated successfully.");
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  const handleDelete = () => {
    if (!option) {
      return;
    }
    const confirmation = window.confirm(
      `Delete option “${option.name}”? This action cannot be undone.`,
    );
    if (!confirmation) {
      return;
    }

    commitDelete({
      variables: {
        input: {
          id: option.id,
        },
      },
      onCompleted: () => {
        setStatusMessage("Option deleted.");
        onDeleted(option.id);
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  if (!option) {
    return (
      <section aria-labelledby="option-editor-heading" className="option-editor option-editor--empty">
        <h3 id="option-editor-heading">Option details</h3>
        <p>Select an option to view and edit its JSON value.</p>
      </section>
    );
  }

  const hasChanges = valueIsValid && draftValue !== initialValue;

  return (
    <section aria-labelledby="option-editor-heading" className="option-editor">
      <h3 id="option-editor-heading">Option details</h3>
      <p>
        Editing “{option.name}”. Update the JSON value below and submit when the content is
        valid.
      </p>
      <form onSubmit={handleSubmit} className="option-editor__form">
        <label className="option-editor__field">
          <span>Option value</span>
          <textarea
            value={draftValue}
            onChange={(event) => handleChange(event.target.value)}
            rows={12}
            aria-invalid={!valueIsValid}
          />
        </label>
        {!valueIsValid ? (
          <p role="alert" className="option-editor__error">
            Value must be valid JSON.
          </p>
        ) : null}
        {statusMessage ? (
          <p role="status" className="option-editor__status">
            {statusMessage}
          </p>
        ) : null}
        <div className="option-editor__actions">
          <button type="submit" disabled={!hasChanges || isUpdating || !valueIsValid}>
            {isUpdating ? "Saving…" : "Update option"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="option-editor__delete"
          >
            {isDeleting ? "Deleting…" : "Delete option"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default OptionEditor;
