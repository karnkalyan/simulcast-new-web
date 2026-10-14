/** Original Simulcast capability descriptions informed by public technology research.
 * Categories are solution examples, NOT claims of proprietary ownership or verified availability.
 */
export type Capability={slug:string;title:string;category:string;intro:string;features:string[];image:string};
export const softwareCapabilities:Capability[] = [
  {
    "slug": "broadcast-playout",
    "title": "Broadcast Playout & Automation",
    "category": "Broadcast software",
    "intro": "Channel playout, scheduling, playlist management and transmission control.",
    "features": [
      "24/7 playback and playlist execution",
      "Program/preview workflows",
      "Scheduled adverts and automation triggers",
      "Monitoring and failover planning"
    ],
    "image": "/visuals/neon_broadcast_control_centre.webp"
  },
  {
    "slug": "motion-cg",
    "title": "Motion Graphics & On-Air CG",
    "category": "Broadcast software",
    "intro": "Character generation, data-driven lower-thirds, news straps, tickers and live templates.",
    "features": [
      "Lower thirds and scrolling tickers",
      "Channel identity and live bugs",
      "Template-based motion graphics",
      "Sports and election visual packages"
    ],
    "image": "/visuals/futuristic_purple_broadcast_control_room.webp"
  },
  {
    "slug": "newsroom-nrcs",
    "title": "Newsroom & NRCS Workflows",
    "category": "Newsroom software",
    "intro": "Story planning, scripts, rundown control and newsroom-to-control-room handoff.",
    "features": [
      "Story assignments and scripts",
      "Rundown planning and changes",
      "MOS-style integration planning",
      "Prompter and graphics handoff"
    ],
    "image": "/visuals/futuristic_neon_newsroom_studio.webp"
  },
  {
    "slug": "media-asset-management",
    "title": "Media Asset Management",
    "category": "Media operations",
    "intro": "Metadata-driven media ingest, search, proxy workflows, storage and archive.",
    "features": [
      "Media cataloging and tagging",
      "Ingest and proxy generation",
      "Archive tiers and retention",
      "Operator permissions and audit trails"
    ],
    "image": "/visuals/futuristic_broadcast_editing_studio.webp"
  },
  {
    "slug": "stream-processing",
    "title": "Live Ingest, Transcoding & Recording",
    "category": "Streaming software",
    "intro": "Convert diverse broadcast inputs into controlled IP, DVB and OTT output workflows.",
    "features": [
      "SRT, RTMP, RTSP, RTP and SDI workflows",
      "GPU transcoding architecture",
      "Recording and compliance archive",
      "DVB transport stream processing"
    ],
    "image": "/visuals/neon_broadcast_operations_centre.webp"
  },
  {
    "slug": "iptv-ott-platforms",
    "title": "IPTV / OTT / DTH Platforms",
    "category": "Streaming & distribution",
    "intro": "Design headends and digital delivery experiences across satellite, cable and connected screens.",
    "features": [
      "Middleware and subscriber access",
      "HLS / DASH delivery and adaptive bitrate",
      "DVB-C / DVB-S2 / DTH planning",
      "Multi-screen player and device workflows"
    ],
    "image": "/visuals/cloud_streaming_network_ecosystem.webp"
  },
  {
    "slug": "studio-production",
    "title": "Live Studio Production Systems",
    "category": "Production software",
    "intro": "Integrated live camera switching, virtual sets, monitoring, graphics and teleprompters.",
    "features": [
      "Program/preview switching",
      "Virtual sets and chroma key",
      "Multiviewer and audio meters",
      "Studio prompter and camera confidence"
    ],
    "image": "/visuals/neon_ai_broadcast_control_room.webp"
  },
  {
    "slug": "broadcast-monitoring",
    "title": "Broadcast Monitoring & Multiviewer",
    "category": "Operations software",
    "intro": "Centralized signal health, confidence monitoring, alarms and operator control rooms.",
    "features": [
      "Multichannel mosaic monitoring",
      "Audio and video alerting",
      "Signal routing and source selection",
      "Availability and incident dashboards"
    ],
    "image": "/visuals/neon_global_command_centre.webp"
  },
  {
    "slug": "telecom-oss",
    "title": "Telecom OSS & Network Operations",
    "category": "Telecom software",
    "intro": "Unify access network monitoring, subscriber sessions, device inventory and field coordination.",
    "features": [
      "NOC telemetry and alarm handling",
      "RADIUS / AAA / session visibility",
      "GPON OLT and CPE provisioning workflows",
      "SNMP monitoring and change history"
    ],
    "image": "/visuals/futuristic_neon_analytics_control_centre.webp"
  },
  {
    "slug": "telecom-bss",
    "title": "Telecom BSS, Billing & CRM",
    "category": "Telecom software",
    "intro": "Connect subscriber onboarding, plans, billing, support and payments into one lifecycle.",
    "features": [
      "Subscriber CRM and service provisioning",
      "Recurring billing and invoice processing",
      "Payment and collection integrations",
      "Support and service request histories"
    ],
    "image": "/visuals/futuristic_purple_analytics_dashboard_ecosystem.webp"
  },
  {
    "slug": "network-automation",
    "title": "Network Device & Field Automation",
    "category": "Infrastructure software",
    "intro": "Automate repeatable configurations, technician handoffs and multi-vendor operations.",
    "features": [
      "Device configuration workflows",
      "OLT, router and switch integrations",
      "Field dispatch and asset tracking",
      "Approval and rollback planning"
    ],
    "image": "/visuals/isometric_broadcast_technology_network.webp"
  },
  {
    "slug": "education-management",
    "title": "School & Institution Management",
    "category": "Business software",
    "intro": "Modular school administration, academic operations and institution service portals.",
    "features": [
      "Admission and student records",
      "Timetable, attendance and assessment",
      "Fees, notices and parent portal",
      "Reporting and role-based access"
    ],
    "image": "/visuals/futuristic_consulting_team_workspace.webp"
  },
  {
    "slug": "business-platforms",
    "title": "ERP, Portals & Custom Web Applications",
    "category": "Business software",
    "intro": "Custom business applications, client portals, workflow dashboards and integrations.",
    "features": [
      "Next.js web applications",
      "Mobile-friendly dashboards",
      "Approval flows and reporting",
      "REST APIs and third-party integrations"
    ],
    "image": "/visuals/isometric_purple_streaming_workflow_dashboard.webp"
  },
  {
    "slug": "ai-operations",
    "title": "AI Workflows & Intelligent Automation",
    "category": "Applied AI",
    "intro": "AI-assisted knowledge retrieval, document processes, NOC workflows and human-approved decisions.",
    "features": [
      "Document and ticket triage",
      "AI-assisted support and knowledge search",
      "Monitoring insight summaries",
      "Review and approval guardrails"
    ],
    "image": "/visuals/futuristic_ai_workflow_pipeline.webp"
  },
  {
    "slug": "cloud-infrastructure",
    "title": "Cloud, Servers & Data Center",
    "category": "Infrastructure",
    "intro": "Deployable compute, network and storage environments with monitoring and backup planning.",
    "features": [
      "Virtualization and high availability",
      "Backup and disaster recovery",
      "Data center cabling and racks",
      "Cloud and on-premises integration"
    ],
    "image": "/visuals/futuristic_purple_lit_data_centre.webp"
  },
  {
    "slug": "support-platform",
    "title": "Service Desk & AMC Management",
    "category": "Service operations",
    "intro": "Service intake, tickets, contract renewals and transparent follow-up for support teams.",
    "features": [
      "Ticket queues and service SLAs",
      "Preventive maintenance schedules",
      "Escalation and visit tracking",
      "Customer notifications and reports"
    ],
    "image": "/visuals/modern_support_network_illustration.webp"
  },
  {
    "slug": "digital-headend-systems",
    "title": "Digital Headend & Broadcasting Solutions",
    "category": "Broadcast software",
    "intro": "Turnkey digital headend systems, DVB-C/S2/T2 multiplexing, CAS/DRM scrambling, and professional broadcasting transmission in Nepal and worldwide.",
    "features": [
      "DVB-C, DVB-S2 & DVB-T2 multiplexing and modulation",
      "Hardware & IP-based CAS / DRM encryption integration",
      "Electronic Program Guide (EPG) & PSI/SI generation",
      "High-density Edge QAM and RF output distribution"
    ],
    "image": "/visuals/neon_himalayan_satellite_uplink_at_sunset.webp"
  },
  {
    "slug": "media-server-streaming",
    "title": "Media Server & Video Streaming Infrastructure",
    "category": "Streaming software",
    "intro": "Ultra-low-latency media servers, adaptive bitrate live packaging, VOD clustering, and global CDN delivery for OTT and IPTV platforms.",
    "features": [
      "Low-latency HLS, DASH, SRT, RTMP and WebRTC ingestion",
      "Scalable media server clusters with automated failover",
      "Live-to-VOD recording, timeshift and nPVR engines",
      "Edge caching and multi-CDN distribution routing"
    ],
    "image": "/visuals/futuristic_cloud_streaming_control_room.webp"
  },
  {
    "slug": "agentic-ai-task-management",
    "title": "Agentic AI Automation & Task Management",
    "category": "Applied AI",
    "intro": "Autonomous AI agents and intelligent task management systems that automate multi-step operational workflows with human oversight.",
    "features": [
      "Multi-agent task orchestration and autonomous delegation",
      "Enterprise knowledge retrieval and intelligent document triage",
      "Automated ticketing, escalation and resolution workflows",
      "Deterministic guardrails and human-in-the-loop review"
    ],
    "image": "/visuals/futuristic_ai_workflow_pipeline.webp"
  },
  {
    "slug": "mobile-app-development",
    "title": "Mobile Application Development (iOS & Android)",
    "category": "Application Engineering",
    "intro": "High-performance native and cross-platform mobile apps for iOS and Android, built for enterprise workflows, media streaming, and subscriber portals.",
    "features": [
      "iOS and Android native and cross-platform architecture",
      "Live video streaming player and OTT mobile integration",
      "Offline-first synchronization and real-time push alerts",
      "Secure biometric authentication and payment gateway integration"
    ],
    "image": "/visuals/collaborative_purple_tech_deployment_workflow.webp"
  },
  {
    "slug": "saas-cloud-platforms",
    "title": "SaaS Application Development & Cloud Systems",
    "category": "Application Engineering",
    "intro": "Multi-tenant SaaS platforms, scalable cloud microservices, subscription billing, and developer-first REST/GraphQL APIs.",
    "features": [
      "Multi-tenant database design and tenant data isolation",
      "Automated recurring subscription and invoice management",
      "Granular role-based access control (RBAC) and SSO",
      "High-throughput public APIs and webhook event delivery"
    ],
    "image": "/visuals/isometric_purple_streaming_workflow_dashboard.webp"
  },
  {
    "slug": "business-website-development",
    "title": "Business Website Development & Enterprise Portals",
    "category": "Application Engineering",
    "intro": "Bespoke corporate web platforms, customer self-service portals, and SEO-engineered business websites built with modern Next.js.",
    "features": [
      "Modern Next.js and React architecture with sub-second page loads",
      "Enterprise SEO engineering, structured schema, and rich meta",
      "Content management system (CMS) integration and headless APIs",
      "Interactive analytics dashboards and customer service portals"
    ],
    "image": "/visuals/cloud_network_operations_hub.webp"
  },
  {
    "slug": "it-consulting-digital",
    "title": "IT Consulting & Digital Transformation",
    "category": "Service operations",
    "intro": "Strategic IT consulting, infrastructure auditing, enterprise broadcast modernization, and technology roadmap guidance from Nepal's top IT experts.",
    "features": [
      "Technology roadmap planning and vendor-agnostic architecture audits",
      "Broadcast and telecom compliance and regulatory alignment",
      "Cloud migration, disaster recovery, and high-availability planning",
      "Security posture assessment and staff technical empowerment"
    ],
    "image": "/visuals/futuristic_consulting_team_workspace.webp"
  }
];
export const softwareCategories=["All","Broadcast software","Newsroom software","Media operations","Streaming software","Streaming & distribution","Production software","Operations software","Telecom software","Infrastructure software","Business software","Application Engineering","Applied AI","Infrastructure","Service operations"];
