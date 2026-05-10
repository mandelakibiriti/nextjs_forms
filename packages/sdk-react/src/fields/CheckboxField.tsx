import type { FieldComponentProps } from './index.js'

export function CheckboxField({ field, value, onChange, error, disabled, required }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <label className="ff-checkbox">
        <input
          id={field.id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
        />
        <span className="ff-checkbox__label">{field.label}</span>
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
