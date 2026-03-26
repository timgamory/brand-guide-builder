import type { Field } from '../../types'

export function FallbackForm({ fields, data, onChange }: {
  fields: Field[]
  data: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="max-w-[620px] mx-auto p-6 space-y-7">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block font-body text-[15px] font-semibold text-brand-text mb-1.5 leading-snug">
            {field.label}
          </label>
          {field.help && (
            <p className="text-sm text-brand-text-faint italic mb-2.5 leading-relaxed">{field.help}</p>
          )}
          {field.type === 'textarea' ? (
            <textarea
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body leading-relaxed"
            />
          ) : field.type === 'select' ? (
            <select
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-body appearance-none cursor-pointer"
            >
              <option value="">Choose one...</option>
              {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.type === 'color' ? (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data[field.key] || field.defaultValue || '#1e293b'}
                onChange={e => onChange(field.key, e.target.value)}
                className="w-13 h-11 border-2 border-brand-border-dark rounded-xl cursor-pointer p-0.5 bg-white"
              />
              <code className="text-sm text-brand-text-muted font-body">
                {data[field.key] || field.defaultValue || '#1e293b'}
              </code>
            </div>
          ) : (
            <input
              type="text"
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-body"
            />
          )}
        </div>
      ))}
    </div>
  )
}
