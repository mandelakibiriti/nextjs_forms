import type { FieldComponentProps } from './index.js'

export function ToggleField({ field, value, onChange, error, disabled }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <div className="ff-toggle">
        <button
          type="button"
          role="switch"
          id={field.id}
          aria-checked={value === true}
          className={`ff-toggle__btn ${value === true ? 'ff-toggle__btn--on' : ''}`}
          onClick={() => onChange(!value)}
          disabled={disabled}
        >
          <span className="ff-toggle__thumb" />
        </button>
        <label htmlFor={field.id} className="ff-toggle__label">{field.label}</label>
      </div>
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
