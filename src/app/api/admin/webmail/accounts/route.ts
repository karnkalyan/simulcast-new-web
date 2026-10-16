import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getMailAccounts, saveMailAccount, deleteMailAccount } from "@/lib/webmail";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const accounts = await getMailAccounts();
    return NextResponse.json({ accounts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body.email || !body.name) {
      return NextResponse.json({ error: "Email and Display Name are required." }, { status: 400 });
    }
    const account = await saveMailAccount(body);
    return NextResponse.json({ success: true, account });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }
    const res = await deleteMailAccount(id);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
