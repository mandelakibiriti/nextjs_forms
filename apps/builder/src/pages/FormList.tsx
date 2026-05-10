import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormApi } from '../hooks/useFormApi.js'
import { useFormStore } from '../store/formStore.js'
import type { FormSchema } from '@formforge/schema-core'
import { createFormSchema } from '@formforge/schema-core'

export function FormListPage() {
  const { listForms, deleteForm } = useFormApi()
  const { loadSchema } = useFormStore()
  const [forms, setForms] = useState<FormSchema[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    listForms().then((f) => {
      setForms(f)
      setLoading(false)
    })
  }, [listForms])

  function createNew() {
    loadSchema(createFormSchema('Untitled Form'))
    navigate('/builder')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this form?')) return
    await deleteForm(id)
    setForms((f) => f.filter((form) => form.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
          FF
        </div>
        <h1 className="text-lg font-semibold text-gray-800">FormForge</h1>
        <div className="flex-1" />
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          onClick={createNew}
        >
          + New Form
        </button>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Your Forms</h2>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No forms yet. Create your first form!</p>
            <button
              type="button"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={createNew}
            >
              Create Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">{form.name}</h3>
                  {form.publishedAt && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                      Live
                    </span>
                  )}
                </div>
                {form.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{form.description}</p>
                )}
                <p className="text-xs text-gray-400 mb-4">
                  {form.steps.reduce((acc, s) => acc + s.fields.length, 0)} fields •{' '}
                  {new Date(form.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Link
                    to="/builder"
                    className="flex-1 text-center px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => loadSchema(form)}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="px-3 py-1.5 border border-red-100 rounded-md text-sm text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(form.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
