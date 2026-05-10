import { useFormStore } from '../../store/formStore.js'
import { flattenFields } from '@formforge/schema-core'
import type { FormField, FieldValidation } from '@formforge/schema-core'

export function PropertyEditor() {
  const { schema, selectedFieldId, updateField } = useFormStore()

  if (!selectedFieldId) {
    return (
      <aside className="w-72 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</h2>
        </div>
        <div className="p-4 text-sm text-gray-400 text-center py-12">
          Select a field to edit its properties
        </div>
      </aside>
    )
  }

  const field = flattenFields(schema).find((f) => f.id === selectedFieldId)
  if (!field) return null

  function update(patch: Partial<FormField>) {
    updateField(selectedFieldId!, patch)
  }

  function updateValidation(patch: Partial<FieldValidation>) {
    update({ validation: { ...field!.validation, ...patch } })
  }

  return (
    <aside className="w-72 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</h2>
        <p className="text-xs text-indigo-600 mt-0.5">{field.type}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Label */}
        <PropField label="Label">
          <input
            type="text"
            className="prop-input"
            value={field.label}
            onChange={(e) => update({ label: e.target.value })}
          />
        </PropField>

        {/* Field key */}
        <PropField label="Field Key">
          <input
            type="text"
            className="prop-input font-mono text-xs"
            value={field.key}
            onChange={(e) => update({ key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
          />
        </PropField>

        {/* Placeholder */}
        {!['heading', 'paragraph', 'divider', 'section', 'repeater'].includes(field.type) && (
          <PropField label="Placeholder">
            <input
              type="text"
              className="prop-input"
              value={field.placeholder ?? ''}
              onChange={(e) => update({ placeholder: e.target.value || undefined })}
            />
          </PropField>
        )}

        {/* Help text */}
        <PropField label="Help Text">
          <input
            type="text"
            className="prop-input"
            value={field.helpText ?? ''}
            onChange={(e) => update({ helpText: e.target.value || undefined })}
          />
        </PropField>

        {/* Validation section */}
        {!['heading', 'paragraph', 'divider'].includes(field.type) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Validation</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.validation?.required ?? false}
                  onChange={(e) => updateValidation({ required: e.target.checked || undefined })}
                />
                Required
              </label>

              {['text', 'textarea', 'email', 'url', 'phone'].includes(field.type) && (
                <>
                  <PropFieldInline label="Min length">
                    <input
                      type="number"
                      className="prop-input-sm"
                      min={0}
                      value={field.validation?.minLength ?? ''}
                      onChange={(e) =>
                        updateValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </PropFieldInline>
                  <PropFieldInline label="Max length">
                    <input
                      type="number"
                      className="prop-input-sm"
                      min={1}
                      value={field.validation?.maxLength ?? ''}
                      onChange={(e) =>
                        updateValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </PropFieldInline>
                  <PropFieldInline label="Pattern (regex)">
                    <input
                      type="text"
                      className="prop-input-sm font-mono text-xs"
                      value={field.validation?.pattern ?? ''}
                      onChange={(e) =>
                        updateValidation({ pattern: e.target.value || undefined })
                      }
                    />
                  </PropFieldInline>
                </>
              )}

              {field.type === 'number' && (
                <>
                  <PropFieldInline label="Min value">
                    <input
                      type="number"
                      className="prop-input-sm"
                      value={field.validation?.min ?? ''}
                      onChange={(e) =>
                        updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </PropFieldInline>
                  <PropFieldInline label="Max value">
                    <input
                      type="number"
                      className="prop-input-sm"
                      value={field.validation?.max ?? ''}
                      onChange={(e) =>
                        updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </PropFieldInline>
                </>
              )}
            </div>
          </div>
        )}

        {/* Options (select/radio/checkbox/multiselect) */}
        {['select', 'multiselect', 'radio'].includes(field.type) && (
          <OptionsEditor field={field} onUpdate={update} />
        )}

        {/* Expression for computed */}
        {field.type === 'computed' && (
          <PropField label="Expression">
            <input
              type="text"
              className="prop-input font-mono text-xs"
              placeholder="e.g. {{qty}} * {{price}}"
              value={field.expression ?? ''}
              onChange={(e) => update({ expression: e.target.value || undefined })}
            />
            <p className="text-xs text-gray-400 mt-1">Use {'{{fieldKey}}'} to reference other fields</p>
          </PropField>
        )}
      </div>
    </aside>
  )
}

function PropField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function PropFieldInline({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</label>
      {children}
    </div>
  )
}

function OptionsEditor({
  field,
  onUpdate,
}: {
  field: FormField
  onUpdate: (patch: Partial<FormField>) => void
}) {
  const options = field.options ?? []

  function addOption() {
    onUpdate({
      options: [...options, { label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` }],
    })
  }

  function removeOption(index: number) {
    onUpdate({ options: options.filter((_, i) => i !== index) })
  }

  function updateOption(index: number, key: 'label' | 'value', value: string) {
    onUpdate({
      options: options.map((o, i) => (i === index ? { ...o, [key]: value } : o)),
    })
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Options</p>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-1 items-center">
            <input
              type="text"
              className="prop-input-sm flex-1"
              placeholder="Label"
              value={opt.label}
              onChange={(e) => updateOption(i, 'label', e.target.value)}
            />
            <input
              type="text"
              className="prop-input-sm flex-1 font-mono text-xs"
              placeholder="Value"
              value={String(opt.value)}
              onChange={(e) => updateOption(i, 'value', e.target.value)}
            />
            <button
              type="button"
              className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0"
              onClick={() => removeOption(i)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs text-indigo-600 hover:underline"
          onClick={addOption}
        >
          + Add option
        </button>
      </div>
    </div>
  )
}
