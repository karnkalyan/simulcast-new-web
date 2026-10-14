import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";
import "./simulcast-v6.css";
import { Inter, Poppins, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Simulcast Technologies | Best IT Company in Nepal — Digital Broadcasting, OSS BSS, Software & AI Automation",
    template: "%s | Simulcast Technologies",
  },
  description:
    "Simulcast Technologies Pvt. Ltd. is Nepal's premier digital broadcasting solutions provider and top IT company. Expert engineering in digital headends, IPTV/OTT solutions, media servers, telecom OSS/BSS, enterprise software development, mobile applications (iOS/Android), SaaS platforms, agentic AI automation, task management, NRCS newsroom systems, and IT consulting.",
  keywords: [
    "broadcasting",
    "digital broadcasting solutions provider",
    "digital headend",
    "iptv",
    "ott solutions provider",
    "media server",
    "oss bss",
    "telecom oss bss",
    "telecom billing",
    "subscriber management",
    "software development",
    "best it company",
    "nepal top it company",
    "it consulting",
    "business website development",
    "AI automation",
    "ai agentic",
    "task management",
    "ai agentic and all task management",
    "nrcs",
    "news room control system",
    "newsroom automation",
    "saas application",
    "mobile application",
    "ios",
    "android",
    "broadcasting solutions Nepal",
    "IPTV OTT DTH Nepal",
    "broadcast playout automation",
    "character generator CG",
    "DVB-C DVB-S2 headend",
    "live streaming media servers",
    "data center servers Nepal",
    "IT network integration Nepal",
    "Simulcast Technologies",
    "Lalitpur top IT company",
    "Kathmandu IT company",
  ],
  authors: [{ name: "Simulcast Technologies Pvt. Ltd.", url: SITE_URL }],
  creator: "Simulcast Technologies Pvt. Ltd.",
  publisher: "Simulcast Technologies Pvt. Ltd.",
  category: "technology",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    siteName: "Simulcast Technologies Pvt. Ltd.",
    locale: "en_NP",
    title: "Simulcast Technologies | Best IT Company & Digital Broadcasting Solutions Provider in Nepal",
    description:
      "Digital broadcasting solutions provider, digital headend, IPTV/OTT, media servers, telecom OSS/BSS, enterprise software development, mobile apps (iOS/Android), agentic AI task management, and NRCS systems in Nepal.",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/visuals/futuristic_cloud_streaming_network.webp",
        width: 1200,
        height: 630,
        alt: "Simulcast Technologies — Broadcast Engineering, Software Development & AI Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulcast Technologies — Best IT Company & Broadcast Solutions in Nepal",
    description:
      "Engineering digital headends, IPTV/OTT, telecom OSS/BSS, software development, mobile apps (iOS/Android), agentic AI, and NRCS newsrooms.",
    images: ["/visuals/futuristic_cloud_streaming_network.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/brand/logo-master.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ITCompany", "ProfessionalService"],
        "@id": `${SITE_URL}/#organization`,
        name: "Simulcast Technologies Pvt. Ltd.",
        alternateName: [
          "Simulcast",
          "Simulcast Technologies Nepal",
          "Nepal Top IT Company",
          "Digital Broadcasting Solutions Provider Nepal",
        ],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brand/logo-master.png`,
          caption: "Simulcast Technologies Logo",
        },
        image: `${SITE_URL}/visuals/futuristic_cloud_streaming_network.webp`,
        email: "info@simulcast.com.np",
        telephone: ["+9779814823222", "+9779851188274"],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Kumaripati, Lagankhel Road",
          addressLocality: "Lalitpur",
          addressRegion: "Bagmati",
          postalCode: "44700",
          addressCountry: "NP",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "27.6698",
          longitude: "85.3218",
        },
        areaServed: [
          { "@type": "Country", name: "Nepal" },
          { "@type": "AdministrativeArea", name: "South Asia" },
          "Worldwide",
        ],
        description:
          "Nepal's premier digital broadcasting solutions provider and top IT company specializing in digital headends, IPTV/OTT solutions, media servers, telecom OSS/BSS, custom software development, mobile apps (iOS & Android), agentic AI task management, NRCS newsroom systems, and IT consulting.",
        knowsAbout: [
          "Broadcasting Engineering & Play-out Automation",
          "Digital Headend Systems (DVB-C, DVB-S2, DVB-T2)",
          "IPTV and OTT Solutions Provider",
          "High-Performance Media Servers & Video Streaming",
          "Telecom OSS BSS & Subscriber Billing Systems",
          "Custom Software Development & Enterprise Portals",
          "Mobile Application Development (iOS & Android)",
          "SaaS Application Architecture & Engineering",
          "Agentic AI Automation & AI Task Management",
          "News Room Control Systems (NRCS)",
          "Business Website Development",
          "IT Consulting & Systems Integration",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Simulcast Core Engineering Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Digital Broadcasting Solutions & Digital Headend",
                description: "Turnkey DVB-C/S2/T2 headends, playout automation, character generation (CG), and signal transmission.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "IPTV & OTT Streaming Solutions",
                description: "Scalable IPTV headends, OTT multi-screen distribution, media servers, transcoders, and subscriber middleware.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Telecom OSS/BSS & Billing Systems",
                description: "Integrated telecom network operations (OSS), subscriber lifecycle CRM, automated recurring billing, and AAA/RADIUS integration.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Custom Software & SaaS Application Development",
                description: "Enterprise software, cloud microservices, multi-tenant SaaS platforms, and bespoke business websites.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Mobile Application Development (iOS & Android)",
                description: "Native and cross-platform mobile apps for subscriber portals, media streaming, and enterprise mobile workflows.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Agentic AI Automation & Task Management",
                description: "Autonomous AI agents, intelligent business process automation, document triage, and enterprise task orchestration.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "News Room Control System (NRCS)",
                description: "Modern newsroom editorial workflows, rundown timing, prompter synchronization, and MOS-style studio integration.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "IT Consulting & Network Systems Integration",
                description: "Strategic IT consulting, data center server architectures, enterprise networking, and 24/7 technical support.",
              },
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Simulcast Technologies",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/solutions?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${mono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
