import { useState, useCallback, useRef } from 'react'
import type { FieldComponentProps } from './index.js'
import type { FieldOption } from '@formforge/schema-core'

export function LookupField({ field, value, onChange, error, disabled, required }: FieldComponentProps) {
  const [query, setQuery] = useState(typeof value === 'string' ? value : '')
  const [options, setOptions] = useState<FieldOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = field.lookup
  const debounceMs = lookup?.debounceMs ?? 300

  const search = useCallback(
    async (q: string) => {
      if (!lookup || !q.trim()) {
        setOptions([])
        return
      }

      setLoading(true)
      try {
        const url = lookup.endpoint.replace('{{fieldValue}}', encodeURIComponent(q))
        const res = await fetch(url, {
          method: lookup.method,
          headers: lookup.headers,
          body: lookup.method === 'POST' ? JSON.stringify({ query: q }) : undefined,
        })
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data as Record<string, unknown[]>).data ?? []
        setOptions(
          (items as Record<string, unknown>[]).map((item) => ({
            label: String(item[lookup.responseMapping.label] ?? ''),
            value: String(item[lookup.responseMapping.value] ?? ''),
          }))
        )
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [lookup]
  )

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), debounceMs)
  }

  function select(opt: FieldOption) {
    setQuery(opt.label)
    onChange(opt.value)
    setOpen(false)
  }

  return (
    <div className="ff-field ff-lookup">
      <label className="ff-label" htmlFor={field.id}>
        {field.label}
        {required && <span className="ff-required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={field.id}
        type="text"
        className={`ff-input ${error ? 'ff-input--error' : ''}`}
        value={query}
        placeholder={field.placeholder ?? 'Type to search...'}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        autoComplete="off"
        aria-invalid={!!error}
      />
      {open && (loading || options.length > 0) && (
        <ul className="ff-lookup__dropdown" role="listbox">
          {loading ? (
            <li className="ff-lookup__loading">Searching...</li>
          ) : (
            options.map((opt) => (
              <li
                key={String(opt.value)}
                className="ff-lookup__option"
                role="option"
                aria-selected={value === opt.value}
                onMouseDown={() => select(opt)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
      {field.helpText && <p className="ff-help">{field.helpText}</p>}
      {error && <p className="ff-error" role="alert">{error}</p>}
    </div>
  )
}
