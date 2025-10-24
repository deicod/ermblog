import type { OptionRecord } from "./OptionsManager";

type OptionListProps = {
  options: OptionRecord[];
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  emptyMessage: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return dateFormatter.format(parsed);
}

export function OptionList({ options, selectedOptionId, onSelect, emptyMessage }: OptionListProps) {
  return (
    <table className="options-list" aria-label="Options">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Autoload</th>
          <th scope="col">Updated</th>
        </tr>
      </thead>
      <tbody>
        {options.length === 0 ? (
          <tr>
            <td colSpan={3} className="options-list__empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          options.map((option) => (
            <tr key={option.id} className={option.id === selectedOptionId ? "options-list__row--selected" : undefined}>
              <th scope="row">
                <button
                  type="button"
                  onClick={() => onSelect(option.id)}
                  aria-current={option.id === selectedOptionId ? "true" : undefined}
                  className="options-list__name"
                >
                  {option.name}
                </button>
              </th>
              <td>{option.autoload ? "Yes" : "No"}</td>
              <td>{formatUpdatedAt(option.updatedAt)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default OptionList;
