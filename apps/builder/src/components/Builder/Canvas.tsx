import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { FormField, FieldType } from '@formforge/schema-core'
import { useFormStore } from '../../store/formStore.js'
import { FieldCard } from './FieldCard.js'
import { StepManager } from './StepManager.js'

export function Canvas() {
  const { schema, selectedFieldId, selectedStepId, addField, moveField } = useFormStore()
  const [activeField, setActiveField] = useState<FormField | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeStep = schema.steps.find((s) => s.id === selectedStepId) ?? schema.steps[0]

  function handleDragStart(event: DragStartEvent) {
    const { data } = event.active
    if (data.current?.field) {
      setActiveField(data.current.field as FormField)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveField(null)
    const { active, over } = event
    if (!over || !activeStep) return

    const fromPalette = active.data.current?.fromPalette as boolean | undefined
    const fieldType = active.data.current?.fieldType as FieldType | undefined

    if (fromPalette && fieldType) {
      // Dropped from palette onto canvas
      addField(activeStep.id, fieldType)
      return
    }

    // Reorder within canvas
    const activeFieldData = active.data.current?.field as FormField | undefined
    const activeStepId = active.data.current?.stepId as string | undefined
    if (!activeFieldData || !activeStepId) return

    const fromIndex = activeStep.fields.findIndex((f) => f.id === active.id)
    const toIndex = activeStep.fields.findIndex((f) => f.id === over.id)
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

    moveField(activeStepId, fromIndex, activeStep.id, toIndex)
  }

  if (!activeStep) return null

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
      <StepManager />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeStep.fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              {/* Form header */}
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 mb-4">
                <h1 className="text-xl font-bold text-gray-800">{schema.name}</h1>
                {schema.description && (
                  <p className="text-gray-500 mt-1 text-sm">{schema.description}</p>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-2">
                {activeStep.fields.length === 0 ? (
                  <EmptyCanvas />
                ) : (
                  activeStep.fields.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      stepId={activeStep.id}
                      isSelected={field.id === selectedFieldId}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeField && (
            <div className="bg-white border-2 border-indigo-400 rounded-lg px-4 py-3 shadow-xl opacity-90">
              <span className="text-sm font-medium text-gray-800">{activeField.label}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function EmptyCanvas() {
  return (
    <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
      <p className="text-gray-400 text-sm">Drag fields from the palette or click to add</p>
    </div>
  )
}
