import type {Metadata} from 'next';import Link from 'next/link';import {ArrowUpRight} from 'lucide-react';import PageHero from '@/components/PageHero';import SoftwareExplorer from '@/components/motion/SoftwareExplorer';
export const metadata: Metadata = {
  title: 'Custom Software Development, OSS BSS, SaaS Platforms & Mobile Apps (iOS/Android) | Simulcast Nepal',
  description:
    'Simulcast Technologies is a top IT company in Nepal delivering enterprise software development, telecom OSS/BSS billing, mobile applications (iOS/Android), SaaS applications, agentic AI automation, task management systems, NRCS newsrooms, and digital broadcasting platforms.',
  keywords: [
    'software development',
    'best it company',
    'nepal top it company',
    'oss bss',
    'saas application',
    'mobile application',
    'ios',
    'android',
    'AI automation',
    'ai agentic',
    'task management',
    'business website development',
    'nrcs',
    'news room control system',
    'it consulting',
    'media server',
    'broadcasting',
  ],
  alternates: { canonical: '/software' },
};
export default function Software(){return <div className="sc-page v6-software-page"><PageHero kicker="SOFTWARE & SYSTEMS / SIMULCAST" title={<>Purpose-built systems.<br/><em>Made for the people who use them.</em></>} description="Explore broadcast applications, media operations, telecom software and custom business systems. Each solution is designed around a practical workflow, not a generic dashboard." image="/visuals/futuristic_cloud_streaming_control_room.webp" alt="Technology platform architecture concept" action={<Link href="/contact" className="sc-button sc-button-primary">Discuss a requirement <ArrowUpRight size={17}/></Link>}/><section className="sc-section v6-software-index"><div className="sc-container"><span className="sc-eyebrow">SELECT YOUR WORKFLOW</span><h2>Browse by <em>capability.</em></h2><p className="v6-intro-note">Technology categories and possible solution configurations; availability, licensing, integrations and deployment scope are confirmed during consultation.</p><SoftwareExplorer/></div></section><section className="v6-dark-bridge"><div className="sc-container v6-bridge-grid"><div><span className="sc-eyebrow sc-eyebrow-light">INTEGRATE / DEPLOY / SUPPORT</span><h2>Software works best when it fits <em>the entire operation.</em></h2></div><div><p>Our team can assess your existing tools, network, data model and business requirements before proposing an architecture and realistic integration plan.</p><Link href="/contact" className="sc-button sc-button-white">Talk to engineering <ArrowUpRight size={17}/></Link></div></div></section></div>}
