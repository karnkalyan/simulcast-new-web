'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers3,
  FolderKanban,
  NotebookText,
  MessagesSquare,
  Image as ImageIcon,
  Settings,
  Users,
  MessageCircle,
  Palette,
  KeyRound,
  Route as RouteIcon,
  Mail,
  ShieldCheck,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size: number }>> = {
  Overview: LayoutDashboard,
  'Live Chat': MessageCircle,
  'Custom Routes': RouteIcon,
  Services: Layers3,
  Projects: FolderKanban,
  Insights: NotebookText,
  Inquiries: MessagesSquare,
  'Media Library': ImageIcon,
  'Email & Queue': Mail,
  'Brand & Themes': Palette,
  'MCP & Security': KeyRound,
  'Audit Logs': ShieldCheck,
  'Site Settings': Settings,
  'Admin Users': Users,
};

interface AdminNavProps {
  items: Array<{ l: string; href: string }>;
  escalatedCount?: number;
}

export default function AdminNav({ items, escalatedCount = 0 }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="admin-menu" aria-label="Admin navigation">
      {items.map(item => {
        const Icon = iconMap[item.l] || LayoutDashboard;
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

        const isLiveChat = item.l === 'Live Chat';

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item ${isActive ? 'admin-nav-active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              color: isActive ? '#ffffff' : '#c8b6d3',
              background: isActive
                ? 'linear-gradient(90deg, rgba(225, 29, 114, 0.28) 0%, rgba(43, 13, 58, 0.6) 100%)'
                : 'transparent',
              borderLeft: isActive ? '3px solid #e11d72' : '3px solid transparent',
            }}
          >
            <Icon size={18} />
            <span style={{ flex: 1 }}>{item.l}</span>
            {isLiveChat && escalatedCount > 0 && (
              <span
                style={{
                  background: '#e11d72',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 999,
                  boxShadow: '0 0 10px rgba(225, 29, 114, 0.6)',
                }}
              >
                {escalatedCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
