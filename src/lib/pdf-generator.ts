import { promises as fs } from "fs";
import path from "path";

export interface PdfSection {
  heading: string;
  lines: string[];
}

/**
 * Generates a valid standard PDF 1.4 buffer with Helvetica typography,
 * brand color accents, and clean margin layouts without external binary dependencies.
 */
export function generateSimulcastPdf(title: string, sections: PdfSection[]): Buffer {
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length;
  }

  // Sanitize text for PDF string literals
  const sanitize = (text: string) => text.replace(/[()\\]/g, "\\$&");

  let stream = `BT\n/F1 18 Tf\n50 780 Td\n(${sanitize(title)}) Tj\nET\n`;
  stream += `BT\n/F1 10 Tf\n50 762 Td\n(Official Enterprise Documentation - Simulcast Technologies Pvt. Ltd.) Tj\nET\n`;
  stream += `0.17 0.05 0.23 RG\n2 w\n50 750 m 545 750 l S\n`;

  let y = 718;
  for (const sec of sections) {
    if (y < 120) break;
    // Section header
    stream += `BT\n/F1 13 Tf\n50 ${y} Td\n(${sanitize(sec.heading)}) Tj\nET\n`;
    y -= 18;

    for (const line of sec.lines) {
      if (y < 70) break;
      stream += `BT\n/F1 10 Tf\n60 ${y} Td\n(${sanitize(line)}) Tj\nET\n`;
      y -= 15;
    }
    y -= 10;
  }

  // Footer separator and text
  stream += `0.7 0.7 0.7 RG\n1 w\n50 50 m 545 50 l S\n`;
  stream += `BT\n/F1 8 Tf\n50 38 Td\n(Simulcast Technologies Pvt. Ltd. | Lalitpur & Kathmandu, Nepal | support@simulcast.com.np | info@simulcast.com.np) Tj\nET\n`;

  const streamLength = Buffer.byteLength(stream, "utf-8");

  // Obj 1: Catalog
  addObject(`<< /Type /Catalog /Pages 2 0 R >>`);
  // Obj 2: Pages
  addObject(`<< /Type /Pages /Kids [4 0 R] /Count 1 >>`);
  // Obj 3: Font
  addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  // Obj 4: Page
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>`);
  // Obj 5: Content stream
  addObject(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`);

  let out = `%PDF-1.4\n`;
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(out, "utf-8"));
    out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(out, "utf-8");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const offStr = String(offsets[i]).padStart(10, "0");
    out += `${offStr} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(out, "utf-8");
}

/**
 * Returns or ensures the pre-rendered Corporate Profile PDF
 */
export async function ensureSimulcastDocs(): Promise<{ profilePath: string; brochurePath: string }> {
  const docsDir = path.join(process.cwd(), "public", "docs");
  await fs.mkdir(docsDir, { recursive: true });

  const profilePath = path.join(docsDir, "Simulcast_Technologies_Company_Profile.pdf");
  const brochurePath = path.join(docsDir, "Simulcast_Solutions_Brochure.pdf");

  try {
    await fs.access(profilePath);
  } catch {
    const profileBuf = generateSimulcastPdf("SIMULCAST TECHNOLOGIES - CORPORATE PROFILE", [
      {
        heading: "1. Executive Summary & Company Profile",
        lines: [
          "Simulcast Technologies Pvt. Ltd. is Nepal's premier broadcast engineering and telecommunications provider.",
          "Headquartered in Kumaripati, Lalitpur, Simulcast operates mission-critical infrastructure across 7 provinces.",
          "We design, build, and maintain national FM networks, DVB-T2 digital television, OTT/IPTV, and fiber links.",
        ],
      },
      {
        heading: "2. Specialized Engineering Disciplines",
        lines: [
          "- RF & Digital TV: High-power FM and DVB-T2/ISDB-T transmitters, antenna combiners, STL microwave links.",
          "- Cloud & Master Control Playout: 24/7 master control, CG graphics, video servers, live HLS multi-format transcoding.",
          "- Optical Fiber & ISP Core: GPON/XGS-PON OLTs, core routing, DWDM, and subscriber management platforms.",
          "- SIMUL Software Suite: Integrated ISP billing, telemetry monitoring, bandwidth accounting, and subscriber portals.",
          "- Model Context Protocol (MCP) AI: Autonomous agents, customer communication workflows, and API integrations.",
        ],
      },
      {
        heading: "3. Contact & Engineering Operations",
        lines: [
          "NOC & Technical Support: support@simulcast.com.np",
          "Official Corporate Inquiries: info@simulcast.com.np",
          "Enterprise Solutions & Sales: sales@simulcast.com.np",
          "Official Portal: https://www.simulcast.com.np",
        ],
      },
    ]);
    await fs.writeFile(profilePath, profileBuf);
  }

  try {
    await fs.access(brochurePath);
  } catch {
    const brochureBuf = generateSimulcastPdf("SIMULCAST TECHNOLOGIES - SOLUTIONS BROCHURE", [
      {
        heading: "1. Broadcast Playout & Headend Infrastructure",
        lines: [
          "Complete end-to-end automation for terrestrial and satellite television broadcast operations.",
          "Features automated scheduling, multi-layer graphics (CG), SCTE-35 ad insertion, and SDI/NDI/SMPTE 2110 IP video.",
        ],
      },
      {
        heading: "2. OTT, IPTV & Multi-Screen Distribution",
        lines: [
          "Low-latency CMAF/HLS live streaming engine with integrated DRM (Widevine, FairPlay).",
          "Dynamic catch-up TV, cloud time-shift recording, and scalable edge CDN delivery nodes.",
        ],
      },
      {
        heading: "3. Enterprise IT, Fiber & AI Automation",
        lines: [
          "Next-generation enterprise networking, automated NOC telemetry monitoring, and autonomous AI agents.",
          "Contact our engineering team at support@simulcast.com.np for tailored technical proposals.",
        ],
      },
    ]);
    await fs.writeFile(brochurePath, brochureBuf);
  }

  return { profilePath, brochurePath };
}
