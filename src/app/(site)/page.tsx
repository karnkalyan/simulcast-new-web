import Link from 'next/link';
import {ArrowUpRight,ArrowRight,Check,MoveDown,MonitorPlay,Workflow,Headset,Server,Code2,RadioTower,Network,Cloud,ShieldCheck} from 'lucide-react';
import ExpertiseSwitch from '@/components/motion/ExpertiseSwitch';
import SoftwareExplorer from '@/components/motion/SoftwareExplorer';
import NetworkGlobeWaves from '@/components/motion/NetworkGlobeWaves';
import BrandCrawl from '@/components/BrandCrawl';
import {guides} from '@/lib/editorial';
import SectionIntro from '@/components/SectionIntro';
import {siteServices} from '@/lib/site-content';
import {getSettings} from '@/lib/data';
export const revalidate=120;
export const metadata = {
  title: 'Simulcast Technologies | Best IT Company in Nepal & Digital Broadcasting Solutions Provider',
  description:
    "Simulcast is Nepal's top IT company and digital broadcasting solutions provider. Specializing in digital headends, IPTV/OTT solutions, media servers, telecom OSS/BSS, enterprise software development, mobile applications (iOS/Android), agentic AI automation, task management, and NRCS newsroom systems.",
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
    'ai agentic and all task management',
    'nrcs',
    'news room control system',
    'saas application',
    'mobile application',
    'ios',
    'android',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Simulcast Technologies | Best IT Company & Digital Broadcasting Solutions Provider in Nepal',
    description:
      'Premier digital broadcasting solutions provider, digital headend, IPTV/OTT, media servers, telecom OSS/BSS, software development, mobile apps (iOS/Android), and agentic AI in Nepal.',
    url: '/',
  },
};
const featureIcons=[RadioTower,MonitorPlay,Code2,Workflow,Network,Server,Cloud,Headset];
export default async function Home(){
  const settings: any = await getSettings();
  const themeStyles = `
    :root {
      ${settings.primaryColor ? `--sc-purple: ${settings.primaryColor}; --plum: ${settings.primaryColor};` : ''}
      ${settings.secondaryColor ? `--sc-pink: ${settings.secondaryColor}; --v6-magenta: ${settings.secondaryColor}; --pink: ${settings.secondaryColor};` : ''}
      ${settings.heroBgColor ? `--sc-hero-bg: ${settings.heroBgColor};` : ''}
    }
    ${settings.heroBgColor ? `.sc-hero-futuristic { background: radial-gradient(circle at 75% 50%, ${settings.heroBgColor} 0%, #f6f8fd 45%, #f8fafd 100%) !important; }` : ''}
    ${settings.customCss || ''}
  `;

  return (
    <div className="sc-site">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <section className="sc-hero-futuristic" id="top">
        <div className="sc-hero-ambient-sheen" aria-hidden="true" />

        {/* Hero Background Art Layer */}
        <div className="sc-hero-bg-art" aria-hidden="true">
          <img 
            src="/visuals/Futuristic Cloud Network Hub.png" 
            alt="" 
            fetchPriority="high" 
            className="sc-hero-bg-img" 
          />
        </div>

        <div className="sc-container sc-hero-futuristic-grid">
          <div className="sc-hero-main-copy" data-reveal>
            <div className="sc-hero-pill-badge">
              <span className="sc-hero-badge-dot" />
              <span>{settings.heroBadgeText || "INTEGRATED TECHNOLOGY · BUILT IN NEPAL"}</span>
            </div>
            <h1 className="sc-hero-headline">
              {settings.headline || "Technology that connects what matters."}<br />
              <span className="sc-hero-gradient-emphasis">{settings.heroEmphasis || "Connected by design."}</span>
            </h1>
            <p className="sc-hero-lead">
              {settings.subheadline || "From broadcasting and media workflows to AI automation, custom software platforms and connected infrastructure—we engineer dependable technology for a fast-moving world."}
            </p>
            <div className="sc-hero-cta-group">
              <Link className="sc-button sc-button-primary sc-hero-btn-primary" href="/solutions">
                Explore our solutions <ArrowUpRight size={18} />
              </Link>
              <Link className="sc-button sc-button-outline sc-hero-btn-outline" href="/contact">
                Discuss your project <ArrowRight size={17} />
              </Link>
            </div>

            <div className="sc-hero-pillars">
              <div className="sc-hero-pillar">
                <strong>Mission-Critical</strong>
                <span>24/7 master control & continuous playout</span>
              </div>
              <div className="sc-hero-pillar">
                <strong>Modular Architecture</strong>
                <span>Custom software & automated workflows</span>
              </div>
              <div className="sc-hero-pillar">
                <strong>Carrier-Grade</strong>
                <span>High-resiliency servers & IP distribution</span>
              </div>
            </div>
          </div>
        </div>

        <BrandCrawl />
      </section>
<section className="sc-position sc-position-light sc-section"><div className="sc-container sc-position-inner"><div className="sc-overline-number" data-reveal>01 / WHY SIMULCAST</div><h2 data-reveal>Not just products.<br/><span>Complete solutions</span> that make business move.</h2><div className="sc-position-lower" data-reveal><span className="sc-position-rule" data-line/><p>We connect the right people, platforms, equipment and expertise—from initial planning through installation, training and ongoing support.</p><Link href="/about" className="sc-inline-link">Meet Simulcast <ArrowUpRight size={18}/></Link></div></div><img className="sc-position-symbol" src="/brand/symbol-mono.svg" alt="" aria-hidden="true"/></section>
<section className="sc-signature sc-section sc-pastel-overlay" id="expertise"><div className="sc-container"><SectionIntro eyebrow="02 / OUR CORE DISCIPLINES" title={<>Your challenge is the starting point.<br/><em>Our expertise makes it possible.</em></>} description="Specialist services, designed to work individually or as one connected technology environment."/>
<div className="sc-feature-story sc-feature-broadcast"><div className="sc-feature-art" data-image-reveal><img src="/visuals/neon_broadcast_control_centre.webp" alt="Broadcast control room systems concept" loading="lazy"/><div className="sc-feature-softedge"/></div><div className="sc-feature-content" data-reveal><span className="sc-overline-number">01 / BROADCAST & MEDIA</span><h3>Reliable from<br/>studio to screen.</h3><p>Playout, ingest, newsroom, media management, DVB-C/DVB-S2, monitoring and broadcast graphics engineered into one reliable workflow.</p><Link href="/solutions/broadcast-media" className="sc-inline-link">Broadcasting solutions <ArrowUpRight size={18}/></Link></div></div>
<div className="sc-feature-story sc-feature-software"><div className="sc-feature-content" data-reveal><span className="sc-overline-number">02 / SOFTWARE DEVELOPMENT</span><h3>Technology that<br/><em>feels effortless.</em></h3><p>Custom applications, management platforms, websites, dashboards and secure API integrations designed around the way your team works.</p><Link href="/solutions/software-platforms" className="sc-inline-link">Software & platforms <ArrowUpRight size={18}/></Link></div><div className="sc-feature-art sc-feature-art-light" data-image-reveal><img src="/visuals/isometric_purple_streaming_workflow_dashboard.webp" alt="Minimal software dashboard and digital streaming workflow concept" loading="lazy"/><div className="sc-feature-softedge"/></div></div></div></section>
<section className="v6-suite-home sc-section sc-pastel-overlay" id="systems"><div className="sc-container"><div className="v6-suite-top"><div data-reveal><span className="sc-eyebrow">03 / SOFTWARE & APPLICATION SYSTEMS</span><h2>More than services.<br/><em>Systems built for real work.</em></h2></div><div data-reveal><p>From broadcast playout and streaming media pipelines to newsroom systems, telecom OSS/BSS, business software and AI-assisted workflows.</p><Link className="sc-inline-link" href="/software">Explore all software capabilities <ArrowUpRight size={18}/></Link></div></div><SoftwareExplorer compact/></div><img src="/brand/symbol-color.svg" className="v6-suite-symbol" data-logo-rise alt=""/></section>
<section className="sc-expertise-explorer sc-section"><div className="sc-container"><SectionIntro eyebrow="03 / GO DEEPER" title={<>One partner for the <em>whole system.</em></>} description="From platform development to data-centre foundations and ongoing service, explore how the pieces come together."/><ExpertiseSwitch/></div></section>
<section className="sc-ecosystem sc-section sc-pastel-overlay" aria-label="Connected technology solutions">
  <div className="sc-container sc-ecosystem-layout">
    <div className="sc-ecosystem-intro" data-reveal><span className="sc-eyebrow">TECHNOLOGY / CONNECTED OPERATIONS</span><h2>From application<br/>to <em>infrastructure.</em></h2><p>Business applications, intelligent automation, modern networks and data-centre foundations—built to make every part of your operation work together.</p><Link href="/solutions/it-infrastructure" className="sc-inline-link">Discover connected systems <ArrowUpRight size={18}/></Link></div>
    <div className="sc-ecosystem-visual" data-image-reveal><img src="/visuals/cloud_network_operations_hub.webp" alt="Conceptual software, analytics and connected cloud infrastructure" loading="lazy"/></div>
    <div className="sc-ecosystem-detail" data-stagger><Link href="/solutions/ai-automation"><span>01</span><strong>AI & business automation</strong><ArrowUpRight size={17}/></Link><Link href="/solutions/data-center"><span>02</span><strong>Servers & data centres</strong><ArrowUpRight size={17}/></Link><Link href="/solutions/software-platforms"><span>03</span><strong>Custom software platforms</strong><ArrowUpRight size={17}/></Link><Link href="/solutions/it-infrastructure"><span>04</span><strong>Secure IT & networking</strong><ArrowUpRight size={17}/></Link></div>
  </div>
</section>
<section className="sc-technology-band sc-section sc-pastel-overlay"><div className="sc-container"><div className="sc-band-heading" data-reveal><span className="sc-eyebrow sc-eyebrow-light">04 / FULL TECHNOLOGY SPECTRUM</span><h2>Built for what<br/><em>your systems demand.</em></h2><p>Every capability can stand on its own. Together, they support an end-to-end, dependable technology operation.</p></div><div className="sc-tech-index" data-stagger>{siteServices.map((s,i)=>{const Icon=featureIcons[i];return <Link className="sc-tech-row" href={'/solutions/'+s.slug} key={s.slug}><span className="sc-tech-number">{s.number}</span><Icon size={25} strokeWidth={1.55}/><div><strong>{s.title}</strong><span>{s.label}</span></div><ArrowUpRight className="sc-tech-arrow" size={23}/></Link>})}</div><img className="sc-band-symbol" data-logo-rise src="/brand/symbol-light.svg" alt=""/></div></section>
<section className="sc-process sc-section sc-pastel-overlay"><div className="sc-container"><SectionIntro eyebrow="05 / HOW WE DELIVER" title={<>Clear thinking at <em>every stage.</em></>} description="Good engineering doesn't stop at delivery. Our approach connects discovery, design, implementation and care."/><div className="sc-process-layout"><div className="sc-process-visual" data-image-reveal><img src="/visuals/futuristic_av_integration_network_hub.webp" alt="Illustration of connected AV, IT and network infrastructure" loading="lazy"/><div className="sc-process-visual-label">FROM REQUIREMENT → OPERATIONS</div></div><div className="sc-steps" data-stagger>{[{n:'01',t:'Understand',d:'Listen, survey and clarify your workflows, constraints and goals.'},{n:'02',t:'Architect',d:'Design the right systems, technologies and realistic delivery plan.'},{n:'03',t:'Build & integrate',d:'Configure, connect, test and commission with care.'},{n:'04',t:'Train & support',d:'Document, hand over, maintain and improve over time.'}].map(x=><div className="sc-step" key={x.n}><span>{x.n}</span><div><h3>{x.t}</h3><p>{x.d}</p></div><Check size={16}/></div>)}</div></div></div></section>
<section className="sc-industries-home sc-section"><div className="sc-container sc-industries-home-grid"><div data-reveal><span className="sc-eyebrow">06 / INDUSTRIES WE SERVE</span><h2>Engineering for<br/>different <em>realities.</em></h2><p>From broadcast operations and service providers to enterprise systems and institutions, we design with the operating environment in mind.</p><Link className="sc-inline-link" href="/industries">Explore industries <ArrowUpRight size={18}/></Link></div><div className="sc-industry-list" data-stagger>{['Television & live media','IPTV, OTT & DTH operators','Internet & telecom providers','Corporate & enterprise','Government & institutions','Digital-first businesses'].map((name,i)=><Link key={name} href="/industries"><span>0{i+1}</span><b>{name}</b><ArrowUpRight size={19}/></Link>)}</div></div><img className="sc-industries-symbol" src="/brand/symbol-mono.svg" alt="" aria-hidden="true"/></section>
<section className="sc-support-callout sc-section"><div className="sc-container sc-support-inner"><div className="sc-support-visual" data-image-reveal><img src="/visuals/modern_support_network_illustration.webp" alt="Technical support and service illustration" loading="lazy"/></div><div data-reveal><span className="sc-eyebrow">07 / SERVICE & SUPPORT</span><h2>Support that stays<br/><em>after go-live.</em></h2><p>Consultation, troubleshooting, preventive maintenance and support planning—so your technology remains useful well after launch.</p><div className="sc-support-inline"><span><ShieldCheck size={19}/> System health & maintenance</span><span><Headset size={19}/> Engineering assistance</span></div><Link href="/solutions/technical-consulting" className="sc-button sc-button-outline">Service & support <ArrowUpRight size={18}/></Link></div></div></section>
<section className="sc-section v6-home-journal"><div className="sc-container"><div className="v6-home-journal-title"><div data-reveal><span className="sc-eyebrow">08 / NOTES FROM THE FIELD</span><h2>Ideas worth <em>sharing.</em></h2></div><Link className="sc-inline-link" href="/insights">All technology insights <ArrowUpRight size={18}/></Link></div><div className="v6-home-journal-list" data-stagger>{guides.slice(0,3).map((g,i)=><Link href={'/insights/'+g.slug} key={g.slug}><span>{String(i+1).padStart(2,'0')} / {g.category}</span><h3>{g.title}</h3><ArrowUpRight size={22}/></Link>)}</div></div></section>
</div>
  );
}
