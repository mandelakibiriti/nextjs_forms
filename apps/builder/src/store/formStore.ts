import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FormSchema, FormField, FormStep, FieldType, FormSettings, FormTheme } from '@formforge/schema-core'
import { createFormSchema, createField, createStep, generateId } from '@formforge/schema-core'

interface FormStore {
  schema: FormSchema
  selectedFieldId: string | null
  selectedStepId: string | null
  isDirty: boolean
  viewMode: 'builder' | 'preview' | 'json'

  // Schema-level actions
  updateSchema: (patch: Partial<Pick<FormSchema, 'name' | 'slug' | 'description' | 'isMultiStep'>>) => void
  updateSettings: (settings: Partial<FormSettings>) => void
  updateTheme: (theme: Partial<FormTheme>) => void
  loadSchema: (schema: FormSchema) => void
  resetSchema: () => void

  // Step actions
  addStep: () => void
  removeStep: (stepId: string) => void
  updateStep: (stepId: string, patch: Partial<Pick<FormStep, 'title' | 'description'>>) => void
  reorderSteps: (fromIndex: number, toIndex: number) => void
  setSelectedStep: (stepId: string | null) => void

  // Field actions
  addField: (stepId: string, fieldType: FieldType, position?: number) => void
  removeField: (stepId: string, fieldId: string) => void
  moveField: (fromStepId: string, fromIndex: number, toStepId: string, toIndex: number) => void
  updateField: (fieldId: string, patch: Partial<FormField>) => void
  duplicateField: (stepId: string, fieldId: string) => void
  setSelectedField: (fieldId: string | null) => void

  // UI state
  setViewMode: (mode: 'builder' | 'preview' | 'json') => void
  markClean: () => void
}

const defaultSchema = createFormSchema('Untitled Form')

function updateFieldInSteps(steps: FormStep[], fieldId: string, patch: Partial<FormField>): FormStep[] {
  return steps.map((step) => ({
    ...step,
    fields: updateFieldInList(step.fields, fieldId, patch),
  }))
}

function updateFieldInList(fields: FormField[], fieldId: string, patch: Partial<FormField>): FormField[] {
  return fields.map((f) => {
    if (f.id === fieldId) return { ...f, ...patch }
    if (f.fields) return { ...f, fields: updateFieldInList(f.fields, fieldId, patch) }
    return f
  })
}

function removeFieldFromList(fields: FormField[], fieldId: string): FormField[] {
  return fields
    .filter((f) => f.id !== fieldId)
    .map((f) => (f.fields ? { ...f, fields: removeFieldFromList(f.fields, fieldId) } : f))
}

function now() {
  return new Date().toISOString()
}

export const useFormStore = create<FormStore>()(
  devtools(
    (set, get) => ({
      schema: defaultSchema,
      selectedFieldId: null,
      selectedStepId: defaultSchema.steps[0]?.id ?? null,
      isDirty: false,
      viewMode: 'builder',

      updateSchema: (patch) =>
        set((s) => ({
          schema: { ...s.schema, ...patch, updatedAt: now() },
          isDirty: true,
        })),

      updateSettings: (settings) =>
        set((s) => ({
          schema: { ...s.schema, settings: { ...s.schema.settings, ...settings }, updatedAt: now() },
          isDirty: true,
        })),

      updateTheme: (theme) =>
        set((s) => ({
          schema: { ...s.schema, theme: { ...s.schema.theme, ...theme }, updatedAt: now() },
          isDirty: true,
        })),

      loadSchema: (schema) =>
        set({
          schema,
          selectedFieldId: null,
          selectedStepId: schema.steps[0]?.id ?? null,
          isDirty: false,
        }),

      resetSchema: () =>
        set({
          schema: createFormSchema('Untitled Form'),
          selectedFieldId: null,
          selectedStepId: null,
          isDirty: false,
        }),

      addStep: () =>
        set((s) => {
          const step = createStep({ title: `Step ${s.schema.steps.length + 1}` })
          return {
            schema: {
              ...s.schema,
              steps: [...s.schema.steps, step],
              isMultiStep: true,
              updatedAt: now(),
            },
            selectedStepId: step.id,
            isDirty: true,
          }
        }),

      removeStep: (stepId) =>
        set((s) => {
          if (s.schema.steps.length <= 1) return s
          const steps = s.schema.steps.filter((st) => st.id !== stepId)
          return {
            schema: {
              ...s.schema,
              steps,
              isMultiStep: steps.length > 1,
              updatedAt: now(),
            },
            selectedStepId: steps[0]?.id ?? null,
            isDirty: true,
          }
        }),

      updateStep: (stepId, patch) =>
        set((s) => ({
          schema: {
            ...s.schema,
            steps: s.schema.steps.map((st) => (st.id === stepId ? { ...st, ...patch } : st)),
            updatedAt: now(),
          },
          isDirty: true,
        })),

      reorderSteps: (fromIndex, toIndex) =>
        set((s) => {
          const steps = [...s.schema.steps]
          const [moved] = steps.splice(fromIndex, 1)
          if (!moved) return s
          steps.splice(toIndex, 0, moved)
          return {
            schema: { ...s.schema, steps, updatedAt: now() },
            isDirty: true,
          }
        }),

      setSelectedStep: (stepId) => set({ selectedStepId: stepId }),

      addField: (stepId, fieldType, position) =>
        set((s) => {
          const field = createField(fieldType, { key: `field_${Date.now()}` })
          const steps = s.schema.steps.map((step) => {
            if (step.id !== stepId) return step
            const fields = [...step.fields]
            const insertAt = position !== undefined ? position : fields.length
            fields.splice(insertAt, 0, field)
            return { ...step, fields }
          })
          return {
            schema: { ...s.schema, steps, updatedAt: now() },
            selectedFieldId: field.id,
            isDirty: true,
          }
        }),

      removeField: (stepId, fieldId) =>
        set((s) => ({
          schema: {
            ...s.schema,
            steps: s.schema.steps.map((step) =>
              step.id === stepId
                ? { ...step, fields: removeFieldFromList(step.fields, fieldId) }
                : step
            ),
            updatedAt: now(),
          },
          selectedFieldId: s.selectedFieldId === fieldId ? null : s.selectedFieldId,
          isDirty: true,
        })),

      moveField: (fromStepId, fromIndex, toStepId, toIndex) =>
        set((s) => {
          let movedField: FormField | undefined

          const steps = s.schema.steps.map((step) => {
            if (step.id === fromStepId) {
              const fields = [...step.fields]
              ;[movedField] = fields.splice(fromIndex, 1)
              return { ...step, fields }
            }
            return step
          })

          if (!movedField) return s

          const captured = movedField
          const finalSteps = steps.map((step) => {
            if (step.id === toStepId) {
              const fields = [...step.fields]
              fields.splice(toIndex, 0, captured)
              return { ...step, fields }
            }
            return step
          })

          return {
            schema: { ...s.schema, steps: finalSteps, updatedAt: now() },
            isDirty: true,
          }
        }),

      updateField: (fieldId, patch) =>
        set((s) => ({
          schema: {
            ...s.schema,
            steps: updateFieldInSteps(s.schema.steps, fieldId, patch),
            updatedAt: now(),
          },
          isDirty: true,
        })),

      duplicateField: (stepId, fieldId) =>
        set((s) => {
          let originalField: FormField | undefined
          let originalIndex = -1

          const steps = s.schema.steps.map((step) => {
            if (step.id !== stepId) return step
            originalIndex = step.fields.findIndex((f) => f.id === fieldId)
            originalField = step.fields[originalIndex]
            return step
          })

          if (!originalField || originalIndex === -1) return s

          const duplicate: FormField = {
            ...originalField,
            id: generateId(),
            key: `${originalField.key}_copy`,
            label: `${originalField.label} (copy)`,
          }

          return {
            schema: {
              ...s.schema,
              steps: s.schema.steps.map((step) => {
                if (step.id !== stepId) return step
                const fields = [...step.fields]
                fields.splice(originalIndex + 1, 0, duplicate)
                return { ...step, fields }
              }),
              updatedAt: now(),
            },
            selectedFieldId: duplicate.id,
            isDirty: true,
          }
        }),

      setSelectedField: (fieldId) => set({ selectedFieldId: fieldId }),

      setViewMode: (mode) => set({ viewMode: mode }),

      markClean: () => set({ isDirty: false }),
    }),
    { name: 'FormForge' }
  )
)
