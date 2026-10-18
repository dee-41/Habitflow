import PageHeader from './PageHeader.jsx'

export default function PlaceholderPage({ title, description, icon: Icon, day }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-medium text-slate-900">Coming on {day}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </>
  )
}