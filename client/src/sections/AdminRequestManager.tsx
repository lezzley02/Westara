import { useState, type FormEvent } from "react";
import { ArrowUpRight, MessageSquareText, Send, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import StatusPill from "@/components/StatusPill";

const statuses = ["new", "pending", "assigned", "in_progress", "completed", "cancelled"] as const;
export default function AdminRequestManager() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();
  const query = trpc.admin.requests.useQuery({ search: search || undefined, kind: kind ? kind as "roadside" | "rental" | "maintenance" : undefined, status: status ? status as (typeof statuses)[number] : undefined });
  const teams = trpc.admin.teamMembers.useQuery();
  const detail = trpc.admin.requestDetail.useQuery({ requestId: selectedId ?? 0 }, { enabled: Boolean(selectedId) });
  const refresh = async () => { await Promise.all([utils.admin.requests.invalidate(), utils.admin.requestDetail.invalidate(), utils.admin.overview.invalidate()]); };
  const updateStatus = trpc.admin.setRequestStatus.useMutation({ onSuccess: async () => { await refresh(); toast.success("Request status updated"); }, onError: error => toast.error("Status update failed", { description: error.message }) });
  const assign = trpc.admin.assignRequest.useMutation({ onSuccess: async () => { await refresh(); toast.success("Team assignment updated"); }, onError: error => toast.error("Assignment failed", { description: error.message }) });
  const sendReply = trpc.admin.replyToRequest.useMutation({ onSuccess: async () => { setReply(""); await refresh(); toast.success("Customer reply sent and notification created"); }, onError: error => toast.error("Could not send reply", { description: error.message }) });
  const addNote = trpc.admin.addPrivateNote.useMutation({ onSuccess: async () => { setNote(""); await utils.admin.requestDetail.invalidate(); toast.success("Private note saved"); }, onError: error => toast.error("Could not save note", { description: error.message }) });
  const submitReply = (event: FormEvent) => { event.preventDefault(); if (selectedId && reply.trim()) sendReply.mutate({ requestId: selectedId, body: reply.trim() }); };
  const submitNote = (event: FormEvent) => { event.preventDefault(); if (selectedId && note.trim()) addNote.mutate({ requestId: selectedId, body: note.trim() }); };
  const request = detail.data?.request;
  return <>
    <div className="page-heading"><div><p className="eyebrow">OPERATIONS / REQUESTS</p><h1>Request management</h1><p>Update status, assign a team member, reply to customers, and keep private team notes separate.</p></div></div>
    <div className="filter-row"><input className="input-field" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search request, customer, or ID" aria-label="Search requests" /><select className="select-field" value={kind} onChange={event => setKind(event.target.value)} aria-label="Filter request type"><option value="">All service types</option><option value="roadside">Roadside</option><option value="rental">Rentals</option><option value="maintenance">Maintenance</option></select><select className="select-field" value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter status"><option value="">All statuses</option>{statuses.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></div>
    <div className="admin-requests-layout"><section className="dash-card admin-request-list"><div className="card-title-row"><div><span className="eyebrow">CUSTOMER RECORDS</span><h2>Requests</h2></div><span className="eyebrow">{query.data?.length ?? 0} SHOWN</span></div>
      {query.isLoading ? <p className="form-hint">Loading requests…</p> : query.data?.length ? <div className="admin-request-rows">{query.data.map(row => <button type="button" className={`admin-request-row ${selectedId === row.request.id ? "active" : ""}`} key={row.request.id} onClick={() => setSelectedId(row.request.id)}><div><strong>{row.request.summary}</strong><span>{row.request.publicId} · {row.customerName || "Customer"}</span><small>{row.request.kind} · {row.assigneeName || "Unassigned"}</small></div><StatusPill status={row.request.status} /></button>)}</div> : <div className="empty-state">No requests match this view. Customer requests will appear here.</div>}
    </section>
    <section className="dash-card admin-request-detail"><div className="card-title-row"><div><span className="eyebrow">REQUEST DETAIL</span><h2>{request?.summary ?? "Select a request"}</h2></div>{request && <StatusPill status={request.status} />}</div>
      {!request ? <div className="empty-state">Select a customer request to review its details and conversation.</div> : <>
        <div className="request-summary-grid"><div><span>Request ID</span><strong>{request.publicId}</strong></div><div><span>Type</span><strong>{request.kind} · {request.category}</strong></div><div><span>Customer</span><strong>{detail.data?.customer?.name || detail.data?.customer?.email || "Customer"}</strong></div><div><span>Location</span><strong>{request.locationText || "Not provided"}</strong></div></div>
        {request.details && <details className="request-data-details"><summary>Submitted details</summary><pre>{JSON.stringify(request.details, null, 2)}</pre></details>}
        <div className="admin-action-grid"><label className="form-label">Status<select className="select-field" value={request.status} onChange={event => updateStatus.mutate({ requestId: request.id, status: event.target.value as (typeof statuses)[number] })}>{statuses.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label className="form-label">Assigned team member<select className="select-field" value={request.assignedTeamId ?? ""} onChange={event => assign.mutate({ requestId: request.id, teamMemberId: event.target.value ? Number(event.target.value) : null })}><option value="">Unassigned</option>{teams.data?.filter(member => member.active).map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div>
        <section className="admin-thread-block"><div className="card-title-row"><h3><MessageSquareText size={14} /> Customer conversation</h3><span className="eyebrow">VISIBLE TO CUSTOMER</span></div><div className="thread-stream admin-thread-stream">{detail.data?.messages.filter(item => item.message.customerVisible).length ? detail.data.messages.filter(item => item.message.customerVisible).map(item => <div className={`thread-message ${item.message.senderRole === "admin" ? "mine" : ""}`} key={item.message.id}><small>{item.message.senderRole === "admin" ? "WESTARA" : item.senderName || "CUSTOMER"} · {new Date(item.message.createdAt).toLocaleString()}</small><p>{item.message.body}</p></div>) : <div className="empty-state">No messages in this request thread.</div>}</div><form className="thread-reply-form" onSubmit={submitReply}><textarea className="textarea-field" value={reply} onChange={event => setReply(event.target.value)} maxLength={4000} required placeholder="Write a customer-visible reply…" /><button className="button button-lime" type="submit" disabled={sendReply.isPending}><Send size={13} /> Reply & notify customer</button></form></section>
        <section className="admin-thread-block internal-notes"><div className="card-title-row"><h3><StickyNote size={14} /> Internal notes</h3><span className="eyebrow">ADMIN-ONLY</span></div>{detail.data?.notes.length ? detail.data.notes.map(item => <div className="request-note" key={item.note.id}><strong>{item.adminName || "Admin"} · {new Date(item.note.createdAt).toLocaleString()}</strong><p>{item.note.body}</p></div>) : <p className="form-hint">No private notes.</p>}<form className="thread-reply-form" onSubmit={submitNote}><textarea className="textarea-field" value={note} onChange={event => setNote(event.target.value)} maxLength={4000} required placeholder="Add a private team note…" /><button className="button button-outline" type="submit" disabled={addNote.isPending}>Save private note</button></form></section>
      </>}
    </section></div>
  </>;
}
