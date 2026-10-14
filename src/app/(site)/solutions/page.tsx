import Link from 'next/link';import {ArrowUpRight} from 'lucide-react';import PageHero from '@/components/PageHero';import SectionIntro from '@/components/SectionIntro';import {siteServices} from '@/lib/site-content';import NetworkGlobeWaves from '@/components/motion/NetworkGlobeWaves';
export const metadata = {
  alternates: { canonical: '/solutions' },
  title: 'Digital Broadcasting Solutions Provider, Digital Headend, IPTV OTT & IT Consulting | Simulcast',
  description:
    'Simulcast Technologies delivers turnkey engineering across digital headends, IPTV and OTT streaming, high-speed media servers, telecom OSS/BSS, enterprise software development, AI automation, and expert IT consulting in Nepal.',
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
    'nrcs',
    'news room control system',
  ],
};
export default function Solutions(){return <div className="sc-page"><PageHero kicker="OUR EXPERTISE / 08 DISCIPLINES" title={<>Technology meets<br/><em>real-world needs.</em></>} description="From media production and multi-screen delivery to enterprise software and resilient infrastructure, we connect the details that make technology useful." image="/visuals/isometric_broadcast_technology_network.webp" alt="Concept illustration of broadcast and technology systems"/>
<section className="sc-position sc-position-light sc-section"><NetworkGlobeWaves mode="waves-only" theme="light" showHud={false}/><div className="sc-container sc-position-inner"><div className="sc-overline-number" data-reveal>INTEGRATED SYSTEMS</div><h2 data-reveal>Designed to connect.<br/><span>Built to perform.</span></h2><div className="sc-position-lower" data-reveal><span className="sc-position-rule" data-line/><p>From media pipelines to enterprise cloud and networks, our engineering teams build coherent technology environments.</p><Link href="/contact" className="sc-inline-link">Start a technical discussion <ArrowUpRight size={18}/></Link></div></div></section>
<section className="sc-page-body"><div className="sc-container"><SectionIntro eyebrow="FIND YOUR STARTING POINT" title={<>Eight disciplines.<br/><em>One connected approach.</em></>} description="Our teams focus on practical systems that fit how you actually work."/>{siteServices.map((s,i)=><div className="sc-editorial-feature" key={s.slug}><div className="sc-editorial-image" data-image-reveal><img loading="lazy" src={s.image} alt={`${s.title} conceptual service illustration`}/></div><div className="sc-editorial-copy" data-reveal><span className="sc-eyebrow">{s.number} / {s.label}</span><h2>{s.title}</h2><p>{s.desc}</p><ul>{s.services.slice(0,3).map(x=><li key={x}>{x}</li>)}</ul><Link className="sc-inline-link" href={'/solutions/'+s.slug}>Explore capability <ArrowUpRight size={18}/></Link></div></div>)}</div></section>
<section className="sc-dark-chapter"><NetworkGlobeWaves mode="globe-only" theme="dark" globePosition="center" showHud={false}/><div className="sc-container" data-reveal><span className="sc-eyebrow sc-eyebrow-light">BRING YOUR REQUIREMENTS</span><h2>Let's solve the<br/><em>right challenge.</em></h2><p>Tell us about your goals, infrastructure and operating requirements. We'll start with a clear conversation about the best approach.</p><Link href="/contact" className="sc-button sc-button-white">Talk to Simulcast <ArrowUpRight size={18}/></Link></div><img src="/brand/symbol-light.svg" alt=""/></section></div>}
