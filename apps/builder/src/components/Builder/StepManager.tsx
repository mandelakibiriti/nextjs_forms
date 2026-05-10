import { useFormStore } from '../../store/formStore.js'

export function StepManager() {
  const { schema, selectedStepId, addStep, removeStep, updateStep, setSelectedStep } = useFormStore()

  if (!schema.isMultiStep && schema.steps.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-200 bg-white overflow-x-auto">
      {schema.steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${selectedStepId === step.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setSelectedStep(step.id)}
          >
            {i + 1}. {step.title}
          </button>
          {schema.steps.length > 1 && (
            <button
              type="button"
              className="text-gray-300 hover:text-red-400 text-xs p-0.5"
              onClick={() => removeStep(step.id)}
              title="Remove step"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="px-3 py-1.5 rounded text-sm text-indigo-600 hover:bg-indigo-50 flex-shrink-0"
        onClick={addStep}
      >
        + Add Step
      </button>
    </div>
  )
}
