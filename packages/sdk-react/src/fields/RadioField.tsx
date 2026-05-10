import type { FieldComponentProps } from './index.js'

export function RadioField({ field, value, onChange, error, disabled, required }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <fieldset>
        <legend className="ff-label">
          {field.label}
          {required && <span className="ff-required" aria-hidden="true"> *</span>}
        </legend>
        <div className="ff-radio-group">
          {field.options?.map((opt) => {
            const strVal = String(opt.value)
            return (
              <label key={strVal} className="ff-radio__option">
                <input
                  type="radio"
                  name={field.key}
                  value={strVal}
                  checked={String(value) === strVal}
                  onChange={() => onChange(opt.value)}
                  disabled={disabled || opt.disabled}
                  required={required}
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
