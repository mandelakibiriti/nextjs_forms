import { useFormStore } from '../../store/formStore.js'
import { FieldPalette } from './FieldPalette.js'
import { Canvas } from './Canvas.js'
import { PropertyEditor } from './PropertyEditor.js'
import { Toolbar } from './Toolbar.js'
import { PreviewPanel } from '../Preview/PreviewPanel.js'
import { MonacoJsonEditor } from '../JsonEditor/MonacoJsonEditor.js'

export function BuilderLayout() {
  const { viewMode } = useFormStore()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />

      <div className="flex-1 flex min-h-0">
        {viewMode === 'builder' && (
          <>
            <FieldPalette />
            <Canvas />
            <PropertyEditor />
          </>
        )}

        {viewMode === 'preview' && (
          <div className="flex-1 overflow-y-auto">
            <PreviewPanel />
          </div>
        )}

        {viewMode === 'json' && (
          <div className="flex-1">
            <MonacoJsonEditor />
          </div>
        )}
      </div>
    </div>
  )
}
