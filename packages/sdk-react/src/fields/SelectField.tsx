import type { FieldComponentProps } from './index.js'

export function SelectField({ field, value, onChange, onBlur, error, disabled, required }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={field.id}>
        {field.label}
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      <select
        id={field.id}
        className={`ff-select ${error ? 'ff-select--error' : ''}`}
        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
      >
        <option value="">{field.placeholder ?? 'Select an option...'}</option>
        {field.options?.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
