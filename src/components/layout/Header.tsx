import { useBrandGuideStore } from '../../stores/brandGuideStore'

export function Header() {
  const session = useBrandGuideStore(s => s.session)

  const pathLabel = session?.path === 'intern'
    ? `Building for ${session.internMeta?.fellowName ?? 'Fellow'}`
    : 'Your Brand'

  return (
    <header className="bg-brand-primary px-8 py-5 flex items-center justify-between">
      <div>
        <h1 className="font-heading text-xl font-semibold text-white">Brand Guide Builder</h1>
        {session && (
          <p className="text-brand-text-faint text-sm mt-0.5">{pathLabel}</p>
        )}
      </div>
      {session?.brandData.orgName && (
        <span className="font-heading text-brand-accent-gold text-[15px] font-medium">
          {session.brandData.orgName}
        </span>
      )}
    </header>
  )
}
