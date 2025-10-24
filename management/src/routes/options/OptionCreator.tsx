import { useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { FormEvent } from "react";
import type { OptionCreatorCreateOptionMutation } from "./__generated__/OptionCreatorCreateOptionMutation.graphql";

type OptionCreatorProps = {
  onCreated: (optionId: string | null) => void;
};

type FormState = {
  name: string;
  autoload: boolean;
  value: string;
};

type ValidationErrors = Partial<Record<keyof FormState, string>>;

const createOptionMutation = graphql`
  mutation OptionCreatorCreateOptionMutation($input: CreateOptionInput!) {
    createOption(input: $input) {
      option {
        id
        name
        autoload
        updatedAt
        value
      }
    }
  }
`;

function initialFormState(): FormState {
  return {
    name: "",
    autoload: false,
    value: "null",
  };
}

export function OptionCreator({ onCreated }: OptionCreatorProps) {
  const [commitCreate, isCreating] = useMutation<OptionCreatorCreateOptionMutation>(createOptionMutation);
  const [formState, setFormState] = useState<FormState>(() => initialFormState());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [valueIsValid, setValueIsValid] = useState(true);
  const [parsedValue, setParsedValue] = useState<unknown>(() => {
    try {
      return JSON.parse(initialFormState().value);
    } catch (error) {
      return null;
    }
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFieldChange = (field: keyof FormState, value: string | boolean) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    if (field === "name") {
      setErrors((current) => ({ ...current, name: undefined }));
    }
  };

  const handleValueChange = (value: string) => {
    setFormState((current) => ({ ...current, value }));
    try {
      const parsed = JSON.parse(value);
      setParsedValue(parsed);
      setValueIsValid(true);
      setErrors((current) => ({ ...current, value: undefined }));
    } catch (error) {
      setParsedValue(null);
      setValueIsValid(false);
      setErrors((current) => ({ ...current, value: "Value must be valid JSON." }));
    }
  };

  const resetForm = () => {
    const nextState = initialFormState();
    setFormState(nextState);
    setErrors({});
    setParsedValue(null);
    setValueIsValid(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation: ValidationErrors = {};
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      validation.name = "Name is required.";
    }
    if (!valueIsValid) {
      validation.value = "Value must be valid JSON.";
    }
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setStatusMessage(null);

    commitCreate({
      variables: {
        input: {
          name: trimmedName,
          autoload: formState.autoload,
          value: parsedValue,
        },
      },
      onCompleted: (payload) => {
        const createdId = payload.createOption?.option?.id ?? null;
        onCreated(createdId);
        resetForm();
        setStatusMessage("Option created successfully.");
      },
      onError: (error) => {
        setStatusMessage(error.message);
      },
    });
  };

  return (
    <section aria-labelledby="option-creator-heading" className="option-creator">
      <h3 id="option-creator-heading">Create option</h3>
      <p>Provide a unique name and JSON value to add a new configuration option.</p>
      <form onSubmit={handleSubmit} className="option-creator__form">
        <label className="option-creator__field">
          <span>Option name</span>
          <input
            type="text"
            value={formState.name}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? (
            <p role="alert" className="option-creator__error">
              {errors.name}
            </p>
          ) : null}
        </label>
        <label className="option-creator__checkbox">
          <input
            type="checkbox"
            checked={formState.autoload}
            onChange={(event) => handleFieldChange("autoload", event.target.checked)}
          />
          <span>Autoload</span>
        </label>
        <label className="option-creator__field">
          <span>New option value</span>
          <textarea
            value={formState.value}
            onChange={(event) => handleValueChange(event.target.value)}
            rows={8}
            aria-invalid={Boolean(errors.value)}
          />
          {errors.value ? (
            <p role="alert" className="option-creator__error">
              {errors.value}
            </p>
          ) : null}
        </label>
        {statusMessage ? (
          <p role="status" className="option-creator__status">
            {statusMessage}
          </p>
        ) : null}
        <button type="submit" disabled={isCreating || !valueIsValid}>
          {isCreating ? "Creating…" : "Create option"}
        </button>
      </form>
    </section>
  );
}

export default OptionCreator;
