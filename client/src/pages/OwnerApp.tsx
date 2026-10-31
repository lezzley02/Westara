import { useState } from "react";
import { BatteryCharging, Bell, CarFront, CircleHelp, MessageSquareText, Route, Settings2, Sparkles, Wrench, Zap } from "lucide-react";
import DashboardFrame, { type DashboardNavItem } from "@/components/DashboardFrame";
import CustomerOverview from "@/sections/CustomerOverview";
import ServiceRequestPanel from "@/sections/ServiceRequestPanel";
import ChargingFinder from "@/sections/ChargingFinder";
import TripPlanner from "@/sections/TripPlanner";
import CustomerRequests, { CustomerNotifications } from "@/sections/CustomerRequests";
import { FeedbackSection, GarageSection, ProfileSection } from "@/sections/CustomerAccountSections";
import { useAuth } from "@/_core/hooks/useAuth";
import type { User } from "../../../drizzle/schema";
import { toast } from "sonner";

const items: DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: <Settings2 size={15} />, group: "YOUR WESTARA" },
  { id: "assistance", label: "Roadside assistance", icon: <CircleHelp size={15} />, group: "SERVICES" },
  { id: "charging", label: "Charging finder", icon: <Zap size={15} />, group: "SERVICES" },
  { id: "rentals", label: "EV rentals", icon: <CarFront size={15} />, group: "SERVICES" },
  { id: "maintenance", label: "Maintenance & service", icon: <Wrench size={15} />, group: "SERVICES" },
  { id: "trips", label: "Trip planner", icon: <Route size={15} />, group: "SERVICES" },
  { id: "garage", label: "My Garage", icon: <BatteryCharging size={15} />, group: "ACCOUNT" },
  { id: "requests", label: "My Requests", icon: <MessageSquareText size={15} />, group: "ACCOUNT" },
  { id: "notifications", label: "Notifications", icon: <Bell size={15} />, group: "ACCOUNT" },
  { id: "profile", label: "Profile", icon: <Settings2 size={15} />, group: "ACCOUNT" },
  { id: "feedback", label: "Feedback", icon: <Sparkles size={15} />, group: "ACCOUNT" },
];
type Props = { user: User };
export default function OwnerApp({ user }: Props) {
  const [active, setActive] = useState("overview");
  const auth = useAuth();
  const title = items.find(item => item.id === active)?.label ?? "Overview";
  const signOut = () => { void auth.logout().then(() => { window.location.assign("/"); }).catch(error => toast.error("Could not sign out", { description: String(error) })); };
  let content;
  switch (active) {
    case "assistance": content = <ServiceRequestPanel kind="roadside" />; break;
    case "charging": content = <ChargingFinder />; break;
    case "rentals": content = <ServiceRequestPanel kind="rental" />; break;
    case "maintenance": content = <ServiceRequestPanel kind="maintenance" />; break;
    case "trips": content = <TripPlanner />; break;
    case "garage": content = <GarageSection />; break;
    case "requests": content = <CustomerRequests />; break;
    case "notifications": content = <CustomerNotifications />; break;
    case "profile": content = <ProfileSection />; break;
    case "feedback": content = <FeedbackSection />; break;
    default: content = <CustomerOverview name={user.name?.trim() || user.email?.split("@")[0] || "there"} onNavigate={setActive} />;
  }
  return <DashboardFrame user={user} items={items} active={active} title={title} onNavigate={setActive} onSignOut={signOut}>{content}</DashboardFrame>;
}
