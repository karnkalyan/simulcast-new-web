import type { ReactNode } from 'react';

export default function PageHero({
  kicker,
  title,
  description,
  image,
  alt,
  label = 'CONCEPTUAL TECHNOLOGY VISUAL',
  action,
}: {
  kicker: string;
  title: ReactNode;
  description: string;
  image: string;
  alt: string;
  label?: string;
  action?: ReactNode;
}) {
  return (
    <section className="sc-page-hero">
      <div className="sc-page-hero-art" aria-hidden="true">
        <img src={image} alt={alt} />
        {label && <span className="sc-page-hero-label">{label}</span>}
      </div>
      <div className="sc-container sc-page-hero-grid">
        <div className="sc-page-copy" data-reveal>
          <span className="sc-eyebrow">{kicker}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {action && <div className="sc-page-hero-action" style={{ marginTop: 26 }}>{action}</div>}
          <div className="sc-page-hero-line" data-line />
        </div>
      </div>
      <img src="/brand/symbol-mono.svg" className="sc-page-watermark" alt="" />
    </section>
  );
}
