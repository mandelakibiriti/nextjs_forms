import type { FieldComponentProps } from './index.js'

export function MultiSelectField({ field, value, onChange, error, disabled, required }: FieldComponentProps) {
  const selected = Array.isArray(value) ? (value as string[]) : []

  function toggle(optValue: string) {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue))
    } else {
      onChange([...selected, optValue])
    }
  }

  return (
    <div className="ff-field">
      <fieldset>
        <legend className="ff-label">
          {field.label}
          {required && <span className="ff-required" aria-hidden="true"> *</span>}
        </legend>
        <div className="ff-multiselect">
          {field.options?.map((opt) => {
            const strVal = String(opt.value)
            return (
              <label key={strVal} className="ff-multiselect__option">
                <input
                  type="checkbox"
                  checked={selected.includes(strVal)}
                  onChange={() => toggle(strVal)}
                  disabled={disabled || opt.disabled}
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      </fieldset>
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
