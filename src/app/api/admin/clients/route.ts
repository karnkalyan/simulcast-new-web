import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClients, saveClient, deleteClient } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const industry = searchParams.get("industry") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const clients = await getClients({ status, industry, search });
    return NextResponse.json({ clients });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load clients";
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
    const { name, company, email, phone, address, website, industry, status, notes, logoUrl, contactPerson, id } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Client name and email are required." }, { status: 400 });
    }

    const client = await saveClient({
      id,
      name,
      company: company || name,
      email,
      phone,
      address,
      website,
      industry,
      status,
      notes,
      logoUrl,
      contactPerson,
    });

    return NextResponse.json({ ok: true, client });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save client";
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
    if (!id) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const res = await deleteClient(id);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete client";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
