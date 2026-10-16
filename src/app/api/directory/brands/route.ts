import { NextResponse } from "next/server";
import { getWebsiteBrands } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await getWebsiteBrands();
    return NextResponse.json({ brands });
  } catch {
    return NextResponse.json({
      brands: [
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
      ],
    });
  }
}
