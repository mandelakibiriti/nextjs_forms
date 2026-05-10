import type { FormField } from '@formforge/schema-core'
import type { FieldComponentProps } from './index.js'

interface SectionFieldProps extends FieldComponentProps {
  renderField: (field: FormField, values: Record<string, unknown>) => React.ReactNode
  values: Record<string, unknown>
}

export function SectionField({ field, renderField, values }: SectionFieldProps) {
  return (
    <fieldset className="ff-section">
      <legend className="ff-section__title">{field.label}</legend>
      {field.helpText && <p className="ff-section__description">{field.helpText}</p>}
      <div className="ff-section__fields">
        {(field.fields ?? []).map((subField) => (
          <div key={subField.id}>{renderField(subField, values)}</div>
        ))}
      </div>
    </fieldset>
  )
}
