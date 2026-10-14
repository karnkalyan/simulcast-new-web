import Link from "next/link";
import {prisma} from "@/lib/db";
import {getSession} from "@/lib/auth";
import {ArrowUpRight,Layers3,FolderKanban,MessageSquareText,NotebookText,Globe2,Plus} from "lucide-react";
export const metadata={title:"Admin Dashboard | Simulcast"};
export default async function Dashboard(){
  const user=await getSession();
  let stats={services:0,projects:0,posts:0,inquiries:0,chats:0,escalated:0};
  let recent:{id:string;name:string;interest:string;createdAt:Date;status:string}[]=[];
  let dbStatus="connected";
  try{
    const [services,projects,posts,inquiries,chats,escalated,r]=await Promise.all([
      prisma.service.count(),
      prisma.project.count(),
      prisma.post.count(),
      prisma.inquiry.count(),
      prisma.chatSession.count().catch(()=>0),
      prisma.chatSession.count({where:{status:"ESCALATED_HUMAN"}}).catch(()=>0),
      prisma.inquiry.findMany({take:6,orderBy:{createdAt:"desc"},select:{id:true,name:true,interest:true,createdAt:true,status:true}})
    ]);
    stats={services,projects,posts,inquiries,chats,escalated};
    recent=r;
  }catch{
    dbStatus="unavailable";
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <div className="eyebrow">ADMIN DASHBOARD / OVERVIEW</div>
          <h1>Welcome back<span className="admin-pink">.</span></h1>
          <p>Manage the Simulcast web presence, live chats, brand styling and MCP integrations from one workspace.</p>
        </div>
        <Link href="/" className="btn btn-dark" target="_blank">Preview website <ArrowUpRight size={16}/></Link>
      </div>

      <div className="admin-welcome">
        <div>
          <span className="eyebrow">WEBSITE & LIVE ASSISTANT STATUS</span>
          <h2>Build. Connect. Advance.</h2>
          <p>Unified engineering platform: content, brand themes, WebSocket server, and customer chat.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {stats.escalated > 0 && (
            <Link
              href="/admin/chat"
              style={{
                background: '#e11d72',
                color: '#ffffff',
                padding: '9px 15px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 0 12px rgba(225, 29, 114, 0.5)'
              }}
            >
              ⚠ {stats.escalated} Escalated Chat{stats.escalated > 1 ? 's' : ''} Pending
            </Link>
          )}
          <span className="admin-site-status"><i/> {dbStatus==="connected"?"Database connected":"Database unavailable"}</span>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          {label:"Services",count:stats.services,icon:Layers3,href:"/admin/services"},
          {label:"Projects",count:stats.projects,icon:FolderKanban,href:"/admin/projects"},
          {label:"Insights",count:stats.posts,icon:NotebookText,href:"/admin/posts"},
          {label:"Inquiries",count:stats.inquiries,icon:MessageSquareText,href:"/admin/inquiries"},
          {label:"Live Chats",count:stats.chats,icon:MessageSquareText,href:"/admin/chat",badge:stats.escalated > 0 ? `${stats.escalated} live` : undefined}
        ].map(s=>(
          <Link className="admin-stat" key={s.label} href={s.href}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>{s.label}</span>
              {s.badge && (
                <span style={{ background: '#e11d72', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>
                  {s.badge}
                </span>
              )}
            </div>
            <s.icon size={21}/>
            <strong>{s.count.toString().padStart(2,"0")}</strong>
            <small>Manage {s.label.toLowerCase()} <ArrowUpRight size={14}/></small>
          </Link>
        ))}
      </div>

      <div className="admin-dashboard-columns">
        <div className="admin-box">
          <div className="admin-box-head">
            <h3>Recent enquiries</h3>
            <Link href="/admin/inquiries">View all →</Link>
          </div>
          {recent.length ? (
            <div className="admin-recent">
              {recent.map(r=>(
                <Link href="/admin/inquiries" key={r.id}>
                  <div>
                    <strong>{r.name}</strong>
                    <small>{r.interest||"General enquiry"}</small>
                  </div>
                  <span>{r.status.replaceAll("_"," ")}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="admin-empty">No enquiries yet. New website enquiries will appear here.</div>
          )}
        </div>

        <div className="admin-box">
          <div className="admin-box-head">
            <h3>Quick actions & tools</h3>
          </div>
          <div className="admin-quick">
            {[
              {h:"/admin/chat",label:"Manage live chat sessions & human requests"},
              {h:"/admin/theme",label:"Customize brand colors, hero text & CSS"},
              {h:"/admin/mcp",label:"MCP tokens & WebSocket configuration"},
              {h:"/admin/services",label:"Edit solutions"},
              {h:"/admin/projects",label:"Add a project showcase"},
              {h:"/admin/posts",label:"Write an insight"},
              {h:"/admin/media",label:"Upload an image to media library"},
              ...(user?.role==="ADMIN"?[{h:"/admin/settings",label:"Update company contact info"}]:[])
            ].map(x=>(
              <Link href={x.h} key={x.h}><Plus size={17}/>{x.label}<ArrowUpRight size={16}/></Link>
            ))}
          </div>
          <p className="admin-connection"><Globe2 size={16}/> Public site: www.simulcast.com.np · Port 3000 Unified</p>
        </div>
      </div>
    </>
  );
}
