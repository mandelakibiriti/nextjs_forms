import type { ComponentType } from 'react'
import type { FieldType, FormField } from '@formforge/schema-core'

export interface FieldComponentProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  required?: boolean
}

// Lazy imports to keep bundle size manageable
export { TextField } from './TextField.js'
export { TextAreaField } from './TextAreaField.js'
export { NumberField } from './NumberField.js'
export { SelectField } from './SelectField.js'
export { MultiSelectField } from './MultiSelectField.js'
export { RadioField } from './RadioField.js'
export { CheckboxField } from './CheckboxField.js'
export { ToggleField } from './ToggleField.js'
export { DateField } from './DateField.js'
export { FileField } from './FileField.js'
export { RepeaterField } from './RepeaterField.js'
export { SectionField } from './SectionField.js'
export { SignatureField } from './SignatureField.js'
export { LookupField } from './LookupField.js'
export { ComputedField } from './ComputedField.js'
export { LayoutFields } from './LayoutFields.js'
