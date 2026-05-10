import { useDraggable } from '@dnd-kit/core'
import type { FieldType } from '@formforge/schema-core'

interface PaletteItem {
  type: FieldType
  label: string
  icon: string
  group: string
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Input
  { type: 'text', label: 'Text', icon: '𝐓', group: 'Input' },
  { type: 'textarea', label: 'Text Area', icon: '☰', group: 'Input' },
  { type: 'number', label: 'Number', icon: '#', group: 'Input' },
  { type: 'email', label: 'Email', icon: '@', group: 'Input' },
  { type: 'phone', label: 'Phone', icon: '✆', group: 'Input' },
  { type: 'url', label: 'URL', icon: '🔗', group: 'Input' },
  // Choice
  { type: 'select', label: 'Dropdown', icon: '▾', group: 'Choice' },
  { type: 'multiselect', label: 'Multi-Select', icon: '☑', group: 'Choice' },
  { type: 'radio', label: 'Radio', icon: '◉', group: 'Choice' },
  { type: 'checkbox', label: 'Checkbox', icon: '✓', group: 'Choice' },
  { type: 'toggle', label: 'Toggle', icon: '⏻', group: 'Choice' },
  // Date
  { type: 'date', label: 'Date', icon: '📅', group: 'Date & Time' },
  { type: 'datetime', label: 'Date & Time', icon: '🕐', group: 'Date & Time' },
  { type: 'time', label: 'Time', icon: '⏱', group: 'Date & Time' },
  // Advanced
  { type: 'file', label: 'File Upload', icon: '📎', group: 'Advanced' },
  { type: 'image', label: 'Image Upload', icon: '🖼', group: 'Advanced' },
  { type: 'signature', label: 'Signature', icon: '✍', group: 'Advanced' },
  { type: 'lookup', label: 'Lookup', icon: '🔍', group: 'Advanced' },
  { type: 'computed', label: 'Computed', icon: '⚡', group: 'Advanced' },
  // Layout
  { type: 'heading', label: 'Heading', icon: 'H', group: 'Layout' },
  { type: 'paragraph', label: 'Paragraph', icon: '¶', group: 'Layout' },
  { type: 'divider', label: 'Divider', icon: '—', group: 'Layout' },
  { type: 'section', label: 'Section', icon: '□', group: 'Layout' },
  { type: 'repeater', label: 'Repeater', icon: '↻', group: 'Layout' },
]

const GROUPS = ['Input', 'Choice', 'Date & Time', 'Advanced', 'Layout']

function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { fieldType: item.type, fromPalette: true },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-grab
        hover:bg-indigo-50 hover:text-indigo-700 border border-transparent
        hover:border-indigo-200 select-none transition-colors
        ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="w-5 text-center text-gray-400">{item.icon}</span>
      <span>{item.label}</span>
    </div>
  )
}

export function FieldPalette() {
  return (
    <aside className="w-56 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fields</h2>
      </div>
      <div className="p-2">
        {GROUPS.map((group) => {
          const items = PALETTE_ITEMS.filter((i) => i.group === group)
          return (
            <div key={group} className="mb-4">
              <p className="text-xs font-medium text-gray-400 px-2 mb-1 uppercase tracking-wide">
                {group}
              </p>
              {items.map((item) => (
                <DraggablePaletteItem key={item.type} item={item} />
              ))}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
