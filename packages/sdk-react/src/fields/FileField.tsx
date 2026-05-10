import type { FieldComponentProps } from './index.js'

export function FileField({ field, value, onChange, error, disabled, required }: FieldComponentProps) {
  const accept = field.type === 'image' ? 'image/*' : undefined

  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={field.id}>
        {field.label}
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={field.id}
        type="file"
        className="ff-file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          onChange(file ?? null)
        }}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
      />
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
