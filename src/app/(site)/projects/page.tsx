import Link from 'next/link';import {ArrowUpRight} from 'lucide-react';import PageHero from '@/components/PageHero';import {getProjects} from '@/lib/data';
export const metadata = {
  alternates: { canonical: '/projects' },
  title: 'Project Studies & Deployments | Broadcasting, Networks & Enterprise IT Nepal',
  description:
    'Explore verified deployments and reference architectures from Simulcast Technologies: Television playout automation, modern broadcast control centres, IPTV/OTT headends, and connected enterprise software in Nepal.',
  keywords: [
    'broadcasting projects nepal',
    'digital broadcasting solutions provider',
    'digital headend deployment',
    'iptv ott architecture',
    'software development nepal',
    'best it company nepal',
  ],
};
export default async function Projects(){const projects=await getProjects();return <div className="sc-page"><PageHero kicker="PROJECT STUDIES / REAL DEPLOYMENTS" title={<>Systems in practice.<br/><em>Solutions in context.</em></>} description="Explore client deployments, brand environments and technology architectures delivered by Simulcast Technologies." image="/visuals/neon_broadcast_operations_centre.webp" alt="Simulcast Broadcast & Technology Operations"/>
<section className="sc-page-body"><div className="sc-container"><div className="sc-page-lede"><h2>Understand how<br/><em>systems connect.</em></h2><p>Explore approved brand environments, infrastructure projects and operational rollouts delivered by our engineering and design teams.</p></div>{projects.map((p,i)=><div className="sc-editorial-feature" key={p.slug}><div className="sc-editorial-image" data-image-reveal><img loading="lazy" src={p.imageUrl||'/visuals/futuristic_consulting_team_workspace.webp'} alt={`${p.title}`}/></div><div className="sc-editorial-copy" data-reveal><span className="sc-eyebrow">{String(i+1).padStart(2,'0')} / {p.category}</span><h2>{p.title}</h2><p>{p.summary}</p><p className="sc-placeholder-note">{p.location}</p><Link className="sc-inline-link" href={'/projects/'+p.slug}>Read this study <ArrowUpRight size={18}/></Link></div></div>)}</div></section></div>}
