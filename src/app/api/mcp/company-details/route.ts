import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fallbackSettings, staticServices, staticProjects } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  let settings = null;
  let services = staticServices;
  let projects = staticProjects;

  try {
    const s = await prisma.siteSettings.findFirst();
    if (s) settings = s;
  } catch {}

  try {
    const svcs = await prisma.service.findMany({ where: { published: true } });
    if (svcs && svcs.length > 0) services = svcs;
  } catch {}

  try {
    const projs = await prisma.project.findMany({ where: { published: true } });
    if (projs && projs.length > 0) projects = projs;
  } catch {}

  const finalSettings = settings || fallbackSettings;

  const companyProfile = {
    company: {
      name: finalSettings.companyName || "Simulcast Technologies Pvt. Ltd.",
      headline: finalSettings.headline || "Engineering Critical IT, Broadcast & Telecom Infrastructure",
      subheadline: finalSettings.subheadline || "Specialized in High-Density RF Broadcast, Optical Fiber Networks, Custom Software Platforms, and AI Integration in Nepal.",
      slogan: finalSettings.slogan || "Bridging Signal & Code Across Nepal",
      website: "https://www.simulcast.com.np",
      publicEmail: finalSettings.publicEmail || "info@simulcast.com.np",
      supportEmail: "support@simulcast.com.np",
      phone: finalSettings.phone || "+977 1 4420000",
      address: finalSettings.address || "Kathmandu, Bagmati, Nepal",
      established: "Pioneering broadcast & software technology across Nepal",
    },
    solutionsCategories: [
      {
        category: "RF & Broadcasting Systems",
        description: "High-density digital broadcast transmitters, RF combiners, DVB-T2/ISDB-T broadcasting, STL micro-links, and transmitter telemetry monitoring.",
      },
      {
        category: "IPTV, OTT & Playout Automation",
        description: "Cloud playout platforms, low-latency live transcoding, multi-CDN distribution, catch-up TV, EPG management, and mobile OTT apps.",
      },
      {
        category: "Optical Fiber & ISP Core Networks",
        description: "Carrier-grade GPON/EPON OLT deployments, DWDM backbone, BGP multi-homing, CGNAT, TR-069 ACS management, and FTTH infrastructure.",
      },
      {
        category: "SIMUL Enterprise Software Products",
        description: "Bespoke billing engines, subscriber management systems, ERP automation, bandwidth provisioning, and CRM platforms.",
      },
      {
        category: "AI Enterprise Agents & MCP Integrations",
        description: "Custom AI autonomous customer agents, Model Context Protocol (MCP) servers, real-time live chat escalation, and workflow automation.",
      },
      {
        category: "Critical 24/7 Infrastructure Support",
        description: "High-availability SLA support, NOC monitoring, power redundancy, and field engineering across all 7 provinces of Nepal.",
      },
    ],
    publishedServices: services.map((s) => ({
      title: s.title,
      summary: s.summary,
      slug: s.slug,
    })),
    featuredProjects: projects.map((p) => ({
      title: p.title,
      category: p.category,
      summary: p.summary,
      location: p.location,
    })),
  };

  return NextResponse.json(companyProfile, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
