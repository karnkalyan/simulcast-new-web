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
  showOnWebsite?: boolean;
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
  showOnWebsite?: boolean;
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

// Initial Real Clients from Simulcast Website
const SEED_CLIENTS: ClientItem[] = [
  {
    id: "cli_tv_today",
    name: "TV Today",
    company: "TV Today HD Network",
    email: "broadcast@tvtoday.com.np",
    phone: "+977 1 4111222",
    address: "Kathmandu, Nepal",
    website: "https://tvtoday.com.np",
    industry: "Television & Media Network",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Production and broadcast transmission network with 24/7 master control playout and digital stream integration.",
    logoUrl: "",
    contactPerson: "Station Director",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_ap1_hd",
    name: "AP1 HD",
    company: "Annapurna Media Network",
    email: "technical@ap1.tv",
    phone: "+977 1 5000111",
    address: "Lalitpur, Nepal",
    website: "https://ap1.tv",
    industry: "National Satellite Broadcaster",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Nepal's leading satellite HD broadcaster. Master control playout automation and multi-camera live OB production.",
    logoUrl: "",
    contactPerson: "Chief Engineer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_m_star",
    name: "M-Star",
    company: "M-Star Cable Network",
    email: "info@mstar.com.np",
    phone: "+977 1 4220033",
    address: "Kathmandu, Nepal",
    website: "",
    industry: "Cable & Digital Distribution",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Digital CATV distribution headend and IP stream transcoding equipment.",
    logoUrl: "",
    contactPerson: "Technical Operations",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_kanchan_sky",
    name: "Kanchan Sky",
    company: "Kanchan Sky Network",
    email: "support@kanchansky.com.np",
    phone: "+977 71 540000",
    address: "Butwal / Lumbini, Nepal",
    website: "",
    industry: "DVB & Network Provider",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "DVB-C headend systems, regional optical transport ring, and subscriber conditional access management.",
    logoUrl: "",
    contactPerson: "Operations Manager",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_earth_news",
    name: "Earth News",
    company: "Earth News Media House",
    email: "editorial@earthnews.com.np",
    phone: "+977 1 4780123",
    address: "Kathmandu, Nepal",
    website: "",
    industry: "News & Media House",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Digital newsroom computer systems, live web stream encoders, and automated video clip production.",
    logoUrl: "",
    contactPerson: "Managing Editor",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_fewa_hd",
    name: "Fewa HD",
    company: "Fewa Television Pvt. Ltd.",
    email: "engineering@fewatv.com.np",
    phone: "+977 61 522333",
    address: "Pokhara, Gandaki, Nepal",
    website: "",
    industry: "Television & Live Production",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Studio lighting, multi-format vision mixers, and wireless camera links for live sports and cultural broadcasts.",
    logoUrl: "",
    contactPerson: "Technical Head",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_laxmi_tv",
    name: "Laxmi TV",
    company: "Laxmi Media Network",
    email: "info@laxmitv.com.np",
    phone: "+977 1 5544332",
    address: "Lalitpur, Nepal",
    website: "",
    industry: "Broadcasting Channel",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "High-definition playout automation and terrestrial microwave links.",
    logoUrl: "",
    contactPerson: "Program Director",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_dristi_pathshala",
    name: "Dristi Pathshala",
    company: "Dristi Educational Media",
    email: "info@dristipathshala.edu.np",
    phone: "+977 1 4332211",
    address: "Kathmandu, Nepal",
    website: "",
    industry: "Educational Institution",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Smart digital classroom studios, live interactive lecture broadcasting, and campus AV infrastructure.",
    logoUrl: "",
    contactPerson: "Principal / Coordinator",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_shree_ram_school",
    name: "Shree Ram Secondary School",
    company: "Shree Ram Secondary School",
    email: "admin@shreeram.edu.np",
    phone: "+977 1 4256789",
    address: "Bagmati Province, Nepal",
    website: "",
    industry: "Public Educational System",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Campus IT networking, audio announcement systems, and digital interactive learning setups.",
    logoUrl: "",
    contactPerson: "Headmaster",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_appan_tv",
    name: "Appan TV",
    company: "Appan Television Network",
    email: "broadcast@appantv.com.np",
    phone: "+977 41 520111",
    address: "Janakpurdham, Madhesh, Nepal",
    website: "",
    industry: "Regional Broadcast Network",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Maithili regional broadcast television station with local news production studio and STL microwave transmitter.",
    logoUrl: "",
    contactPerson: "Station Incharge",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli_kisan_net",
    name: "Kisan Net",
    company: "Kisan Network Pvt. Ltd.",
    email: "noc@kisannet.com.np",
    phone: "+977 1 5908877",
    address: "Nepal",
    website: "",
    industry: "Telecom & Internet Service Provider",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Fiber-to-the-home (FTTH) network infrastructure, optical splitters, and customer broadband provisioning.",
    logoUrl: "",
    contactPerson: "NOC Lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Real Technology Partners / Vendors from Simulcast Website
const SEED_VENDORS: VendorItem[] = [
  {
    id: "ven_blackmagic_design",
    name: "Blackmagic Design",
    category: "Hardware Partner",
    contactPerson: "APAC Distribution",
    email: "apac-sales@blackmagicdesign.com",
    phone: "+61 3 9682 4770",
    address: "Port Melbourne, Victoria, Australia",
    website: "https://www.blackmagicdesign.com",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Broadcast reference cameras, ATEM live production switchers, Smart Videohub routing matrices, and Teranex format converters.",
    paymentTerms: "Net 30",
    logoUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven_feelworld",
    name: "Feelworld",
    category: "Monitoring",
    contactPerson: "Global Sales Team",
    email: "sales@feelworld.cn",
    phone: "+86 596 2672627",
    address: "Zhangzhou, Fujian, China",
    website: "https://feelworld.ltd",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Broadcast rackmount SDI/HDMI reference monitors, wireless video transmission links, and on-camera field monitors.",
    paymentTerms: "Net 30",
    logoUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven_avmatrix",
    name: "AVMATRIX",
    category: "Conversion & Routing",
    contactPerson: "Technical Sales",
    email: "sales@avmatrix.com",
    phone: "+86 592 5718619",
    address: "Xiamen, Fujian, China",
    website: "https://www.avmatrix.com",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "Modular signal converters, optical fiber transceivers, multi-viewers, and SDI distribution amplifiers.",
    paymentTerms: "Net 30",
    logoUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven_yololiv",
    name: "YoloLiv",
    category: "Streaming Systems",
    contactPerson: "Enterprise Accounts",
    email: "contact@yololiv.com",
    phone: "+1 888 888 8888",
    address: "Hangzhou, Zhejiang, China",
    website: "https://www.yololiv.com",
    status: "ACTIVE",
    showOnWebsite: true,
    notes: "YoloBox Pro / Ultra all-in-one live streaming video switchers, multi-cam cellular bonding, and direct RTMP encoders.",
    paymentTerms: "Net 30",
    logoUrl: "",
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

export async function getWebsiteBrands(): Promise<string[]> {
  const clients = await getClients();
  const vendors = await getVendors();

  const activeClients = clients
    .filter((c) => c.status === "ACTIVE" && c.showOnWebsite !== false)
    .map((c) => (c.name || c.company).toUpperCase().trim());

  const activeVendors = vendors
    .filter((v) => v.status === "ACTIVE" && v.showOnWebsite !== false)
    .map((v) => v.name.toUpperCase().trim());

  const merged = Array.from(new Set([...activeVendors, ...activeClients]));
  return merged.length > 0
    ? merged
    : [
        "BLACKMAGIC DESIGN",
        "TV TODAY",
        "FEELWORLD",
        "AP1 HD",
        "AVMATRIX",
        "M-STAR",
        "YOLOLIV",
        "KANCHAN SKY",
        "EARTH NEWS",
        "FEWA HD",
        "LAXMI TV",
        "DRISTI PATHSHALA",
        "SHREE RAM SECONDARY SCHOOL",
        "APPAN TV",
        "KISAN NET",
      ];
}
