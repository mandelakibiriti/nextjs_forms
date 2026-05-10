import type { FormField } from '@formforge/schema-core'

export function LayoutFields({ field }: { field: FormField }) {
  switch (field.type) {
    case 'heading':
      return (
        <div className="ff-layout-heading">
          <h2>{field.label}</h2>
        </div>
      )
    case 'paragraph':
      return (
        <div className="ff-layout-paragraph">
          <p>{field.label}</p>
        </div>
      )
    case 'divider':
      return <hr className="ff-divider" aria-hidden="true" />
    default:
      return null
  }
}
