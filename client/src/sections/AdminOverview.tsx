import { Activity, CheckCircle2, Clock3, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import StatusPill from "@/components/StatusPill";

export default function AdminOverview() {
  const query = trpc.admin.overview.useQuery();
  const data = query.data;
  return <>
    <div className="page-heading"><div><p className="eyebrow">WESTARA OPERATIONS</p><h1>Overview</h1><p>Live counts from Westara's database. No sample customer or activity records are inserted.</p></div></div>
    {query.isError && <div className="info-banner"><Activity size={15} /> Administrator data could not be loaded. No records have been changed.</div>}
    <div className="admin-stats">
      <div className="admin-stat"><span>Registered users</span><strong>{query.isLoading ? "—" : data?.totalUsers ?? 0}</strong><small><Users size={12} /> Database total</small></div>
      <div className="admin-stat"><span>New requests</span><strong>{query.isLoading ? "—" : data?.newRequests ?? 0}</strong><small><Activity size={12} /> Awaiting review</small></div>
      <div className="admin-stat"><span>Pending requests</span><strong>{query.isLoading ? "—" : data?.pendingRequests ?? 0}</strong><small><Clock3 size={12} /> Customer-submitted</small></div>
      <div className="admin-stat"><span>Completed requests</span><strong>{query.isLoading ? "—" : data?.completedRequests ?? 0}</strong><small><CheckCircle2 size={12} /> Marked complete</small></div>
    </div>
    <div className="admin-main-grid"><section className="dash-card"><div className="card-title-row"><div><span className="eyebrow">LATEST RECORDS</span><h2>Recent request activity</h2></div><span className="eyebrow">{data?.totalRequests ?? 0} TOTAL REQUESTS</span></div>
      {query.isLoading ? <p className="form-hint">Loading activity…</p> : data?.recentActivity.length ? <div className="card-list">{data.recentActivity.map(row => <div className="list-row" key={row.id}><div className="list-row-main"><strong>{row.summary}</strong><p>{row.publicId} · {row.customerName || "Customer"} · {row.kind}</p></div><StatusPill status={row.status} /></div>)}</div> : <div className="empty-state">No customer requests are recorded yet.</div>}
    </section><aside className="dash-card admin-note-card"><span className="eyebrow">SERVICE STATUS</span><h2>Keep the status truthful.</h2><p className="form-hint">A request status records Westara's workflow only. It does not confirm a provider, dispatch, appointment, payment, or vehicle rental unless that integration is separately configured and verified.</p><div className="admin-note-line"><span className="live-dot" /> Admin-only controls are protected server-side</div></aside></div>
  </>;
}
