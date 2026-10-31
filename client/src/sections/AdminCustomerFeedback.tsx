import { useState, type FormEvent } from "react";
import { Search, Star } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import StatusPill from "@/components/StatusPill";

export function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const customers = trpc.admin.customers.useQuery({ search: search || undefined });
  const detail = trpc.admin.customerDetail.useQuery({ userId: selectedId ?? 0 }, { enabled: Boolean(selectedId) });
  return <>
    <div className="page-heading"><div><p className="eyebrow">CUSTOMER RECORDS</p><h1>Customers</h1><p>View registered customers, their profile details, garage, and submitted requests.</p></div></div>
    <div className="filter-row"><div className="search-wrap"><Search size={14} /><input className="input-field" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, email, or city" aria-label="Search customers" /></div><span className="eyebrow">{customers.data?.length ?? 0} SHOWN</span></div>
    <div className="admin-customer-layout"><section className="dash-card"><div className="card-title-row"><div><span className="eyebrow">REGISTERED ACCOUNTS</span><h2>Customers</h2></div></div>{customers.isLoading ? <p className="form-hint">Loading customers…</p> : customers.data?.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>City</th><th>Joined</th></tr></thead><tbody>{customers.data.map(customer => <tr key={customer.id} onClick={() => setSelectedId(customer.id)} className={selectedId === customer.id ? "selected-row" : ""}><td>{customer.name || "Name not provided"}</td><td>{customer.email || "—"}</td><td>{customer.city || "—"}</td><td>{new Date(customer.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="empty-state">No customer accounts have been registered yet.</div>}</section>
      <section className="dash-card"><div className="card-title-row"><div><span className="eyebrow">CUSTOMER DETAIL</span><h2>{detail.data?.customer.name || "Select a customer"}</h2></div></div>{detail.data ? <><div className="customer-facts"><span>{detail.data.customer.email || "Email not provided"}</span><span>{detail.data.customer.phone || "Phone not provided"}</span><span>{detail.data.customer.city || "City not provided"}</span><small>Registered {new Date(detail.data.customer.createdAt).toLocaleDateString()}</small></div><div className="card-subsection"><span className="eyebrow">GARAGE · {detail.data.vehicles.length}</span>{detail.data.vehicles.length ? detail.data.vehicles.map(vehicle => <p key={vehicle.id}>{vehicle.nickname || vehicle.model} · {vehicle.make} {vehicle.year || ""}</p>) : <p className="form-hint">No vehicles added.</p>}</div><div className="card-subsection"><span className="eyebrow">REQUESTS · {detail.data.requests.length}</span>{detail.data.requests.length ? detail.data.requests.slice(0, 6).map(request => <div className="customer-request-summary" key={request.id}><span>{request.summary}<small>{request.publicId}</small></span><StatusPill status={request.status} /></div>) : <p className="form-hint">No requests submitted.</p>}</div></> : <div className="empty-state">Select a customer record to review their account activity.</div>}</section></div>
  </>;
}

export function AdminFeedback() {
  const entries = trpc.admin.feedback.useQuery();
  const utils = trpc.useUtils();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const reply = trpc.admin.replyToFeedback.useMutation({ onSuccess: async () => { await utils.admin.feedback.invalidate(); await utils.customer.feedback.invalidate(); toast.success("Reply sent and customer notified"); }, onError: error => toast.error("Could not reply", { description: error.message }) });
  const submit = (event: FormEvent, id: number) => { event.preventDefault(); const body = drafts[id]?.trim(); if (body) reply.mutate({ feedbackId: id, body }); };
  return <>
    <div className="page-heading"><div><p className="eyebrow">CUSTOMER VOICE</p><h1>Feedback</h1><p>Review ratings and comments submitted by real customer accounts. Replies create an in-app notification.</p></div></div>
    {entries.isLoading ? <div className="dash-card"><p className="form-hint">Loading feedback…</p></div> : entries.data?.length ? <div className="feedback-admin-grid">{entries.data.map(({ entry, customerName, customerEmail }) => <article className="dash-card feedback-admin-card" key={entry.id}><div className="feedback-customer-line"><div><span className="eyebrow">{customerName || customerEmail || "CUSTOMER"}</span><small>{new Date(entry.createdAt).toLocaleString()}</small></div><div className="rating-stars">{Array.from({ length: entry.rating }, (_, index) => <Star size={12} fill="currentColor" key={index} />)}</div></div><p className="feedback-admin-body">{entry.body || "Rating submitted without a comment."}</p>{entry.adminReply && <div className="feedback-reply"><span className="eyebrow">CURRENT REPLY</span><p>{entry.adminReply}</p></div>}<form className="thread-reply-form" onSubmit={event => submit(event, entry.id)}><textarea className="textarea-field" value={drafts[entry.id] ?? entry.adminReply ?? ""} onChange={event => setDrafts(value => ({ ...value, [entry.id]: event.target.value }))} required maxLength={4000} placeholder="Write a customer-visible reply…" /><button className="button button-lime" type="submit" disabled={reply.isPending}>{entry.adminReply ? "Update reply" : "Reply & notify"}</button></form></article>)}</div> : <div className="dash-card"><div className="empty-state">No customer feedback has been recorded yet.</div></div>}
  </>;
}
