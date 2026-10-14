import { prisma } from "@/lib/db";
import { inquirySchema } from "@/lib/validators";
import { NextResponse } from "next/server";
const recent=new Map<string,{n:number,t:number}>();
export async function submitInquiry(req:Request){
  const len=Number(req.headers.get("content-length")||0);if(len>12000)return NextResponse.json({error:"Request too large"},{status:413});
  const contentType=req.headers.get("content-type")||"";if(!contentType.includes("application/json"))return NextResponse.json({error:"JSON required"},{status:415});
  const ip=(req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
  const now=Date.now();const old=recent.get(ip);if(old && now-old.t<60000 && old.n>=4)return NextResponse.json({error:"Please try again shortly."},{status:429});
  recent.set(ip,{n:old&&now-old.t<60000?old.n+1:1,t:now});if(recent.size>4000)recent.clear();
  let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
  const parsed=inquirySchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Please check the form fields.",details:parsed.error.flatten()},{status:400});
  if(parsed.data.website)return NextResponse.json({ok:true});
  const {name,email,organization,phone,interest,message,timeline,preferredContact}=parsed.data;
  try{await prisma.inquiry.create({data:{name,email,organization,phone,interest,message,internalNotes:`Timeline: ${timeline}\nPreferred contact: ${preferredContact}\nConsent: yes`}});return NextResponse.json({ok:true,message:"Your inquiry has been received."},{status:201})}
  catch{ return NextResponse.json({error:"Inquiry service is temporarily unavailable. Please try again later."},{status:503}) }
}
