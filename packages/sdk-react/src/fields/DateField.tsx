import type { FieldComponentProps } from './index.js'

export function DateField({ field, value, onChange, onBlur, error, disabled, required }: FieldComponentProps) {
  const typeMap: Record<string, string> = {
    date: 'date',
    datetime: 'datetime-local',
    time: 'time',
  }
  const inputType = typeMap[field.type] ?? 'date'

  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={field.id}>
        {field.label}
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={field.id}
        type={inputType}
        className={`ff-input ${error ? 'ff-input--error' : ''}`}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
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
