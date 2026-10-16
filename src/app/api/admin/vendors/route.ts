import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getVendors, saveVendor, deleteVendor } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const vendors = await getVendors({ status, category, search });
    return NextResponse.json({ vendors });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load vendors";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, contactPerson, email, phone, address, website, status, notes, paymentTerms, logoUrl, id } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Vendor name and email are required." }, { status: 400 });
    }

    const vendor = await saveVendor({
      id,
      name,
      category,
      contactPerson,
      email,
      phone,
      address,
      website,
      status,
      notes,
      paymentTerms,
      logoUrl,
    });

    return NextResponse.json({ ok: true, vendor });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save vendor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });

    const res = await deleteVendor(id);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete vendor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
