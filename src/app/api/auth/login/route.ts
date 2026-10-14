import {prisma} from "@/lib/db";
import {COOKIE_NAME,makeToken,sameOrigin} from "@/lib/auth";
import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
const attempts=new Map<string,{count:number,time:number}>();
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
 const ip=(req.headers.get("x-forwarded-for")||"local").split(",")[0].trim(); const now=Date.now();const a=attempts.get(ip);
 if(a&&now-a.time<15*60000&&a.count>=8)return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});
 attempts.set(ip,{count:a&&now-a.time<15*60000?a.count+1:1,time:now});if(attempts.size>2000)attempts.clear();
 let payload:{email?:string;password?:string};try{payload=await req.json()}catch{return NextResponse.json({error:"Invalid request"},{status:400})}
 if(typeof payload.email!=="string"||typeof payload.password!=="string"||payload.email.length>191||payload.password.length>250)return NextResponse.json({error:"Invalid credentials"},{status:401});
 try{const user=await prisma.adminUser.findUnique({where:{email:payload.email.toLowerCase().trim()}});
 if(!user||!user.active||!(await bcrypt.compare(payload.password,user.passwordHash)))return NextResponse.json({error:"Invalid credentials"},{status:401});
 const token=await makeToken({sub:user.id,email:user.email,role:user.role});attempts.delete(ip);
 const response=NextResponse.json({ok:true});response.cookies.set(COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:8*3600});return response;
 }catch{return NextResponse.json({error:"Login unavailable"},{status:503})}
}
