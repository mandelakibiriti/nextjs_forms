import Editor from '@monaco-editor/react'
import { useCallback, useState } from 'react'
import { useFormStore } from '../../store/formStore.js'
import { FormSchemaSchema } from '@formforge/schema-core'

export function MonacoJsonEditor() {
  const { schema, loadSchema } = useFormStore()
  const [parseError, setParseError] = useState<string | null>(null)
  const [value, setValue] = useState(() => JSON.stringify(schema, null, 2))

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (!newValue) return
      setValue(newValue)
      setParseError(null)

      try {
        const parsed = JSON.parse(newValue) as unknown
        const result = FormSchemaSchema.safeParse(parsed)
        if (result.success) {
          loadSchema(result.data)
        } else {
          setParseError(result.error.issues[0]?.message ?? 'Invalid schema')
        }
      } catch {
        setParseError('Invalid JSON')
      }
    },
    [loadSchema]
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white">
        <span className="text-xs font-semibold text-gray-500">JSON Schema Editor</span>
        {parseError ? (
          <span className="text-xs text-red-500">⚠ {parseError}</span>
        ) : (
          <span className="text-xs text-green-500">✓ Valid schema</span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          className="text-xs text-indigo-600 hover:underline"
          onClick={() => setValue(JSON.stringify(schema, null, 2))}
        >
          Reset
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language="json"
          value={value}
          onChange={handleChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  )
}
