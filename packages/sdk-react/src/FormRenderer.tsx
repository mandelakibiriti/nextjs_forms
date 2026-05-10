import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { FormSchema, FormField, FormTheme } from '@formforge/schema-core'
import { useConditionals } from './hooks/useConditionals.js'
import { TextField } from './fields/TextField.js'
import { TextAreaField } from './fields/TextAreaField.js'
import { NumberField } from './fields/NumberField.js'
import { SelectField } from './fields/SelectField.js'
import { MultiSelectField } from './fields/MultiSelectField.js'
import { RadioField } from './fields/RadioField.js'
import { CheckboxField } from './fields/CheckboxField.js'
import { ToggleField } from './fields/ToggleField.js'
import { DateField } from './fields/DateField.js'
import { FileField } from './fields/FileField.js'
import { RepeaterField } from './fields/RepeaterField.js'
import { SectionField } from './fields/SectionField.js'
import { SignatureField } from './fields/SignatureField.js'
import { LookupField } from './fields/LookupField.js'
import { ComputedField } from './fields/ComputedField.js'
import { LayoutFields } from './fields/LayoutFields.js'

export interface FormRendererProps {
  schema: FormSchema
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>
  onError?: (errors: Record<string, string>) => void
  theme?: Partial<FormTheme>
  readOnly?: boolean
  defaultValues?: Record<string, unknown>
}

export function FormRenderer({
  schema,
  onSubmit,
  onError,
  theme,
  readOnly = false,
  defaultValues,
}: FormRendererProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Record<string, unknown>>({ defaultValues: defaultValues ?? {} })

  const allValues = watch()
  const activeStep = schema.steps[currentStep]
  const { fields: visibleFields, state: conditionalState } = useConditionals(
    activeStep?.fields ?? [],
    allValues
  )

  const isLastStep = currentStep === schema.steps.length - 1

  const handleFormSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (!isLastStep) {
        setCurrentStep((s) => s + 1)
        return
      }
      setSubmitting(true)
      try {
        await onSubmit?.(data)
        setSubmitted(true)
      } finally {
        setSubmitting(false)
      }
    },
    [isLastStep, onSubmit]
  )

  if (submitted) {
    return (
      <div className="ff-success" role="alert">
        <p>{schema.settings?.successMessage ?? 'Thank you! Your response has been submitted.'}</p>
      </div>
    )
  }

  const applyTheme = theme ?? schema.theme
  const themeStyle: React.CSSProperties = {
    '--ff-primary': applyTheme?.primaryColor ?? '#4F46E5',
    '--ff-font': applyTheme?.fontFamily ?? 'inherit',
    '--ff-radius': applyTheme?.borderRadius ?? '0.375rem',
  } as React.CSSProperties

  return (
    <div className={`ff-renderer ff-spacing-${applyTheme?.spacing ?? 'normal'}`} style={themeStyle}>
      {schema.isMultiStep && schema.steps.length > 1 && (
        <div className="ff-steps" role="tablist">
          {schema.steps.map((step, i) => (
            <div
              key={step.id}
              className={`ff-step ${i === currentStep ? 'ff-step--active' : ''} ${i < currentStep ? 'ff-step--done' : ''}`}
              role="tab"
              aria-selected={i === currentStep}
            >
              <span className="ff-step__num">{i + 1}</span>
              <span className="ff-step__title">{step.title}</span>
            </div>
          ))}
        </div>
      )}

      {activeStep && (
        <div className="ff-step-content">
          {schema.isMultiStep && (
            <h2 className="ff-step__heading">{activeStep.title}</h2>
          )}
          {activeStep.description && (
            <p className="ff-step__description">{activeStep.description}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {visibleFields.map((field) => (
          <Controller
            key={field.id}
            name={field.key}
            control={control}
            defaultValue={field.defaultValue ?? ''}
            rules={buildRules(field, conditionalState[field.key])}
            render={({ field: controllerField, fieldState }) =>
              renderField({
                field,
                value: controllerField.value,
                onChange: controllerField.onChange,
                onBlur: controllerField.onBlur,
                error: fieldState.error?.message,
                disabled: readOnly || conditionalState[field.key]?.disabled,
                required: field.validation?.required || conditionalState[field.key]?.required,
                allValues,
                renderField: (subField, values) => (
                  <Controller
                    key={subField.id}
                    name={subField.key}
                    control={control}
                    render={({ field: sf }) =>
                      renderField({
                        field: subField,
                        value: sf.value,
                        onChange: sf.onChange,
                        allValues: values,
                        renderField: () => null,
                      })
                    }
                  />
                ),
              })
            }
          />
        ))}

        <div className="ff-actions">
          {schema.isMultiStep && currentStep > 0 && (
            <button
              type="button"
              className="ff-btn ff-btn--secondary"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={submitting}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="ff-btn ff-btn--primary"
            disabled={submitting || readOnly}
          >
            {submitting
              ? 'Submitting...'
              : isLastStep
                ? (schema.settings?.submitLabel ?? 'Submit')
                : 'Next'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface RenderFieldOptions {
  field: FormField
  value: unknown
  onChange?: (v: unknown) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  required?: boolean
  allValues: Record<string, unknown>
  renderField: (field: FormField, values: Record<string, unknown>) => React.ReactNode
}

function renderField({
  field,
  value,
  onChange = () => {},
  onBlur,
  error,
  disabled,
  required,
  allValues,
  renderField,
}: RenderFieldOptions): React.ReactElement {
  const props = { field, value, onChange, onBlur, error, disabled, required }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      return <TextField {...props} />
    case 'textarea':
      return <TextAreaField {...props} />
    case 'number':
      return <NumberField {...props} />
    case 'select':
      return <SelectField {...props} />
    case 'multiselect':
      return <MultiSelectField {...props} />
    case 'radio':
      return <RadioField {...props} />
    case 'checkbox':
      return <CheckboxField {...props} />
    case 'toggle':
      return <ToggleField {...props} />
    case 'date':
    case 'datetime':
    case 'time':
      return <DateField {...props} />
    case 'file':
    case 'image':
      return <FileField {...props} />
    case 'repeater':
      return <RepeaterField {...props} />
    case 'section':
      return (
        <SectionField
          {...props}
          renderField={renderField}
          values={allValues}
        />
      )
    case 'signature':
      return <SignatureField {...props} />
    case 'lookup':
      return <LookupField {...props} />
    case 'computed':
      return <ComputedField {...props} allValues={allValues} />
    case 'heading':
    case 'paragraph':
    case 'divider':
      return <LayoutFields field={field} />
    default:
      return <div className="ff-unknown-field">Unknown field type: {(field as FormField).type}</div>
  }
}

function buildRules(field: FormField, conditionalState?: { required?: boolean }) {
  const v = field.validation ?? {}
  const isRequired = v.required || conditionalState?.required

  return {
    required: isRequired ? (v.errorMessages?.['required'] ?? `${field.label} is required`) : false,
    minLength: v.minLength
      ? { value: v.minLength, message: v.errorMessages?.['minLength'] ?? `Minimum ${v.minLength} characters` }
      : undefined,
    maxLength: v.maxLength
      ? { value: v.maxLength, message: v.errorMessages?.['maxLength'] ?? `Maximum ${v.maxLength} characters` }
      : undefined,
    min: v.min !== undefined
      ? { value: v.min, message: v.errorMessages?.['min'] ?? `Minimum value is ${v.min}` }
      : undefined,
    max: v.max !== undefined
      ? { value: v.max, message: v.errorMessages?.['max'] ?? `Maximum value is ${v.max}` }
      : undefined,
    pattern: v.pattern
      ? { value: new RegExp(v.pattern), message: v.errorMessages?.['pattern'] ?? 'Invalid format' }
      : undefined,
  }
}
