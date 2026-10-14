import { ShieldCheck, Cpu, Tv, Radio, School, Network, CheckCircle2 } from 'lucide-react';
import { staticVendors, staticClients } from '@/lib/constants';

export default function PartnersClients() {
  return (
    <section className="sc-partners-clients sc-section">
      <div className="sc-container">
        <div className="sc-partners-header" data-reveal>
          <div className="sc-partners-intro">
            <span className="sc-eyebrow">PARTNERS & CLIENTELE</span>
            <h2>
              Hardware partners &amp;<br />
              <em>proven client deployments.</em>
            </h2>
          </div>
          <p className="sc-partners-desc">
            We engineer solutions with premier industry hardware vendors and support television channels, satellite broadcasters, telecom providers and public institutions across Nepal.
          </p>
        </div>

        {/* VENDORS & TECHNOLOGY ECOSYSTEM */}
        <div className="sc-vendors-block" data-reveal>
          <div className="sc-block-title">
            <span><Cpu size={15} /> HARDWARE &amp; SYSTEM INTEGRATION PARTNERS</span>
          </div>
          <div className="sc-vendors-grid">
            {staticVendors.map((vendor) => (
              <div key={vendor.name} className="sc-vendor-card">
                <div className="sc-vendor-badge">{vendor.badge}</div>
                <h3>{vendor.name}</h3>
                <p>{vendor.role}</p>
                <div className="sc-vendor-check">
                  <CheckCircle2 size={14} /> Official Ecosystem &amp; Support
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLIENTELE & BROADCASTERS */}
        <div className="sc-clients-block" data-reveal>
          <div className="sc-block-title">
            <span><Tv size={15} /> TRUSTED BY BROADCASTERS, NETWORKS &amp; INSTITUTIONS</span>
          </div>
          <div className="sc-clients-grid" data-stagger>
            {staticClients.map((client, idx) => (
              <div key={client.name} className="sc-client-card">
                <span className="sc-client-num">{String(idx + 1).padStart(2, '0')}</span>
                <div className="sc-client-info">
                  <h4>{client.name}</h4>
                  <span className="sc-client-category">{client.category}</span>
                </div>
                <span className="sc-client-region">{client.region}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
