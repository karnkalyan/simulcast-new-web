import Link from 'next/link';import {ArrowUpRight} from 'lucide-react';import PageHero from '@/components/PageHero';import {industries} from '@/lib/site-content';import NetworkGlobeWaves from '@/components/motion/NetworkGlobeWaves';
export const metadata = {
  alternates: { canonical: '/industries' },
  title: 'Industries We Serve | Broadcasting, Telecom, Enterprise, IPTV & Media in Nepal',
  description:
    'Simulcast Technologies engineers systems for television broadcasters, cable and digital IPTV/OTT operators, telecom & ISP providers, enterprise corporations, and educational institutions in Nepal.',
  keywords: [
    'broadcasting',
    'digital broadcasting solutions provider',
    'digital headend',
    'iptv',
    'ott solutions provider',
    'media server',
    'oss bss',
    'telecom billing',
    'software development',
    'best it company',
    'nepal top it company',
    'it consulting',
  ],
};
export default function Industries(){return <div className="sc-page"><PageHero kicker="INDUSTRIES / ADAPTABLE SYSTEMS" title={<>Different industries.<br/><em>Connected thinking.</em></>} description="Technology looks different in every organization. We adapt the architecture, implementation and support to fit the reality of your operations." image="/visuals/cloud_network_operations_hub.webp" alt="Conceptual connected network and media operations"/>
<section className="sc-position sc-position-light sc-section"><NetworkGlobeWaves mode="waves-only" theme="light" showHud={false}/><div className="sc-container sc-position-inner"><div className="sc-overline-number" data-reveal>SECTORS WE EMPOWER</div><h2 data-reveal>Tailored architectures for<br/><span>demanding operations.</span></h2><div className="sc-position-lower" data-reveal><span className="sc-position-rule" data-line/><p>From high-uptime broadcast facilities to enterprise cloud backbones, we build solutions that withstand real operational pressure.</p><Link href="/contact" className="sc-inline-link">Discuss your sector needs <ArrowUpRight size={18}/></Link></div></div></section>
<section className="sc-page-body"><div className="sc-container"><div className="sc-page-lede"><h2>Designed for<br/><em>your environment.</em></h2><p>From studios and transmission to networks, enterprise applications and public services, our process begins with your requirements.</p></div><div className="sc-editorial-rows" data-stagger>{industries.map(v=><Link key={v.name} className="sc-editorial-row" href="/contact"><span>{v.icon}</span><h3>{v.name}</h3><p>{v.text}</p><ArrowUpRight size={22}/></Link>)}</div></div></section>
<section className="sc-dark-chapter"><NetworkGlobeWaves mode="globe-only" theme="dark" globePosition="center" showHud={false}/><div className="sc-container" data-reveal><span className="sc-eyebrow sc-eyebrow-light">CHALLENGES ARE UNIQUE</span><h2>Let's design around<br/><em>your requirements.</em></h2><p>Talk to us about your systems, people, infrastructure and growth plans.</p><Link className="sc-button sc-button-white" href="/contact">Discuss an opportunity <ArrowUpRight size={18}/></Link></div><img src="/brand/symbol-light.svg" alt=""/></section></div>}
