import { useState, type ReactNode } from "react";
import { ArrowLeft, Bell, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "./Brand";

type AppUser = { name?: string | null; email?: string | null; role: string };
export type DashboardNavItem = { id: string; label: string; icon: ReactNode; group: string };

type DashboardFrameProps = {
  user: AppUser;
  items: DashboardNavItem[];
  active: string;
  title: string;
  admin?: boolean;
  onNavigate: (id: string) => void;
  onSignOut: () => void;
  children: ReactNode;
};

export default function DashboardFrame({ user, items, active, title, admin = false, onNavigate, onSignOut, children }: DashboardFrameProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const name = user.name?.trim() || user.email?.split("@")[0] || "Owner";
  const initial = name.charAt(0).toUpperCase();
  const groups = Array.from(new Set(items.map(item => item.group)));
  const visit = (id: string) => { onNavigate(id); setMobileOpen(false); };
  const close = () => setMobileOpen(false);
  return <div className="dashboard-root">
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={close} />}
    <aside className={`dashboard-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand-row"><BrandMark /><button className="icon-button sidebar-close" type="button" onClick={close} aria-label="Close menu"><X size={16} /></button></div>
      <div className="sidebar-label">{admin ? "WESTARA / OPERATIONS" : "YOUR WESTARA"}</div>
      {groups.map(group => <div className="sidebar-group" key={group}>
        <div className="sidebar-label">{group}</div>
        <nav className="sidebar-nav" aria-label={`${group} navigation`}>
          {items.filter(item => item.group === group).map(item => <button type="button" key={item.id} className={active === item.id ? "active" : ""} onClick={() => visit(item.id)} aria-current={active === item.id ? "page" : undefined}>{item.icon}<span>{item.label}</span></button>)}
        </nav>
      </div>)}
      <div className="sidebar-bottom">
        <nav className="sidebar-nav">
          {user.role === "admin" && <Link href={admin ? "/app" : "/admin"} onClick={close}><ShieldCheck size={15} /><span>{admin ? "Owner dashboard" : "Administration"}</span></Link>}
          <Link href="/" onClick={close}><ArrowLeft size={15} /><span>Back to Westara</span></Link>
          <button type="button" onClick={onSignOut}><LogOut size={15} /><span>Sign out</span></button>
        </nav>
        <div className="sidebar-user"><span className="user-avatar">{initial}</span><div><strong>{name}</strong><span>{admin ? "Administrator" : "Owner account"}</span></div><Bell size={14} /></div>
      </div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-topbar">
        <button className="icon-button mobile-nav-toggle" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={17} /></button>
        <span className="topbar-title">{title}</span>
        <div className="topbar-tools"><span className="mono eyebrow topbar-context">{admin ? "OPERATIONS CONSOLE" : "OWNER SPACE"}</span><span className="user-chip"><span className="user-avatar">{initial}</span><span>{name}</span></span></div>
      </header>
      <main className="dashboard-content">{children}</main>
    </div>
  </div>;
}
