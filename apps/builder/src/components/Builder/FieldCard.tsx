import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormField } from '@formforge/schema-core'
import { useFormStore } from '../../store/formStore.js'

interface FieldCardProps {
  field: FormField
  stepId: string
  isSelected: boolean
}

export function FieldCard({ field, stepId, isSelected }: FieldCardProps) {
  const { setSelectedField, removeField, duplicateField } = useFormStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { field, stepId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border-2 rounded-lg px-4 py-3 cursor-pointer
        transition-all select-none
        ${isDragging ? 'opacity-40 shadow-lg scale-105' : ''}
        ${isSelected ? 'border-indigo-500 shadow-sm' : 'border-gray-200 hover:border-indigo-300'}`}
      onClick={() => setSelectedField(field.id)}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100
          text-gray-400 hover:text-gray-600 px-1"
        title="Drag to reorder"
      >
        ⠿
      </div>

      <div className="ml-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {field.type}
          </span>
          <span className="text-sm font-medium text-gray-800">{field.label}</span>
          {field.validation?.required && (
            <span className="text-red-400 text-xs">*</span>
          )}
        </div>
        {field.helpText && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{field.helpText}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-indigo-600 rounded"
          title="Duplicate field"
          onClick={(e) => {
            e.stopPropagation()
            duplicateField(stepId, field.id)
          }}
        >
          ⧉
        </button>
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-red-600 rounded"
          title="Delete field"
          onClick={(e) => {
            e.stopPropagation()
            removeField(stepId, field.id)
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
