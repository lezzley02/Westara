import { useState } from "react";
import { Activity, Bell, ClipboardList, MessageSquareText, Settings, ShieldAlert, Users } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { User } from "../../../drizzle/schema";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardFrame, { type DashboardNavItem } from "@/components/DashboardFrame";
import AdminOverview from "@/sections/AdminOverview";
import AdminRequestManager from "@/sections/AdminRequestManager";
import { AdminCustomers, AdminFeedback } from "@/sections/AdminCustomerFeedback";
import AdminSettings from "@/sections/AdminSettings";

const navItems: DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: <Activity size={15} />, group: "OPERATIONS" },
  { id: "requests", label: "Requests", icon: <ClipboardList size={15} />, group: "OPERATIONS" },
  { id: "customers", label: "Customers", icon: <Users size={15} />, group: "OPERATIONS" },
  { id: "feedback", label: "Feedback", icon: <MessageSquareText size={15} />, group: "OPERATIONS" },
  { id: "settings", label: "Settings", icon: <Settings size={15} />, group: "MANAGE" },
];

type Props = { user: User };
export default function AdminDashboard({ user }: Props) {
  const [active, setActive] = useState("overview");
  const auth = useAuth();
  if (user.role !== "admin") return <main className="access-denied"><section className="access-denied-card"><ShieldAlert size={28} /><h1>Administrator access only.</h1><p>This area is restricted to authorized Westara administrators. Your account remains private and unchanged.</p><Link href="/app" className="button button-lime">Back to your dashboard</Link></section></main>;
  const title = navItems.find(item => item.id === active)?.label ?? "Overview";
  const signOut = () => { void auth.logout().then(() => window.location.assign("/")).catch(error => toast.error("Could not sign out", { description: String(error) })); };
  let content;
  switch (active) {
    case "requests": content = <AdminRequestManager />; break;
    case "customers": content = <AdminCustomers />; break;
    case "feedback": content = <AdminFeedback />; break;
    case "settings": content = <AdminSettings currentUserId={user.id} />; break;
    default: content = <AdminOverview />;
  }
  return <DashboardFrame user={user} items={navItems} active={active} title={title} admin onNavigate={setActive} onSignOut={signOut}>{content}</DashboardFrame>;
}
