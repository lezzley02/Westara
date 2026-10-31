import { ArrowUpRight, BatteryCharging, Bell, CarFront, CircleHelp, MapPin, Wrench, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import StatusPill from "@/components/StatusPill";

type Props = { name: string; onNavigate: (section: string) => void };
const quickActions = [
  { id: "assistance", title: "Roadside assistance", note: "Request help", icon: <CircleHelp size={19} /> },
  { id: "charging", title: "Find charging", note: "Sample station data", icon: <Zap size={19} /> },
  { id: "rentals", title: "EV rentals", note: "Submit a request", icon: <CarFront size={19} /> },
  { id: "maintenance", title: "Vehicle care", note: "Book a service request", icon: <Wrench size={19} /> },
];

export default function CustomerOverview({ name, onNavigate }: Props) {
  const query = trpc.customer.dashboard.useQuery();
  const data = query.data;
  const requests = data?.requests ?? [];
  const activeRequests = requests.filter(request => !["completed", "cancelled"].includes(request.status));
  return <>
    <div className="page-heading"><div><p className="eyebrow">YOUR OWNERSHIP, AT A GLANCE</p><h1>Good to see you, {name}.</h1><p>Choose a service or pick up where you left off. Your account starts with the information you choose to add.</p></div><button className="button button-outline" type="button" onClick={() => onNavigate("garage")}>My Garage <ArrowUpRight size={14} /></button></div>
    {query.isError && <div className="info-banner"><Bell size={15} /> We could not load account data right now. Your submitted records have not been changed.</div>}
    <div className="dashboard-grid">
      <section className="dash-card welcome-card"><div><span className="eyebrow mono">A CLEARER WAY TO MOVE</span><h2>Your Tesla. Your journey. Covered.</h2><p>Keep requests, vehicle details, and important updates together in one place.</p></div><span className="welcome-symbol">W/</span></section>
      <section className="dash-card metric-card"><CarFront className="metric-icon" size={17} /><span>Vehicles in your garage</span><strong>{query.isLoading ? "—" : (data?.vehicles.length ?? 0)}</strong></section>
      <section className="dash-card metric-card"><BatteryCharging className="metric-icon" size={17} /><span>Active requests</span><strong>{query.isLoading ? "—" : activeRequests.length}</strong></section>
      <div className="quick-actions">{quickActions.map(action => <button className="quick-action" type="button" key={action.id} onClick={() => onNavigate(action.id)}>{action.icon}<div><strong>{action.title}</strong><span>{action.note}</span></div><ArrowUpRight size={13} /></button>)}</div>
      <section className="dash-card requests-card"><div className="card-title-row"><div><span className="eyebrow">IN MOTION</span><h2>Active requests</h2></div><button className="text-link" type="button" onClick={() => onNavigate("requests")}>All requests <ArrowUpRight size={13} /></button></div>
        {query.isLoading ? <p className="form-hint">Loading your requests…</p> : activeRequests.length ? <div className="card-list">{activeRequests.slice(0, 5).map(request => <div className="list-row" key={request.id}><div className="list-row-main"><strong>{request.summary}</strong><p>{request.publicId} · {request.kind}</p></div><StatusPill status={request.status} /></div>)}</div> : <div className="empty-state">No active requests yet.<br />When you submit one, it will appear here.</div>}
      </section>
      <section className="dash-card notifications-card"><div className="card-title-row"><div><span className="eyebrow">LATEST</span><h2>Notifications</h2></div><button className="icon-button" type="button" aria-label="View notifications" onClick={() => onNavigate("notifications")}><ArrowUpRight size={15} /></button></div>
        {query.isLoading ? <p className="form-hint">Loading updates…</p> : data?.notifications.length ? <div className="card-list">{data.notifications.slice(0, 4).map(note => <div className="list-row" key={note.id}><div className="list-row-main"><strong>{note.title}</strong><p>{note.body}</p></div><span className={`notification-mark ${note.readAt ? "read" : ""}`} /></div>)}</div> : <div className="empty-state">Updates from your requests will appear here.</div>}
      </section>
      <section className="dash-card vehicle-card"><div className="card-title-row"><div><span className="eyebrow">YOUR GARAGE</span><h2>Vehicle information</h2></div><button className="icon-button" type="button" aria-label="Manage garage" onClick={() => onNavigate("garage")}><ArrowUpRight size={15} /></button></div>
        {data?.vehicles.length ? data.vehicles.slice(0, 3).map(vehicle => <div className="list-row" key={vehicle.id}><div className="list-row-main"><strong>{vehicle.nickname || vehicle.model}</strong><p>{vehicle.make} · {vehicle.year || "Year not added"}</p></div><CarFront size={15} color="var(--lime)" /></div>) : <div className="empty-state">Add a vehicle to keep ownership details together.</div>}
      </section>
      <section className="dash-card vehicle-card"><div className="card-title-row"><div><span className="eyebrow">PLANNING</span><h2>Trip planning</h2></div><MapPin size={16} color="var(--lime)" /></div><p className="form-hint">Route estimates appear when a supported map provider is available. Charging markers are labeled sample data until verified provider information is connected.</p><button className="text-link" type="button" onClick={() => onNavigate("trips")}>Plan a journey <ArrowUpRight size={13} /></button></section>
    </div>
  </>;
}
