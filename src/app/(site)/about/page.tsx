import Link from 'next/link';import {ArrowUpRight} from 'lucide-react';import PageHero from '@/components/PageHero';import SectionIntro from '@/components/SectionIntro';import NetworkGlobeWaves from '@/components/motion/NetworkGlobeWaves';import PartnersClients from '@/components/PartnersClients';
export const metadata = {
  alternates: { canonical: '/about' },
  title: "About Simulcast Technologies | Nepal's Top IT Company & Digital Broadcasting Leader",
  description:
    "Simulcast Technologies Pvt. Ltd. is Nepal's premier digital broadcasting solutions provider and top IT company based in Lalitpur. Delivering digital headends, OSS/BSS billing, enterprise software development, AI automation, media servers, and IT consulting.",
  keywords: [
    'best it company',
    'nepal top it company',
    'digital broadcasting solutions provider',
    'broadcasting',
    'digital headend',
    'oss bss',
    'software development',
    'it consulting',
    'AI automation',
    'media server',
    'Simulcast Technologies',
    'Lalitpur Nepal',
  ],
};
export default function About(){return <div className="sc-page"><PageHero kicker="THE COMPANY / LALITPUR NEPAL" title={<>People, systems<br/><em>and possibilities.</em></>} description="Simulcast Technologies Pvt. Ltd. brings together hands-on technical engineering and modern digital expertise to help organizations operate more effectively." image="/visuals/futuristic_consulting_team_workspace.webp" alt="Illustration of a technology engineering and consultation team"/>
<section className="sc-position sc-position-light sc-section"><div className="sc-container sc-position-inner"><div className="sc-overline-number" data-reveal>01 / CORE MISSION</div><h2 data-reveal>Engineering systems<br/><span>built around people.</span></h2><div className="sc-position-lower" data-reveal><span className="sc-position-rule" data-line/><p>From media pipelines to enterprise cloud and networks, our engineering teams build coherent technology environments.</p><Link href="/solutions" className="sc-inline-link">Explore our expertise <ArrowUpRight size={18}/></Link></div></div><img className="sc-position-symbol" src="/brand/symbol-mono.svg" alt="" aria-hidden="true"/></section>
<section className="sc-page-body"><div className="sc-container sc-page-lede"><h2>We think beyond<br/><em>the individual device.</em></h2><div><span className="sc-eyebrow">WHO WE ARE</span><p>Broadcasting, software, IT systems and business operations often meet in the same workflow. We help these systems work together—from early technical planning to deployment, training and continued service.</p><p>Our approach prioritizes clarity, interoperability, practical value and long-term maintainability.</p></div></div><div className="sc-container sc-facts-grid" data-stagger>{[{t:'Understand before building',d:'We begin with the way your people and systems work.'},{t:'Make complexity manageable',d:'Architecture and delivery built around real operational needs.'},{t:'Stay connected after launch',d:'Documentation, support and a long-term technology outlook.'}].map((v,i)=><div key={v.t}><span>0{i+1} / OUR APPROACH</span><h3>{v.t}</h3><p>{v.d}</p></div>)}</div></section>
<PartnersClients />
<section className="sc-page-body" style={{background:'#faf9fc'}}><div className="sc-container"><SectionIntro eyebrow="MORE THAN ONE DISCIPLINE" title={<>Integrated thinking.<br/><em>Practical engineering.</em></>} description="Our work connects broadcast operations, IP content distribution, custom software, network infrastructure, automation and technical support."/><div className="sc-editorial-feature"><div className="sc-editorial-image" data-image-reveal><img src="/visuals/3d_isometric_media_cloud_workspace.webp" alt="Conceptual interconnected media and cloud software architecture" loading="lazy"/></div><div className="sc-editorial-copy" data-reveal><span className="sc-eyebrow">OUR MINDSET</span><h2>Technology should<br/>work as one.</h2><p>From a single application to a multi-site broadcast system, we work toward clear outcomes, stable implementation and day-to-day usability.</p><Link href="/solutions" className="sc-inline-link">Explore our expertise <ArrowUpRight size={18}/></Link></div></div></div></section>
<section className="sc-dark-chapter"><NetworkGlobeWaves mode="globe-only" theme="dark" globePosition="left-bottom-cropped" showHud={false}/><div className="sc-container" data-reveal><span className="sc-eyebrow sc-eyebrow-light">BASED IN LALITPUR, NEPAL</span><h2>Let's build something<br/><em>that lasts.</em></h2><p>Discuss your broadcasting, software, service or infrastructure requirements with Simulcast.</p><Link href="/contact" className="sc-button sc-button-white">Contact our team <ArrowUpRight size={18}/></Link></div><img src="/brand/symbol-light.svg" alt=""/></section></div>}
