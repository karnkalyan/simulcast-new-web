'use client';

import { staticVendors, staticClients } from '@/lib/constants';

export default function BrandCrawl() {
  // Extract pure vendor and client names only (no locations, no services)
  const vendorNames = staticVendors.map((v) => v.name.toUpperCase());
  const clientNames = staticClients.map((c) => c.name.toUpperCase());

  // Combined single list: vendors and clients
  const brandList = [
    'BLACKMAGIC DESIGN',
    'TV TODAY',
    'FEELWORLD',
    'AP1 HD',
    'AVMATRIX',
    'M-STAR',
    'YOLOLIV',
    'KANCHAN SKY',
    'EARTH NEWS',
    'FEWA HD',
    'LAXMI TV',
    'DRISTI PATHSHALA',
    'SHREE RAM SECONDARY SCHOOL',
    'APPAN TV',
    'KISAN NET',
  ];

  // Repeat for continuous seamless loop
  const seamlessList = [...brandList, ...brandList];

  return (
    <div className="sc-single-crawl-wrap" aria-label="Simulcast Technology Partners and Client Deployments">
      <div className="sc-single-crawl-track">
        {seamlessList.map((brand, idx) => (
          <span key={`crawl-item-${idx}`} className="sc-single-crawl-item">
            <span className="sc-single-crawl-text">{brand}</span>
            <span className="sc-single-crawl-sep" aria-hidden="true">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
