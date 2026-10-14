import PageHero from '@/components/PageHero';import LeadForm from '@/components/LeadForm';import {office} from '@/lib/site-content';
export const metadata = {
  alternates: { canonical: '/contact' },
  title: 'Contact Simulcast Technologies | Lalitpur & Kathmandu, Nepal — IT & Broadcast Solutions',
  description:
    'Contact Simulcast Technologies in Kumaripati, Lalitpur, Nepal. Reach our team for digital broadcasting solutions, digital headends, OSS/BSS billing, custom software, mobile apps (iOS/Android), agentic AI, and IT consulting. Call 9814823222 / 9851188274.',
  keywords: [
    'contact simulcast',
    'best it company nepal',
    'digital broadcasting solutions provider',
    'software development nepal',
    'oss bss nepal',
    'it consulting nepal',
    'Lalitpur IT company',
    'Kathmandu tech company',
  ],
};
export default function Contact(){return <div className="sc-page"><PageHero kicker="START A CONVERSATION" title={<>Let's build<br/><em>what comes next.</em></>} description="Whether you need a broadcasting solution, software platform, network integration, data centre or ongoing technical support, we'd like to hear about it." image="/visuals/futuristic_consulting_team_workspace.webp" alt="Team collaborating on technology solutions"/>
<section className="sc-page-body"><div className="sc-container sc-contact-grid"><div data-reveal><span className="sc-eyebrow">SIMULCAST / LALITPUR</span><h2 style={{margin:'22px 0'}}>Work with<br/><em>our team.</em></h2><p>Share your requirements and we'll help you take the next step.</p><div className="sc-contact-info"><div><label>Our office</label><p>{office.address}</p></div><div><label>Email</label><a href={'mailto:'+office.email}>{office.email}</a></div><div><label>Phone / 01</label><a href={'tel:+977'+office.phone1}>+977 {office.phone1}</a></div><div><label>Phone / 02</label><a href={'tel:+977'+office.phone2}>+977 {office.phone2}</a></div><div><label>Website</label><a href={'https://'+office.site}>{office.site}</a></div></div></div><div className="sc-contact-form" data-reveal><h3>Tell us about your project</h3><p>Complete the form below. Required fields are marked with an asterisk.</p><LeadForm/></div></div></section><section className="v6-map-section"><div className="sc-container"><div className="v6-map-heading"><div><span className="sc-eyebrow">FIND US IN LALITPUR</span><h2>Visit <em>Simulcast.</em></h2><p>{office.address}</p></div><a href="https://www.google.com/maps/search/?api=1&query=SimulCast%20Technologies%20Pvt%20Ltd%2C%20Lalitpur%2C%20Nepal&query_place_id=ChIJCRI3j40Z6zkRCue_g7v3Qho" target="_blank" rel="noopener noreferrer" className="sc-inline-link">Open in Google Maps ↗</a></div><div className="v6-map-frame"><iframe title="Simulcast Technologies location on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=SimulCast%20Technologies%20Pvt%20Ltd%2C%20Lalitpur%2C%20Nepal&output=embed" allowFullScreen/></div></div></section></div>}
