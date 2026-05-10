export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'file'
  | 'image'
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'repeater'
  | 'section'
  | 'signature'
  | 'lookup'
  | 'computed'

export interface FieldValidation {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  email?: boolean
  url?: boolean
  custom?: string
  errorMessages?: Record<string, string>
}

export type ConditionalOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'empty' | 'not_empty'
export type ConditionalAction = 'show' | 'hide' | 'require' | 'disable' | 'set_value'

export interface ConditionalRule {
  when: string
  operator: ConditionalOperator
  value?: unknown
  action: ConditionalAction
  target?: string
  targetValue?: unknown
}

export interface FieldOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface LookupConfig {
  endpoint: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  responseMapping: {
    label: string
    value: string
  }
  debounceMs?: number
}

export type DbColumnType = 'text' | 'integer' | 'real' | 'boolean' | 'jsonb' | 'timestamp'

export interface DbColumnConfig {
  type: DbColumnType
  indexed?: boolean
  unique?: boolean
  nullable?: boolean
}

export interface FormField {
  id: string
  key: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  defaultValue?: unknown
  validation?: FieldValidation
  conditions?: ConditionalRule[]
  options?: FieldOption[]
  lookup?: LookupConfig
  expression?: string
  fields?: FormField[]
  meta?: Record<string, unknown>
  dbColumn?: DbColumnConfig
}

export interface FormStep {
  id: string
  title: string
  description?: string
  fields: FormField[]
  conditions?: ConditionalRule[]
}

export type WebhookEvent = 'submitted' | 'updated'

export interface WebhookConfig {
  url: string
  events: WebhookEvent[]
  headers?: Record<string, string>
}

export interface FormSettings {
  submitLabel?: string
  successMessage?: string
  redirectUrl?: string
  allowMultipleSubmissions?: boolean
  requireAuth?: boolean
  webhooks?: WebhookConfig[]
  notifications?: {
    email?: string[]
    slack?: string
  }
}

export type ThemeSpacing = 'compact' | 'normal' | 'relaxed'

export interface FormTheme {
  primaryColor?: string
  fontFamily?: string
  borderRadius?: string
  spacing?: ThemeSpacing
}

export interface FormSchema {
  id: string
  version: number
  name: string
  slug: string
  description?: string
  isMultiStep: boolean
  steps: FormStep[]
  settings: FormSettings
  theme?: FormTheme
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export const LAYOUT_FIELD_TYPES: FieldType[] = ['heading', 'paragraph', 'divider']
export const CONTAINER_FIELD_TYPES: FieldType[] = ['section', 'repeater']
export const INPUT_FIELD_TYPES: FieldType[] = [
  'text', 'textarea', 'number', 'email', 'url', 'phone',
  'date', 'datetime', 'time',
  'select', 'multiselect', 'radio', 'checkbox', 'toggle',
  'file', 'image', 'signature', 'lookup', 'computed',
]
