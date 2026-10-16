import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { logAudit } from "@/lib/audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export interface ClientItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  industry: string;
  status: "ACTIVE" | "PROSPECT" | "INACTIVE";
  notes: string;
  logoUrl: string;
  contactPerson: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
  notes: string;
  paymentTerms: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const VENDORS_FILE = path.join(DATA_DIR, "vendors.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readFallback<T>(filePath: string): Promise<T[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeFallback<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDir();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to write fallback to ${filePath}:`, err);
  }
}

// Initial Seed Data for immediate high-end professional appearance
const SEED_CLIENTS: ClientItem[] = [
  {
    id: "cli_dishhome_np",
    name: "Dish Media Network",
    company: "DishHome Nepal",
    email: "engineering@dishhome.com.np",
    phone: "+977 1 4217000",
    address: "Chabahil, Kathmandu",
    website: "https://www.dishhome.com.np",
    industry: "Broadcasting & DTH",
    status: "ACTIVE",
    notes: "Primary DVB-S2 satellite playout, uplink automation, and DVB-T2 digital terrestrial transmission equipment.",
    logoUrl: "/media/client-dishhome.png",
    contactPerson: "Bikash Adhikari (VP Engineering)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_subisu_net",
    name: "Subisu Cablenet Ltd.",
    company: "Subisu Cablenet",
    email: "noc@subisu.net.np",
    phone: "+977 1 4429616",
    address: "Baluwatar, Kathmandu",
    website: "https://www.subisu.net.np",
    industry: "ISP & Telecom",
    status: "ACTIVE",
    notes: "Carrier-grade DWDM optical fiber links, FTTH GPON OLT deployment, and CGNAT core router infrastructure.",
    logoUrl: "/media/client-subisu.png",
    contactPerson: "Sanjay Sharma (CTO)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_kantipur_media",
    name: "Kantipur Television Network",
    company: "Kantipur TV",
    email: "transmission@kantipurtv.com",
    phone: "+977 1 5186000",
    address: "Tinkune, Kathmandu",
    website: "https://www.ekantipur.com",
    industry: "Broadcast Television",
    status: "ACTIVE",
    notes: "HD Master Control Room playout automation, high-power FM transmitters across provincial relay stations.",
    logoUrl: "/media/client-kantipur.png",
    contactPerson: "Dinesh Shrestha (Head of Broadcast Operations)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_nepal_telecom",
    name: "Nepal Telecom (NTC)",
    company: "Nepal Doorsanchar Company Ltd.",
    email: "procurement@ntc.net.np",
    phone: "+977 1 4224033",
    address: "Bhadrakali Plaza, Kathmandu",
    website: "https://www.ntc.net.np",
    industry: "Telecom & Government",
    status: "PROSPECT",
    notes: "Under consultation for autonomous AI network telemetry agents and TR-069 auto-configuration platform.",
    logoUrl: "/media/client-ntc.png",
    contactPerson: "Rajesh Joshi (Senior Engineer)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_VENDORS: VendorItem[] = [
  {
    id: "ven_rohde_schwarz",
    name: "Rohde & Schwarz GmbH",
    category: "Hardware & RF Transmitters",
    contactPerson: "Hans Weber",
    email: "orders@rohde-schwarz.com",
    phone: "+49 89 4129-0",
    address: "Munich, Germany",
    website: "https://www.rohde-schwarz.com",
    status: "ACTIVE",
    notes: "Direct tier-1 vendor for high-power solid-state digital TV & FM transmitters, spectrum analyzers, and RF test gear.",
    paymentTerms: "Net 60",
    logoUrl: "/media/vendor-rohde.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven_commscope",
    name: "CommScope Inc.",
    category: "Optical Fiber & RF Cables",
    contactPerson: "David Miller",
    email: "apac-sales@commscope.com",
    phone: "+1 828-324-2200",
    address: "Claremont, NC, USA",
    website: "https://www.commscope.com",
    status: "ACTIVE",
    notes: "Heliax coaxial feeder cables, optical fiber patch panels, splice closures, and outdoor terminal boxes.",
    paymentTerms: "Net 30",
    logoUrl: "/media/vendor-commscope.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven_cisco_systems",
    name: "Cisco Systems APAC",
    category: "Routing & Core Switches",
    contactPerson: "Priya Nair",
    email: "nepal-partner@cisco.com",
    phone: "+91 80 4426 0000",
    address: "Bangalore, India",
    website: "https://www.cisco.com",
    status: "ACTIVE",
    notes: "Carrier Routing System (CRS), ASR 9000 edge routers, and Nexus high-density core data center switches.",
    paymentTerms: "Net 45",
    logoUrl: "/media/vendor-cisco.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven_cloud_solutions",
    name: "Amazon Web Services (AWS)",
    category: "Cloud & Media Services",
    contactPerson: "AWS Enterprise Support",
    email: "billing@amazon.com",
    phone: "+1 206-266-1000",
    address: "Seattle, WA, USA",
    website: "https://aws.amazon.com",
    status: "ACTIVE",
    notes: "AWS Elemental MediaLive, MediaPackage, CloudFront CDN edge streaming, and EC2 GPU transcoding clusters.",
    paymentTerms: "Credit Card / Auto-debit",
    logoUrl: "/media/vendor-aws.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// 1. CLIENTS MANAGEMENT
// ==========================================

export async function getClients(options?: {
  status?: string;
  industry?: string;
  search?: string;
}): Promise<ClientItem[]> {
  const search = options?.search?.toLowerCase();
  const status = options?.status?.toUpperCase();
  const industry = options?.industry;

  try {
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (industry && industry !== "ALL") where.industry = industry;

    const dbClients = await db.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (dbClients && dbClients.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mapped: ClientItem[] = dbClients.map((c: any) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        address: c.address,
        website: c.website,
        industry: c.industry,
        status: c.status as ClientItem["status"],
        notes: c.notes,
        logoUrl: c.logoUrl,
        contactPerson: c.contactPerson,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
      }));

      if (search) {
        mapped = mapped.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.company.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search) ||
            c.contactPerson.toLowerCase().includes(search)
        );
      }
      return mapped;
    }
  } catch {}

  let list = await readFallback<ClientItem>(CLIENTS_FILE);
  if (list.length === 0) {
    list = SEED_CLIENTS;
    await writeFallback(CLIENTS_FILE, list);
  }

  if (status && status !== "ALL") {
    list = list.filter((c) => c.status === status);
  }
  if (industry && industry !== "ALL") {
    list = list.filter((c) => c.industry === industry);
  }
  if (search) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.contactPerson.toLowerCase().includes(search)
    );
  }

  return list;
}

export async function saveClient(input: {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  status?: "ACTIVE" | "PROSPECT" | "INACTIVE";
  notes?: string;
  logoUrl?: string;
  contactPerson?: string;
}): Promise<ClientItem> {
  const now = new Date();
  const client: ClientItem = {
    id: input.id || `cli_${randomUUID().slice(0, 8)}`,
    name: input.name,
    company: input.company || input.name,
    email: input.email,
    phone: input.phone || "",
    address: input.address || "",
    website: input.website || "",
    industry: input.industry || "Enterprise",
    status: input.status || "ACTIVE",
    notes: input.notes || "",
    logoUrl: input.logoUrl || "",
    contactPerson: input.contactPerson || "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    const dbRecord = await db.client.upsert({
      where: { id: client.id },
      update: {
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        website: client.website,
        industry: client.industry,
        status: client.status,
        notes: client.notes,
        logoUrl: client.logoUrl,
        contactPerson: client.contactPerson,
        updatedAt: now,
      },
      create: {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        website: client.website,
        industry: client.industry,
        status: client.status,
        notes: client.notes,
        logoUrl: client.logoUrl,
        contactPerson: client.contactPerson,
      },
    });
    client.id = dbRecord.id;
  } catch {
    const list = await readFallback<ClientItem>(CLIENTS_FILE);
    const idx = list.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      client.createdAt = list[idx].createdAt;
      list[idx] = client;
    } else {
      list.unshift(client);
    }
    await writeFallback(CLIENTS_FILE, list);
  }

  await logAudit({
    action: input.id ? "CLIENT_UPDATED" : "CLIENT_CREATED",
    category: "SYSTEM",
    actor: "Admin",
    target: `${client.company} (${client.email})`,
    details: `Saved client profile for ${client.company}`,
    status: "SUCCESS",
  });

  return client;
}

export async function deleteClient(id: string): Promise<{ ok: boolean }> {
  try {
    await db.client.delete({ where: { id } });
  } catch {
    const list = await readFallback<ClientItem>(CLIENTS_FILE);
    const filtered = list.filter((c) => c.id !== id);
    await writeFallback(CLIENTS_FILE, filtered);
  }

  await logAudit({
    action: "CLIENT_DELETED",
    category: "SYSTEM",
    actor: "Admin",
    target: id,
    details: `Deleted client record ${id}`,
    status: "SUCCESS",
  });

  return { ok: true };
}

// ==========================================
// 2. VENDORS MANAGEMENT
// ==========================================

export async function getVendors(options?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<VendorItem[]> {
  const search = options?.search?.toLowerCase();
  const status = options?.status?.toUpperCase();
  const category = options?.category;

  try {
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (category && category !== "ALL") where.category = category;

    const dbVendors = await db.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (dbVendors && dbVendors.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mapped: VendorItem[] = dbVendors.map((v: any) => ({
        id: v.id,
        name: v.name,
        category: v.category,
        contactPerson: v.contactPerson,
        email: v.email,
        phone: v.phone,
        address: v.address,
        website: v.website,
        status: v.status as VendorItem["status"],
        notes: v.notes,
        paymentTerms: v.paymentTerms,
        logoUrl: v.logoUrl,
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
        updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : v.updatedAt,
      }));

      if (search) {
        mapped = mapped.filter(
          (v) =>
            v.name.toLowerCase().includes(search) ||
            v.category.toLowerCase().includes(search) ||
            v.email.toLowerCase().includes(search) ||
            v.contactPerson.toLowerCase().includes(search)
        );
      }
      return mapped;
    }
  } catch {}

  let list = await readFallback<VendorItem>(VENDORS_FILE);
  if (list.length === 0) {
    list = SEED_VENDORS;
    await writeFallback(VENDORS_FILE, list);
  }

  if (status && status !== "ALL") {
    list = list.filter((v) => v.status === status);
  }
  if (category && category !== "ALL") {
    list = list.filter((v) => v.category === category);
  }
  if (search) {
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(search) ||
        v.category.toLowerCase().includes(search) ||
        v.email.toLowerCase().includes(search) ||
        v.contactPerson.toLowerCase().includes(search)
    );
  }

  return list;
}

export async function saveVendor(input: {
  id?: string;
  name: string;
  category?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  status?: "ACTIVE" | "PENDING" | "INACTIVE";
  notes?: string;
  paymentTerms?: string;
  logoUrl?: string;
}): Promise<VendorItem> {
  const now = new Date();
  const vendor: VendorItem = {
    id: input.id || `ven_${randomUUID().slice(0, 8)}`,
    name: input.name,
    category: input.category || "Hardware",
    contactPerson: input.contactPerson || "",
    email: input.email,
    phone: input.phone || "",
    address: input.address || "",
    website: input.website || "",
    status: input.status || "ACTIVE",
    notes: input.notes || "",
    paymentTerms: input.paymentTerms || "Net 30",
    logoUrl: input.logoUrl || "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    const dbRecord = await db.vendor.upsert({
      where: { id: vendor.id },
      update: {
        name: vendor.name,
        category: vendor.category,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        website: vendor.website,
        status: vendor.status,
        notes: vendor.notes,
        paymentTerms: vendor.paymentTerms,
        logoUrl: vendor.logoUrl,
        updatedAt: now,
      },
      create: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        website: vendor.website,
        status: vendor.status,
        notes: vendor.notes,
        paymentTerms: vendor.paymentTerms,
        logoUrl: vendor.logoUrl,
      },
    });
    vendor.id = dbRecord.id;
  } catch {
    const list = await readFallback<VendorItem>(VENDORS_FILE);
    const idx = list.findIndex((v) => v.id === vendor.id);
    if (idx >= 0) {
      vendor.createdAt = list[idx].createdAt;
      list[idx] = vendor;
    } else {
      list.unshift(vendor);
    }
    await writeFallback(VENDORS_FILE, list);
  }

  await logAudit({
    action: input.id ? "VENDOR_UPDATED" : "VENDOR_CREATED",
    category: "SYSTEM",
    actor: "Admin",
    target: `${vendor.name} (${vendor.category})`,
    details: `Saved vendor profile for ${vendor.name}`,
    status: "SUCCESS",
  });

  return vendor;
}

export async function deleteVendor(id: string): Promise<{ ok: boolean }> {
  try {
    await db.vendor.delete({ where: { id } });
  } catch {
    const list = await readFallback<VendorItem>(VENDORS_FILE);
    const filtered = list.filter((v) => v.id !== id);
    await writeFallback(VENDORS_FILE, filtered);
  }

  await logAudit({
    action: "VENDOR_DELETED",
    category: "SYSTEM",
    actor: "Admin",
    target: id,
    details: `Deleted vendor record ${id}`,
    status: "SUCCESS",
  });

  return { ok: true };
}
