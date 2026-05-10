import type { FormField, FormSchema, FormStep, FieldType, FormSettings } from './types.js'

let _cryptoId: (() => string) | null = null

function getUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function generateId(): string {
  return getUUID()
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createField(type: FieldType, overrides: Partial<FormField> = {}): FormField {
  const key = overrides.key ?? `field_${Date.now()}`
  return {
    id: generateId(),
    key,
    type,
    label: overrides.label ?? labelFromType(type),
    ...overrides,
  }
}

function labelFromType(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Text Field',
    textarea: 'Text Area',
    number: 'Number',
    email: 'Email',
    url: 'URL',
    phone: 'Phone Number',
    date: 'Date',
    datetime: 'Date & Time',
    time: 'Time',
    select: 'Dropdown',
    multiselect: 'Multi-Select',
    radio: 'Radio Group',
    checkbox: 'Checkbox',
    toggle: 'Toggle',
    file: 'File Upload',
    image: 'Image Upload',
    heading: 'Heading',
    paragraph: 'Paragraph',
    divider: 'Divider',
    repeater: 'Repeater Group',
    section: 'Section',
    signature: 'Signature',
    lookup: 'Lookup',
    computed: 'Computed Field',
  }
  return labels[type]
}

export function createStep(overrides: Partial<FormStep> = {}): FormStep {
  return {
    id: generateId(),
    title: 'Step 1',
    fields: [],
    ...overrides,
  }
}

export function createFormSchema(
  name: string,
  overrides: Partial<Omit<FormSchema, 'id' | 'createdAt' | 'updatedAt'>> = {}
): FormSchema {
  const now = new Date().toISOString()
  const slug = overrides.slug ?? generateSlug(name)
  return {
    id: generateId(),
    version: 1,
    name,
    slug,
    isMultiStep: false,
    steps: [createStep({ title: 'Form' })],
    settings: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/** Flatten all fields in a schema (including nested section/repeater fields) */
export function flattenFields(schema: FormSchema): FormField[] {
  const result: FormField[] = []
  for (const step of schema.steps) {
    collectFields(step.fields, result)
  }
  return result
}

function collectFields(fields: FormField[], acc: FormField[]): void {
  for (const field of fields) {
    acc.push(field)
    if (field.fields && field.fields.length > 0) {
      collectFields(field.fields, acc)
    }
  }
}

/** Find a field by id anywhere in the schema */
export function findField(schema: FormSchema, fieldId: string): FormField | undefined {
  return flattenFields(schema).find((f) => f.id === fieldId)
}

/** Find a field by key anywhere in the schema */
export function findFieldByKey(schema: FormSchema, key: string): FormField | undefined {
  return flattenFields(schema).find((f) => f.key === key)
}

/** Derive default Drizzle column type from FieldType */
export function inferDbColumnType(
  fieldType: FieldType
): import('./types.js').DbColumnType {
  switch (fieldType) {
    case 'number':
      return 'real'
    case 'toggle':
    case 'checkbox':
      return 'boolean'
    case 'date':
    case 'datetime':
      return 'timestamp'
    case 'multiselect':
    case 'repeater':
    case 'section':
      return 'jsonb'
    default:
      return 'text'
  }
}
