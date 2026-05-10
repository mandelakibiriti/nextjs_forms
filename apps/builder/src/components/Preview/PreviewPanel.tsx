import { FormRenderer } from '@formforge/react'
import { useFormStore } from '../../store/formStore.js'

export function PreviewPanel() {
  const { schema } = useFormStore()

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            Preview Mode
          </span>
        </div>
        <FormRenderer
          schema={schema}
          onSubmit={(data: Record<string, unknown>) => {
            console.log('[preview] Form submitted:', data)
            alert('Preview submission: check console for data')
          }}
        />
      </div>
    </div>
  )
}
