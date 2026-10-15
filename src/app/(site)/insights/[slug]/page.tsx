import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPost, getPosts } from '@/lib/data';
import { guides } from '@/lib/editorial';
import PageHero from '@/components/PageHero';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  const dbPosts = await getPosts();
  const dbSlugs = dbPosts.map(p => ({ slug: p.slug }));
  const guideSlugs = guides.map(g => ({ slug: g.slug }));
  const combined = Array.from(new Set([...dbSlugs.map(x => x.slug), ...guideSlugs.map(x => x.slug)]));
  return combined.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();

  // 1. Query database first
  const dbPost = await getPost(normalizedSlug);
  const guide = !dbPost ? guides.find(x => x.slug.toLowerCase() === normalizedSlug) : null;
  const p = dbPost || guide;

  return {
    title: p ? `${p.title} | Simulcast Insights` : 'Technology Guide | Simulcast Nepal',
    description: p?.excerpt || 'Simulcast technology architecture and engineering notes.',
    alternates: { canonical: '/insights/' + normalizedSlug },
  };
}

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();

  // 1. Query database FIRST - database is the primary source of truth!
  const dbPost = await getPost(normalizedSlug);

  // 2. Fallback to static guide ONLY if not found in database
  const guide = !dbPost ? guides.find(g => g.slug.toLowerCase() === normalizedSlug) : null;
  const p = dbPost || guide;

  if (!p) notFound();

  // Extract paragraphs:
  // If from database post (which stores full markdown/text in body):
  // Split by double newline or single newline
  const paragraphs: string[] = dbPost
    ? dbPost.body
        .split(/\r?\n\r?\n+/)
        .map(s => s.trim())
        .filter(Boolean)
    : ('paragraphs' in p && Array.isArray(p.paragraphs) ? p.paragraphs : [p.excerpt]);

  const image =
    (dbPost ? dbPost.imageUrl : ('image' in p ? p.image : '')) ||
    '/visuals/futuristic_purple_analytics_dashboard_ecosystem.webp';

  return (
    <article className="sc-page">
      <PageHero
        kicker={'TECHNOLOGY INSIGHTS / ' + p.category}
        title={p.title}
        description={p.excerpt}
        image={image}
        alt={p.title}
      />
      <section className="sc-section">
        <div className="sc-container v6-article-wrap">
          <div className="v6-article-meta">
            <span>SIMULCAST / TECHNOLOGY JOURNAL</span>
            <Link href="/insights">
              <ArrowLeft size={16} /> All insights
            </Link>
          </div>
          <div className="v6-article-content">
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <aside>
            <h3>Discuss how this applies to your system.</h3>
            <p>Tell us about the technology, workflow or operational problem you are planning for.</p>
            <Link className="sc-button sc-button-primary" href="/contact">
              Get technical guidance
            </Link>
          </aside>
        </div>
      </section>
    </article>
  );
}
