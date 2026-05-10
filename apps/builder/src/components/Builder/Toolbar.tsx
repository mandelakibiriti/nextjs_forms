import { useFormStore } from '../../store/formStore.js'
import { useFormApi } from '../../hooks/useFormApi.js'

export function Toolbar() {
  const { schema, viewMode, isDirty, setViewMode, markClean, updateSchema } = useFormStore()
  const { saveForm, publishForm, saving, saveError } = useFormApi()

  async function handleSave() {
    const saved = await saveForm(schema)
    if (saved) {
      markClean()
    }
  }

  async function handlePublish() {
    if (isDirty) await handleSave()
    await publishForm(schema.id)
  }

  return (
    <header className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
          FF
        </div>
        <span className="font-semibold text-gray-800 text-sm hidden md:block">FormForge</span>
      </div>

      {/* Form name */}
      <input
        type="text"
        className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1 max-w-xs"
        value={schema.name}
        onChange={(e) => updateSchema({ name: e.target.value })}
        placeholder="Form name..."
      />

      {isDirty && (
        <span className="text-xs text-amber-500 flex-shrink-0">● Unsaved changes</span>
      )}

      {saveError && (
        <span className="text-xs text-red-500 flex-shrink-0">{saveError}</span>
      )}

      <div className="flex-1" />

      {/* View mode tabs */}
      <div className="flex border border-gray-200 rounded-md overflow-hidden text-xs">
        {(['builder', 'preview', 'json'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`px-3 py-1.5 capitalize font-medium transition-colors
              ${viewMode === mode ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setViewMode(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Actions */}
      <button
        type="button"
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        onClick={handleSave}
        disabled={saving || !isDirty}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        onClick={handlePublish}
        disabled={saving}
      >
        Publish
      </button>
    </header>
  )
}
