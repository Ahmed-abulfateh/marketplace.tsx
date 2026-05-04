import type { ReactNode } from 'react'

type PageHeroProps = {
  variant: 'browse' | 'seller' | 'admin' | 'product'
  kicker: string
  title: string
  summary: ReactNode
  aside: ReactNode
  darkAside?: boolean
}

function PageHero({ variant, kicker, title, summary, aside, darkAside }: PageHeroProps) {
  return (
    <section className={`page-hero page-hero-${variant}`}>
      <div>
        <p className="section-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lead page-lead">{summary}</p>
      </div>
      <div className={darkAside ? 'page-summary-card dark' : 'page-summary-card'}>{aside}</div>
    </section>
  )
}

export default PageHero