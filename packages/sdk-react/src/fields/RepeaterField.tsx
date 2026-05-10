import { useState } from 'react'
import type { FieldComponentProps } from './index.js'
import type { FormField } from '@formforge/schema-core'
import { generateId } from '@formforge/schema-core'

type RowValues = Record<string, unknown>

interface RepeaterEntry {
  _id: string
  values: RowValues
}

export function RepeaterField({ field, value, onChange, error, disabled }: FieldComponentProps) {
  const rows: RepeaterEntry[] = Array.isArray(value)
    ? (value as RepeaterEntry[])
    : []

  function addRow() {
    const newRow: RepeaterEntry = { _id: generateId(), values: {} }
    onChange([...rows, newRow])
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r._id !== id))
  }

  function updateRow(id: string, fieldKey: string, fieldValue: unknown) {
    onChange(
      rows.map((r) =>
        r._id === id ? { ...r, values: { ...r.values, [fieldKey]: fieldValue } } : r
      )
    )
  }

  const subFields = field.fields ?? []

  return (
    <div className="ff-field ff-repeater">
      <p className="ff-label">{field.label}</p>
      {rows.map((row, idx) => (
        <div key={row._id} className="ff-repeater__row">
          <div className="ff-repeater__row-header">
            <span>Entry {idx + 1}</span>
            {!disabled && (
              <button type="button" className="ff-repeater__remove" onClick={() => removeRow(row._id)}>
                Remove
              </button>
            )}
          </div>
          {subFields.map((subField) => (
            <RepeaterSubField
              key={subField.id}
              field={subField}
              value={row.values[subField.key]}
              onChange={(v) => updateRow(row._id, subField.key, v)}
              disabled={disabled}
            />
          ))}
        </div>
      ))}
      {!disabled && (
        <button type="button" className="ff-repeater__add" onClick={addRow}>
          + Add entry
        </button>
      )}
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}

// Minimal inline renderer for repeater sub-fields (avoids circular import)
function RepeaterSubField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
}) {
  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={field.id}>{field.label}</label>
      <input
        id={field.id}
        type="text"
        className="ff-input"
        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
      />
    </div>
  )
}
