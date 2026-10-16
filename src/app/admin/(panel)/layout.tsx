import {requireAdmin} from "@/lib/auth";
import Link from "next/link";
import {ExternalLink} from "lucide-react";
import AdminLogout from "@/components/admin/AdminLogout";
import AdminNav from "@/components/admin/AdminNav";
import ToastProvider from "@/components/ToastProvider";
import {prisma} from "@/lib/db";

export const dynamic="force-dynamic";

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const user=await requireAdmin();
  const escalatedCount = await prisma.chatSession.count({
    where: { status: "ESCALATED_HUMAN" }
  }).catch(() => 0);

  const items=[
    {l:"Overview",href:"/admin"},
    {l:"Live Chat",href:"/admin/chat"},
    {l:"Services",href:"/admin/services"},
    {l:"Projects",href:"/admin/projects"},
    {l:"Insights",href:"/admin/posts"},
    {l:"Inquiries",href:"/admin/inquiries"},
    {l:"Clients & Vendors",href:"/admin/clients-vendors"},
    {l:"Media Library",href:"/admin/media"},
    {l:"Social Media Hub",href:"/admin/social"},
    {l:"Email & Queue",href:"/admin/email"},
    {l:"Custom Routes",href:"/admin/custom-routes"},
    ...(user.role==="ADMIN"?[
      {l:"Brand & Themes",href:"/admin/theme"},
      {l:"MCP & Security",href:"/admin/mcp"},
      {l:"Audit Logs",href:"/admin/audit"},
      {l:"Site Settings",href:"/admin/settings"},
      {l:"Admin Users",href:"/admin/users"}
    ]:[])
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/media/logo-mark.png" alt=""/>
          <div>
            <strong>SIMULCAST</strong>
            <small>CONTENT STUDIO</small>
          </div>
        </div>
        <div className="admin-side-label">WORKSPACE</div>
        <AdminNav items={items} escalatedCount={escalatedCount} />
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank"><ExternalLink size={17}/> Visit website</Link>
          <AdminLogout/>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-status-dot"/> WEBSITE / CONTENT MANAGEMENT</div>
          <div className="admin-user">
            <span>{user.email}</span>
            <span className="admin-avatar">{user.email[0]?.toUpperCase()}</span>
          </div>
        </header>
        <div className="admin-content">
          <ToastProvider />
          {children}
        </div>
      </div>
    </div>
  );
}
