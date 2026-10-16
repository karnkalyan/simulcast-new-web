import {notFound} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import AdminCollection from "@/components/admin/AdminCollection";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminMedia from "@/components/admin/AdminMedia";
import AdminChat from "@/components/admin/AdminChat";
import AdminTheme from "@/components/admin/AdminTheme";
import AdminMcp from "@/components/admin/AdminMcp";
import AdminCustomRoutes from "@/components/admin/AdminCustomRoutes";
import AdminEmailQueue from "@/components/admin/AdminEmailQueue";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";

export const dynamic="force-dynamic";

export default async function Section({params}:{params:Promise<{section:string}>}){
  const {section}=await params;
  const user=await requireAdmin();

  if(section==="chat") return <AdminChat/>;
  if(section==="custom-routes"||section==="routes") return <AdminCustomRoutes/>;
  if(section==="email"||section==="email-queue"||section==="emails") return <AdminEmailQueue/>;
  if(section==="audit"||section==="audit-logs"){
    if(user.role!=="ADMIN") notFound();
    return <AdminAuditLogs/>;
  }
  if(section==="theme"){
    if(user.role!=="ADMIN") notFound();
    return <AdminTheme/>;
  }
  if(section==="mcp"){
    if(user.role!=="ADMIN") notFound();
    return <AdminMcp/>;
  }
  if(section==="settings"){
    if(user.role!=="ADMIN") notFound();
    return <AdminSettings/>;
  }
  if(section==="media") return <AdminMedia/>;
  if(!["services","projects","posts","inquiries","users"].includes(section)) notFound();
  if(section==="users"&&user.role!=="ADMIN") notFound();
  return <AdminCollection entity={section as "services"|"projects"|"posts"|"inquiries"|"users"}/>;
}
