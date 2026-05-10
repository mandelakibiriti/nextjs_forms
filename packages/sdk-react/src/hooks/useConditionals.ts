import { useMemo } from 'react'
import type { FormField, ConditionalRule } from '@formforge/schema-core'

type FieldValues = Record<string, unknown>
type ConditionalState = Record<string, { visible: boolean; required: boolean; disabled: boolean }>

function evaluateCondition(rule: ConditionalRule, values: FieldValues): boolean {
  const watchedValue = values[rule.when]

  switch (rule.operator) {
    case 'eq':
      return watchedValue === rule.value
    case 'neq':
      return watchedValue !== rule.value
    case 'gt':
      return typeof watchedValue === 'number' && typeof rule.value === 'number'
        ? watchedValue > rule.value
        : false
    case 'lt':
      return typeof watchedValue === 'number' && typeof rule.value === 'number'
        ? watchedValue < rule.value
        : false
    case 'contains':
      if (typeof watchedValue === 'string' && typeof rule.value === 'string') {
        return watchedValue.includes(rule.value)
      }
      if (Array.isArray(watchedValue)) {
        return watchedValue.includes(rule.value)
      }
      return false
    case 'empty':
      return watchedValue === '' || watchedValue === null || watchedValue === undefined
    case 'not_empty':
      return watchedValue !== '' && watchedValue !== null && watchedValue !== undefined
    default:
      return false
  }
}

export function useConditionals(
  fields: FormField[],
  values: FieldValues
): { fields: FormField[]; state: ConditionalState } {
  return useMemo(() => {
    const state: ConditionalState = {}

    for (const field of fields) {
      state[field.key] = { visible: true, required: false, disabled: false }
    }

    for (const field of fields) {
      if (!field.conditions) continue

      for (const rule of field.conditions) {
        const conditionMet = evaluateCondition(rule, values)

        if (conditionMet) {
          const target = rule.target ?? field.key
          if (!state[target]) {
            state[target] = { visible: true, required: false, disabled: false }
          }

          switch (rule.action) {
            case 'show':
              state[target]!.visible = true
              break
            case 'hide':
              state[target]!.visible = false
              break
            case 'require':
              state[target]!.required = true
              break
            case 'disable':
              state[target]!.disabled = true
              break
          }
        }
      }
    }

    const visibleFields = fields.filter((f) => state[f.key]?.visible !== false)
    return { fields: visibleFields, state }
  }, [fields, values])
}
