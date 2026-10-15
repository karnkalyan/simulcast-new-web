import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const editorialGuides = [
  {
    slug: "broadcast-playout-automation-nepal",
    title: "A practical guide to 24/7 television playout in Nepal",
    category: "Broadcast engineering",
    excerpt: "How to plan a television playout chain with dependable scheduling, graphics and failover.",
    image: "/visuals/neon_broadcast_control_centre.webp",
    paragraphs: [
      "Continuous channel operation involves more than selecting a video file and pressing play. A well-planned playout chain covers ingest, asset validation, rundown timing, graphics, audio, output paths, operator supervision and recovery procedures.",
      "For broadcasters in Nepal, begin by documenting the complete signal chain, including SDI or IP interfaces, transmission headend, programme standards and expected operational staffing. Identify where live contribution enters, where automation takes over, and what should happen if the main server or network path fails.",
      "A useful starting checklist includes media validation, NTP or reference clock alignment, manual override workflows, as-run reporting, loudness checks and clean escalation paths. Graphics systems should use controlled templates with versioning and clear on-air approvals.",
      "Treat redundancy as an architectural decision, not a marketing label. Define the recovery point, the trigger mechanism and which person or system authorizes failover. Test under realistic conditions before scheduling the first critical transmission."
    ]
  },
  {
    slug: "iptv-ott-dth-system-architecture",
    title: "IPTV, OTT and DTH: understanding the delivery paths",
    category: "Streaming technology",
    excerpt: "A clear comparison of TV distribution technologies and their operational requirements.",
    image: "/visuals/cloud_streaming_network_ecosystem.webp",
    paragraphs: [
      "IPTV, OTT and DTH reach viewers through different access networks. IPTV usually relies on managed IP delivery; OTT reaches apps and web players over the wider internet; DTH distributes broadcast signals through satellite delivery. A complete architecture often combines several approaches.",
      "Before specifying encoders, middleware or player interfaces, define channel counts, resolutions, conditional-access requirements, latency budgets, supported devices and available internet or satellite capacity. Those choices shape the distribution topology and infrastructure costs.",
      "Consider end-to-end monitoring, entitlement management, EPG data, multi-bitrate encoding, storage, copyright requirements, geo-access rules and client telemetry. Match the distribution protocol to the operational use case rather than selecting it based on a trend.",
      "For networks that operate in Nepal, support for local access conditions, practical field troubleshooting and cost-aware redundancy can be as important as the codec itself."
    ]
  },
  {
    slug: "telecom-oss-bss-billing-guide",
    title: "What an ISP OSS/BSS platform should connect",
    category: "Telecom & ISP",
    excerpt: "A framework for linking network operations, subscriber lifecycle, billing and customer support.",
    image: "/visuals/futuristic_neon_analytics_control_centre.webp",
    paragraphs: [
      "OSS and BSS serve different but connected roles in an ISP. OSS is concerned with operating the network and delivering services. BSS handles commercial and customer-facing processes such as plans, invoices, payments and support history.",
      "An effective roadmap begins with a system inventory: routers, BRAS or BNG, RADIUS AAA, OLTs, CPE management, accounting, billing, payment integrations and field support. Map which system is authoritative for customer identity and service state.",
      "Integration requires carefully managed retries, audit trails, permission controls and reconciliation. For example, a paid invoice should not leave a subscriber inactive because a provisioning event failed silently.",
      "Plan migration in stages. Validate identifiers and customer records, run both systems in parallel for a defined period when possible, and document a rollback path. These practical safeguards usually matter more than decorative dashboard metrics."
    ]
  },
  {
    slug: "nrcs-newsroom-workflow",
    title: "From newsroom story to on-air rundown: NRCS design",
    category: "Newsroom operations",
    excerpt: "A workflow-first look at scripts, rundowns, prompters and on-air graphics.",
    image: "/visuals/futuristic_neon_newsroom_studio.webp",
    paragraphs: [
      "A newsroom computer system (NRCS) supports the editorial process from planning through production. Its value comes from connecting assignments, copy, approved scripts, rundowns, graphics and control-room execution.",
      "Prioritize editorial permissions, rundown change history, breaking-news overrides and time calculations. A reporter, producer, director and graphics operator need different views of the same evolving story.",
      "Teleprompters and lower-third graphics should use a reliable workflow for approved updates. MOS-based or API integration can help, but the technical bridge must be tested against the specific production tools in use.",
      "Make the interface readable under pressure. Clear states, predictable keyboard actions and resilient network recovery reduce on-air operational risk."
    ]
  },
  {
    slug: "ai-automation-human-approval",
    title: "AI automation for real operations: start with human control",
    category: "AI & automation",
    excerpt: "Where AI helps in business workflows—and where human approval still matters.",
    image: "/visuals/futuristic_ai_workflow_pipeline.webp",
    paragraphs: [
      "AI can accelerate tasks such as document categorization, summarization, search, ticket prioritization and drafting. It becomes most useful when connected to a well-defined workflow with a measurable outcome.",
      "Begin with a narrow pilot. Specify the source data, expected answer format, human review points, error handling and a path to audit each automated decision. Avoid giving an AI system direct unrestricted control over a critical broadcast or network action.",
      "Good candidates include maintenance-note summarization, internal knowledge retrieval, invoice exception review, support ticket triage and operational incident descriptions. Test each candidate for privacy, accuracy, operational cost and recovery.",
      "Treat AI as part of a wider software and integration architecture. Identity, security, data quality, approvals and reporting determine whether automation is trustworthy in production."
    ]
  },
  {
    slug: "data-center-network-monitoring",
    title: "Reliable servers and networks: essentials for growing teams",
    category: "Servers & networking",
    excerpt: "Practical foundations for resilient on-premises, hybrid and cloud environments.",
    image: "/visuals/futuristic_purple_lit_data_centre.webp",
    paragraphs: [
      "Reliable IT infrastructure starts with service requirements. Identify the applications, recovery expectations, data criticality, peak load and available operational skills before deciding between cloud, on-premises or hybrid architectures.",
      "Core planning areas include segmentation, inventory, cabling standards, UPS power, storage protection, backups, patching and access control. Monitoring should describe user-facing service health, not only whether a device responds to a ping.",
      "When setting up virtualization, test restore and migration procedures as carefully as the initial installation. Keep configuration backups secure, separate administrative access, and document vendor support requirements.",
      "For organizations in Nepal, practical maintenance access, power quality and connectivity diversity deserve explicit attention. A right-sized deployment with tested processes often outperforms an expensive but poorly documented system."
    ]
  },
  {
    slug: "digital-headend-broadcasting-solutions-nepal",
    title: "Digital Headend & Broadcast Engineering in Nepal: Complete Architecture Guide",
    category: "Broadcasting Solutions",
    excerpt: "Designing DVB-C, DVB-S2, digital headend encoding, multiplexing, and media server pipelines for high-reliability television transmission.",
    image: "/visuals/neon_himalayan_satellite_uplink_at_sunset.webp",
    paragraphs: [
      "As television networks in Nepal and South Asia transition to end-to-end digital transmission, modern digital headend systems form the bedrock of signal integrity. A resilient digital headend unifies multi-format satellite downlinks, IP feeds, SDI baseband ingest, professional transcoding, scrambling, and RF multiplexing.",
      "Whether delivering DVB-C across cable networks, DVB-S2 for satellite direct-to-home (DTH), or feeding IPTV and OTT streaming platforms, key engineering priorities must include ultra-low latency, redundant CAS (Conditional Access Systems) and DRM, precise EPG metadata synchronization, and automated N+1 failover switches.",
      "Simulcast Technologies designs, deploys, and commissions turn-key digital broadcasting headends across Nepal. By integrating carrier-grade encoders, edge QAM modulators, and high-density media servers, broadcasters achieve pristine 1080p and 4K transmission with 99.999% on-air uptime.",
      "For operators upgrading legacy analogue or basic digital distribution, adopting software-defined headends and IP transport stream architectures dramatically reduces power consumption while providing complete agility to introduce new high-definition channels and multi-screen interactive services."
    ]
  },
  {
    slug: "software-development-top-it-company-nepal",
    title: "Software Development, Mobile Apps & SaaS: The Blueprint for Nepal's IT Ecosystem",
    category: "Software & IT Consulting",
    excerpt: "Why custom software development, mobile apps (iOS & Android), agentic AI task management, and SaaS architectures define Nepal's top IT companies.",
    image: "/visuals/isometric_purple_streaming_workflow_dashboard.webp",
    paragraphs: [
      "Nepal's digital landscape has rapidly evolved, demanding enterprise-class software development, high-performance mobile applications (iOS & Android), and bespoke business website development that surpass generic off-the-shelf templates. Recognized among Nepal's top IT companies, Simulcast delivers custom application engineering engineered for massive scale.",
      "Modern business systems require cohesive multi-platform execution: responsive Next.js web applications, native and cross-platform mobile apps for field staff and subscribers, cloud-native SaaS multi-tenant foundations, and secure RESTful/GraphQL microservice backends.",
      "The integration of Agentic AI and intelligent task management is transforming business workflows. Instead of static CRMs, modern organizations deploy autonomous agents capable of triaging customer inquiries, automating multi-step approvals, verifying telecom network anomalies, and synchronizing billing records in real-time.",
      "Through comprehensive IT consulting, technology roadmap advisory, and ongoing 24/7 technical support, Simulcast Technologies partners with leading financial, telecom, media, and educational institutions in Nepal to accelerate digital transformation with uncompromising reliability."
    ]
  }
];

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@simulcast.com.np").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "SimulcastDevAdmin2026!";

  if (!email || !password || password.length < 14) {
    throw new Error("Set SEED_ADMIN_EMAIL and a unique SEED_ADMIN_PASSWORD of at least 14 characters before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash, active: true },
    create: { email, name: "Site Administrator", passwordHash, role: "ADMIN" }
  });

  await db.siteSettings.upsert({
    where: { id: "main" },
    update: {
      publicEmail: "info@simulcast.com.np",
      phone: "9814823222 / 9851188274",
      address: "Kumaripati, Lagankhel Road, Lalitpur, Nepal"
    },
    create: {
      id: "main",
      companyName: "Simulcast Technologies Pvt. Ltd.",
      headline: "Software. Systems. Infrastructure.|Connected by design.",
      subheadline: "Custom software, AI automation, cloud, servers, networks, broadcast and streaming systems—designed, integrated and supported in Nepal and beyond.",
      slogan: "Integrated Broadcast & Technology Solutions",
      website: "https://www.simulcast.com.np",
      address: "Kumaripati, Lagankhel Road, Lalitpur, Nepal",
      publicEmail: "info@simulcast.com.np",
      phone: "9814823222 / 9851188274",
      seoDescription: "Simulcast Technologies Pvt. Ltd. — broadcast engineering, software development, AI automation, IT infrastructure and technology integration in Nepal."
    }
  });

  const services = [
    {
      slug: "broadcast-media",
      title: "Broadcast & Media Technology",
      eyebrow: "01 / LIVE & MEDIA",
      summary: "DVB head-ends, live production, channel playout, IPTV/OTT and media workflows.",
      body: "Broadcast head-end design and integration: DVB-C, DVB-S2, IPTV and OTT. Connected workflows: channel playout and scheduling, NRCS, ingest, MAM, character generation, multiviewing and video-wall systems. Delivery spans planning, commissioning, support and AMC.",
      icon: "radio-tower",
      imageUrl: "/visuals/neon_himalayan_broadcast_control_room.webp",
      sortOrder: 1
    },
    {
      slug: "software-platforms",
      title: "Software & Digital Platforms",
      eyebrow: "02 / BUILD & SCALE",
      summary: "Purpose-built web applications, portals, dashboards, APIs and enterprise software.",
      body: "We design intuitive digital experiences with secure backend systems, modern web architecture and integrations. Engagements span discovery, interface design, architecture, implementation and support.",
      icon: "code-2",
      imageUrl: "/visuals/futuristic_broadcast_editing_studio.webp",
      sortOrder: 2
    },
    {
      slug: "ai-automation",
      title: "AI & Process Automation",
      eyebrow: "03 / INTELLIGENCE",
      summary: "Practical automation that helps teams act faster and eliminate repetitive work.",
      body: "Process mapping, AI-assisted workflows, structured data pipelines, operations dashboards and approvals. We prioritize measurable usefulness, human oversight, appropriate safeguards and business outcomes.",
      icon: "brain-circuit",
      imageUrl: "/visuals/futuristic_ai_workflow_pipeline.webp",
      sortOrder: 3
    },
    {
      slug: "it-infrastructure",
      title: "IT & Network Infrastructure",
      eyebrow: "04 / CONNECTIVITY",
      summary: "Secure, scalable infrastructure for the services your business depends on.",
      body: "Infrastructure assessment, network design, systems integration, virtualization, monitoring, deployment and technical support. We bring dependable planning to connected environments.",
      icon: "server",
      imageUrl: "/visuals/futuristic_purple_lit_data_centre.webp",
      sortOrder: 4
    },
    {
      slug: "iptv-ott-dth",
      title: "IPTV / OTT / DTH Solutions",
      eyebrow: "03 / DISTRIBUTION",
      summary: "IPTV, OTT streaming and DTH headend and delivery systems.",
      body: "IPTV headends, OTT pipelines, transcoding, middleware, DTH distribution and delivery workflows.",
      icon: "tv",
      imageUrl: "/visuals/cloud_streaming_network_ecosystem.webp",
      sortOrder: 3
    },
    {
      slug: "data-center",
      title: "Data Center & Servers",
      eyebrow: "06 / INFRASTRUCTURE",
      summary: "Server, virtualization, storage, backup and data-centre systems.",
      body: "Server environments, virtualization, storage, backup, structured racks, network management and monitoring.",
      icon: "database",
      imageUrl: "/visuals/futuristic_purple_lit_data_centre.webp",
      sortOrder: 6
    },
    {
      slug: "systems-integration",
      title: "Systems Integration",
      eyebrow: "05 / CONNECT & OPERATE",
      summary: "Make hardware, applications and teams work as one dependable system.",
      body: "From architecture to APIs, device interoperability and workflow orchestration, we join the pieces of complex environments into coherent operating systems.",
      icon: "blocks",
      imageUrl: "/visuals/futuristic_broadcast_editing_studio.webp",
      sortOrder: 5
    },
    {
      slug: "technical-consulting",
      title: "Consulting & Support",
      eyebrow: "06 / PARTNERSHIP",
      summary: "Technology strategy, deployment planning, troubleshooting and long-term support.",
      body: "Technical consultation, solution design, vendor coordination, documentation, maintenance strategy and knowledge transfer—practical guidance matched to your team's needs.",
      icon: "headset",
      imageUrl: "/visuals/neon_himalayan_broadcast_control_room.webp",
      sortOrder: 6
    }
  ];

  for (const s of services) {
    await db.service.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  await db.project.deleteMany({});
  const projects = [
    {
      slug: "simulcast-brand-environment",
      title: "Simulcast Brand Environment",
      category: "Brand & Enterprise Environment",
      summary: "Integrated corporate environment, engineering workspaces, collaboration systems and digital showcase environments.",
      body: "High-performance technology environment designed for Simulcast Technologies, combining collaboration spaces, live demonstration capabilities and connected digital infrastructure.",
      imageUrl: "/visuals/futuristic_consulting_team_workspace.webp",
      location: "Lalitpur & Kathmandu, Nepal",
      featured: true,
      sortOrder: 1
    },
    {
      slug: "broadcast-operations-concept",
      title: "Modern Broadcast Operations",
      category: "Broadcast Engineering",
      summary: "An end-to-end reference architecture for multi-channel playout, master control and live production environments.",
      body: "Fully redundant broadcast master control architecture integrating playout automation, NRCS, channel branding, multi-viewer monitoring and IP contribution feeds.",
      imageUrl: "/visuals/neon_broadcast_operations_centre.webp",
      location: "Bagmati Province, Nepal",
      featured: true,
      sortOrder: 2
    },
    {
      slug: "connected-enterprise-concept",
      title: "Connected Enterprise Platform",
      category: "Software & Automation",
      summary: "Unifying enterprise operations, cloud microservices, workflow orchestration and secure API gateways.",
      body: "Custom software platform connecting disparate operational systems into a coherent single pane of glass with automated reporting and real-time telemetry.",
      imageUrl: "/visuals/cloud_network_operations_hub.webp",
      location: "Kathmandu & Remote",
      featured: true,
      sortOrder: 3
    },
    {
      slug: "data-center-systems-study",
      title: "Connected Infrastructure Systems",
      category: "Data Center & Networks",
      summary: "Resilient data center fabric, hyperconverged server infrastructure and low-latency core switching.",
      body: "Architecture and deployment study covering structured server racks, redundant power delivery, optical switching fabrics and 24/7 environmental telemetry.",
      imageUrl: "/visuals/futuristic_purple_lit_data_centre.webp",
      location: "Lalitpur Hub",
      featured: true,
      sortOrder: 4
    },
    {
      slug: "iptv-ott-streaming-architecture",
      title: "Next-Gen IPTV & OTT Streaming",
      category: "Streaming Infrastructure",
      summary: "Scalable IP headends, adaptive bitrate encoding and multi-screen distribution pipelines.",
      body: "High-throughput IPTV headend and OTT distribution architecture engineered for low latency live streaming, CDN origin delivery and subscriber edge delivery.",
      imageUrl: "/visuals/cloud_streaming_network_ecosystem.webp",
      location: "Nationwide Coverage",
      featured: true,
      sortOrder: 5
    },
    {
      slug: "ai-workflow-pipeline",
      title: "AI & Intelligent Workflow Pipeline",
      category: "AI & Process Automation",
      summary: "Automated media ingest, AI-assisted content tagging, intelligent transcoding and automated verification.",
      body: "Intelligent automation layer integrating computer vision, automated metadata tagging, compliance logging and automated workflow routing.",
      imageUrl: "/visuals/futuristic_ai_workflow_pipeline.webp",
      location: "Innovation Lab",
      featured: true,
      sortOrder: 6
    }
  ];

  for (const p of projects) {
    await db.project.upsert({ where: { slug: p.slug }, update: { ...p }, create: p });
  }

  for (const g of editorialGuides) {
    await db.post.upsert({
      where: { slug: g.slug },
      update: {
        title: g.title,
        category: g.category,
        excerpt: g.excerpt,
        body: g.paragraphs.join("\n\n"),
        imageUrl: g.image,
        published: true,
      },
      create: {
        slug: g.slug,
        title: g.title,
        category: g.category,
        excerpt: g.excerpt,
        body: g.paragraphs.join("\n\n"),
        imageUrl: g.image,
        published: true,
        publishedAt: new Date(),
      },
    });
  }

  // Seed default custom routes (Nexus PHP dynamic endpoints)
  const defaultRoutes = [
    {
      path: "/api/nexus.php",
      name: "Nexus Device Endpoints",
      description: "Production and private endpoints for Nexus TV Today (returns dynamic init & device URLs)",
      method: "ALL",
      contentType: "application/json",
      statusCode: 200,
      responseBody: JSON.stringify(
        {
          init_url: "https://nexus.tvtoday.com.np/api/init_device.php",
          device_url: "https://nexus.tvtoday.com.np/device.php",
          pvt_init_url: "http://192.168.5.208/nexus/api/init_device.php",
          pvt_device_url: "http://192.168.5.208/nexus/device.php"
        },
        null,
        2
      ),
      headers: JSON.stringify({ "Access-Control-Allow-Origin": "*" }, null, 2),
      enabled: true
    },
    {
      path: "/api/app_url.php",
      name: "Nexus App URL Endpoint",
      description: "PHP endpoint compatible URL returning device endpoints for applications",
      method: "ALL",
      contentType: "application/json",
      statusCode: 200,
      responseBody: JSON.stringify(
        {
          init_url: "https://nexus.tvtoday.com.np/api/init_device.php",
          device_url: "https://nexus.tvtoday.com.np/device.php",
          pvt_init_url: "http://192.168.5.208/nexus/api/init_device.php",
          pvt_device_url: "http://192.168.5.208/nexus/device.php"
        },
        null,
        2
      ),
      headers: JSON.stringify({ "Access-Control-Allow-Origin": "*" }, null, 2),
      enabled: true
    }
  ];

  for (const r of defaultRoutes) {
    await (db as any).customRoute.upsert({
      where: { path: r.path },
      update: {},
      create: r
    }).catch(() => {});
  }

  console.log("Seed complete. Admin:", email, "(password not printed)");
}

main()
  .finally(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
