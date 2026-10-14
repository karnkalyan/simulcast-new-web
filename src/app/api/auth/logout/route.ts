import {NextResponse} from "next/server";
import {COOKIE_NAME,sameOrigin} from "@/lib/auth";
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:"Invalid origin"},{status:403});const r=NextResponse.json({ok:true});r.cookies.set(COOKIE_NAME,"",{maxAge:0,path:"/",httpOnly:true});return r}
