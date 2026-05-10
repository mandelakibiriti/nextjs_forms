import type { FieldComponentProps } from './index.js'

export function NumberField({ field, value, onChange, onBlur, error, disabled, required }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={field.id}>
        {field.label}
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={field.id}
        type="number"
        className={`ff-input ${error ? 'ff-input--error' : ''}`}
        placeholder={field.placeholder}
        value={typeof value === 'number' ? value : ''}
        min={field.validation?.min}
        max={field.validation?.max}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
      />
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
