import { cookies } from "next/headers";
import { SignJWT,jwtVerify } from "jose";
import { redirect } from "next/navigation";
export const COOKIE_NAME = "simulcast_admin";
const getSecret=()=>{const val=process.env.AUTH_SECRET; if(!val||val.length<40)throw new Error("A strong AUTH_SECRET is required");return new TextEncoder().encode(val)};
export type Session={sub:string;email:string;role:"ADMIN"|"EDITOR"};
export async function makeToken(session:Session) {return new SignJWT({email:session.email,role:session.role}).setProtectedHeader({alg:"HS256"}).setSubject(session.sub).setIssuedAt().setExpirationTime("8h").sign(getSecret())}
export async function getSession():Promise<Session|null>{const token=(await cookies()).get(COOKIE_NAME)?.value;if(!token)return null;try{const {payload}=await jwtVerify(token,getSecret(),{algorithms:["HS256"]});if(typeof payload.sub!=="string"||typeof payload.email!=="string"||(payload.role!=="ADMIN"&&payload.role!=="EDITOR"))return null;return {sub:payload.sub,email:payload.email,role:payload.role}}catch{return null}}
export async function requireAdmin(){const user=await getSession();if(!user)redirect("/admin/login");return user}
export function sameOrigin(request:Request){
  const origin=request.headers.get("origin");
  if(!origin)return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(request.url).host;
    const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (originHost === requestHost) return true;
    if (hostHeader && originHost === hostHeader) return true;
    const isLocalOrigin = originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1");
    const isLocalReq = requestHost.startsWith("localhost") || requestHost.startsWith("127.0.0.1") || requestHost.startsWith("0.0.0.0");
    if (isLocalOrigin && isLocalReq) return true;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      try {
        if (originHost === new URL(process.env.NEXT_PUBLIC_SITE_URL).host) return true;
      } catch {}
    }
    return false;
  }catch{return false}
}
