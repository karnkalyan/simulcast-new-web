'use client';

import { useState, useEffect } from 'react';

const INITIAL_BRANDS = [
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

export default function BrandCrawl() {
  const [brands, setBrands] = useState<string[]>(INITIAL_BRANDS);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/directory/brands')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.brands && Array.isArray(data.brands) && data.brands.length > 0) {
          setBrands(data.brands);
        }
      })
      .catch(() => {
        // Fallback to initial brands
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Repeat for continuous seamless loop
  const seamlessList = [...brands, ...brands];

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
