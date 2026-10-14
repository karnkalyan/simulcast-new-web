import {getSession,sameOrigin} from "@/lib/auth";
import {prisma} from "@/lib/db";
import {NextResponse} from "next/server";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
export const runtime="nodejs";
export async function GET(){if(!await getSession())return NextResponse.json({error:"Unauthorized"},{status:401});try{return NextResponse.json(await prisma.mediaAsset.findMany({orderBy:{createdAt:"desc"}}))}catch{return NextResponse.json({error:"Media unavailable"},{status:503})}}
export async function POST(req:Request){if(!await getSession())return NextResponse.json({error:"Unauthorized"},{status:401});if(!sameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});try{
 const form=await req.formData();const f=form.get("file");if(!(f instanceof File))return NextResponse.json({error:"Choose an image file"},{status:400});
 const formats:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/avif":"avif"};const ext=formats[f.type];if(!ext||f.size>6*1024*1024||f.size<100)return NextResponse.json({error:"PNG, JPG, WEBP, AVIF only; max 6 MB"},{status:400});
 const buf=Buffer.from(await f.arrayBuffer());const signatures={png:buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpg:buf[0]===255&&buf[1]===216,webp:buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP',avif:buf.toString('ascii',4,12).includes('ftypavif')||buf.toString('ascii',4,16).includes('ftypavis')};if(!signatures[ext as keyof typeof signatures])return NextResponse.json({error:"Invalid file contents"},{status:400});
 const filename=`${randomUUID()}.${ext}`;const folder=path.join(process.cwd(),"public","uploads");await mkdir(folder,{recursive:true});await writeFile(path.join(folder,filename),buf,{flag:"wx"});const record=await prisma.mediaAsset.create({data:{filename:f.name.slice(0,191),path:`/uploads/${filename}`,mimeType:f.type,size:f.size,alt:String(form.get("alt")||"").slice(0,255)}});return NextResponse.json(record,{status:201});
 }catch{return NextResponse.json({error:"Upload failed; ensure upload storage and database are writable."},{status:500})}}
