import type { FieldComponentProps } from './index.js'

export function TextField({ field, value, onChange, onBlur, error, disabled, required }: FieldComponentProps) {
  const typeMap: Record<string, string> = {
    text: 'text',
    email: 'email',
    url: 'url',
    phone: 'tel',
    number: 'number',
  }
  const inputType = typeMap[field.type] ?? 'text'

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
        placeholder={field.placeholder}
        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-describedby={field.helpText ? `${field.id}-help` : undefined}
        aria-invalid={!!error}
      />
      {field.helpText && (
        <p id={`${field.id}-help`} className="ff-help">{field.helpText}</p>
      )}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
