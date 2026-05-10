import { useMemo } from 'react'
import type { FieldComponentProps } from './index.js'

interface ComputedFieldProps extends FieldComponentProps {
  allValues: Record<string, unknown>
}

function evaluateExpression(expression: string, values: Record<string, unknown>): unknown {
  // Safe expression evaluator: only allows {{key}} references and arithmetic
  try {
    const resolved = expression.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = values[key]
      return typeof v === 'number' || typeof v === 'string' ? String(v) : '0'
    })

    // Only allow safe arithmetic characters
    if (!/^[\d\s+\-*/().]+$/.test(resolved)) return 0
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${resolved})`)()
  } catch {
    return 0
  }
}

export function ComputedField({ field, allValues }: ComputedFieldProps) {
  const result = useMemo(
    () => (field.expression ? evaluateExpression(field.expression, allValues) : ''),
    [field.expression, allValues]
  )

  return (
    <div className="ff-field ff-computed">
      <label className="ff-label">{field.label}</label>
      <div className="ff-computed__value" aria-live="polite">
        {String(result)}
      </div>
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
    </div>
  )
}
