import {getSession,sameOrigin} from "@/lib/auth";
import {prisma} from "@/lib/db";
import {settingsSchema} from "@/lib/validators";
import {NextResponse} from "next/server";
export async function GET(){if(!await getSession())return NextResponse.json({error:"Unauthorized"},{status:401});try{return NextResponse.json(await prisma.siteSettings.findUnique({where:{id:"main"}}))}catch{return NextResponse.json({error:"Database unavailable"},{status:503})}}
export async function PUT(req:Request){const u=await getSession();if(!u||u.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});if(!sameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});try{const data=settingsSchema.parse(await req.json());return NextResponse.json(await prisma.siteSettings.upsert({where:{id:"main"},update:data,create:{...data,id:"main"}}))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Validation failed"},{status:400})}}
