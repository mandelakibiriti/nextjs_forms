import { z } from 'zod'
import type {
  FieldType,
  ConditionalOperator,
  ConditionalAction,
  DbColumnType,
  ThemeSpacing,
  WebhookEvent,
} from './types.js'

export const FieldTypeSchema = z.enum([
  'text', 'textarea', 'number', 'email', 'url', 'phone',
  'date', 'datetime', 'time',
  'select', 'multiselect', 'radio', 'checkbox', 'toggle',
  'file', 'image',
  'heading', 'paragraph', 'divider',
  'repeater', 'section', 'signature', 'lookup', 'computed',
]) satisfies z.ZodType<FieldType>

export const FieldValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional(),
  email: z.boolean().optional(),
  url: z.boolean().optional(),
  custom: z.string().optional(),
  errorMessages: z.record(z.string()).optional(),
})

export const ConditionalOperatorSchema = z.enum([
  'eq', 'neq', 'gt', 'lt', 'contains', 'empty', 'not_empty',
]) satisfies z.ZodType<ConditionalOperator>

export const ConditionalActionSchema = z.enum([
  'show', 'hide', 'require', 'disable', 'set_value',
]) satisfies z.ZodType<ConditionalAction>

export const ConditionalRuleSchema = z.object({
  when: z.string().min(1),
  operator: ConditionalOperatorSchema,
  value: z.unknown(),
  action: ConditionalActionSchema,
  target: z.string().optional(),
  targetValue: z.unknown().optional(),
})

export const FieldOptionSchema = z.object({
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  disabled: z.boolean().optional(),
})

export const LookupConfigSchema = z.object({
  endpoint: z.string().url(),
  method: z.enum(['GET', 'POST']),
  headers: z.record(z.string()).optional(),
  responseMapping: z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  }),
  debounceMs: z.number().int().positive().optional(),
})

export const DbColumnTypeSchema = z.enum([
  'text', 'integer', 'real', 'boolean', 'jsonb', 'timestamp',
]) satisfies z.ZodType<DbColumnType>

export const DbColumnConfigSchema = z.object({
  type: DbColumnTypeSchema,
  indexed: z.boolean().optional(),
  unique: z.boolean().optional(),
  nullable: z.boolean().optional(),
})

// Recursive schema for FormField (supports section/repeater nesting)
export const FormFieldSchema: z.ZodType<import('./types.js').FormField> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    key: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Key must be snake_case'),
    type: FieldTypeSchema,
    label: z.string().min(1),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    defaultValue: z.unknown().optional(),
    validation: FieldValidationSchema.optional(),
    conditions: z.array(ConditionalRuleSchema).optional(),
    options: z.array(FieldOptionSchema).optional(),
    lookup: LookupConfigSchema.optional(),
    expression: z.string().optional(),
    fields: z.array(FormFieldSchema).optional(),
    meta: z.record(z.unknown()).optional(),
    dbColumn: DbColumnConfigSchema.optional(),
  })
)

export const FormStepSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  conditions: z.array(ConditionalRuleSchema).optional(),
})

export const WebhookEventSchema = z.enum(['submitted', 'updated']) satisfies z.ZodType<WebhookEvent>

export const WebhookConfigSchema = z.object({
  url: z.string().url(),
  events: z.array(WebhookEventSchema).min(1),
  headers: z.record(z.string()).optional(),
})

export const FormSettingsSchema = z.object({
  submitLabel: z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  requireAuth: z.boolean().optional(),
  webhooks: z.array(WebhookConfigSchema).optional(),
  notifications: z
    .object({
      email: z.array(z.string().email()).optional(),
      slack: z.string().url().optional(),
    })
    .optional(),
})

export const ThemeSpacingSchema = z.enum(['compact', 'normal', 'relaxed']) satisfies z.ZodType<ThemeSpacing>

export const FormThemeSchema = z.object({
  primaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
  spacing: ThemeSpacingSchema.optional(),
})

export const FormSchemaSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive(),
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  description: z.string().optional(),
  isMultiStep: z.boolean(),
  steps: z.array(FormStepSchema).min(1),
  settings: FormSettingsSchema,
  theme: FormThemeSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
})

// Partial schema for creation (id, createdAt, updatedAt are server-generated)
export const CreateFormSchema = FormSchemaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  version: true,
})

export const UpdateFormSchema = CreateFormSchema.partial()
