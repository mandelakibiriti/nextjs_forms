import type { FieldComponentProps } from './index.js'

export function TextAreaField({ field, value, onChange, onBlur, error, disabled, required }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={field.id}>
        {field.label}
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={field.id}
        className={`ff-textarea ${error ? 'ff-textarea--error' : ''}`}
        placeholder={field.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        rows={4}
        aria-invalid={!!error}
      />
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
