import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { getPosts } from '@/lib/data';
import { guides } from '@/lib/editorial';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  alternates: { canonical: '/insights' },
  title: 'Broadcast Engineering, OSS BSS, Software & AI Insights | Simulcast Nepal',
  description:
    'Engineering whitepapers and architectural guides on digital headends, broadcast playout, IPTV/OTT media servers, telecom OSS/BSS, NRCS newsrooms, custom software, mobile apps, and agentic AI automation in Nepal.',
  keywords: [
    'broadcasting',
    'digital broadcasting solutions provider',
    'digital headend',
    'iptv',
    'ott solutions provider',
    'media server',
    'oss bss',
    'software development',
    'best it company',
    'nepal top it company',
    'it consulting',
    'business website development',
    'AI automation',
    'ai agentic',
    'task management',
    'nrcs',
    'news room control system',
    'saas application',
    'mobile application',
  ],
};

export default async function Insights() {
  // 1. Fetch live database posts first
  const dbPosts = await getPosts();

  // 2. Format database posts (100% priority)
  const postsFromDb = dbPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    image: p.imageUrl || '/visuals/futuristic_neon_analytics_control_centre.webp',
  }));

  // 3. Fallback: only include static editorial guides if they are NOT in the database
  const dbSlugs = new Set(dbPosts.map(p => p.slug.toLowerCase()));
  const unseededGuides = guides
    .filter(g => !dbSlugs.has(g.slug.toLowerCase()))
    .map(g => ({
      slug: g.slug,
      title: g.title,
      excerpt: g.excerpt,
      category: g.category,
      image: g.image || '/visuals/futuristic_neon_analytics_control_centre.webp',
    }));

  // Database posts take priority over hardcoded guides
  const combined = [...postsFromDb, ...unseededGuides];

  return (
    <div className="sc-page v6-insights-page">
      <PageHero
        kicker="KNOWLEDGE / PRACTICAL ENGINEERING"
        title={
          <>
            Insights for
            <br />
            <em>connected systems.</em>
          </>
        }
        description="Original explainers about broadcast operations, reliable networks, practical AI and software systems—written for engineering and business decision-makers."
        image="/visuals/futuristic_purple_analytics_dashboard_ecosystem.webp"
        alt="Technology insight concept"
      />
      <section className="sc-section">
        <div className="sc-container">
          <div className="v6-journal-top">
            <span className="sc-eyebrow">ENGINEERING NOTES</span>
            <p>Learn the concepts, then talk to us about how they apply to your operation.</p>
          </div>
          <div className="v6-journal" data-stagger>
            {combined.map((p, i) => (
              <Link key={p.slug} href={'/insights/' + p.slug} className="v6-journal-entry">
                <div className="v6-journal-image">
                  <img
                    src={p.image || '/visuals/futuristic_neon_analytics_control_centre.webp'}
                    alt={p.title}
                    loading="lazy"
                  />
                </div>
                <div>
                  <small>
                    {String(i + 1).padStart(2, '0')} / {p.category}
                  </small>
                  <h2>{p.title}</h2>
                  <p>{p.excerpt}</p>
                  <span>
                    Read the guide <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
