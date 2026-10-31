import { useState, type FormEvent } from "react";
import { ArrowUpRight, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import StatusPill from "@/components/StatusPill";

export default function CustomerRequests() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();
  const requests = trpc.customer.requests.useQuery();
  const thread = trpc.customer.requestThread.useQuery({ requestId: selectedId ?? 0 }, { enabled: Boolean(selectedId) });
  const send = trpc.customer.sendMessage.useMutation({ onSuccess: async () => { setBody(""); await Promise.all([utils.customer.requestThread.invalidate(), utils.customer.requests.invalidate()]); toast.success("Message sent to Westara"); }, onError: error => toast.error("Could not send message", { description: error.message }) });
  const submit = (event: FormEvent) => { event.preventDefault(); if (!selectedId || !body.trim()) return; send.mutate({ requestId: selectedId, body: body.trim() }); };
  return <>
    <div className="page-heading"><div><p className="eyebrow">REQUEST HISTORY</p><h1>My Requests</h1><p>Track status and continue the conversation with the Westara team.</p></div></div>
    <div className="customer-requests-layout">
      <section className="dash-card request-list-panel"><div className="card-title-row"><div><span className="eyebrow">YOUR RECORDS</span><h2>Submitted requests</h2></div></div>
        {requests.isLoading ? <p className="form-hint">Loading requests…</p> : requests.data?.length ? requests.data.map(request => <button className={`customer-request-row ${selectedId === request.id ? "active" : ""}`} type="button" key={request.id} onClick={() => setSelectedId(request.id)}><div><strong>{request.summary}</strong><span>{request.publicId} · {request.category}</span><small>{request.updatedAt.toLocaleDateString?.() ?? ""}</small></div><StatusPill status={request.status} /></button>) : <div className="empty-state">No requests yet. Choose a service from the dashboard to send one.</div>}
      </section>
      <section className="dash-card request-thread-panel"><div className="card-title-row"><div><span className="eyebrow">CUSTOMER THREAD</span><h2>{thread.data?.request.summary ?? "Select a request"}</h2></div>{thread.data && <StatusPill status={thread.data.request.status} />}</div>
        {thread.isLoading ? <p className="form-hint">Loading thread…</p> : thread.data ? <>
          <div className="thread-meta">{thread.data.request.publicId} · Replies from Westara appear here. Private team notes are never shown.</div>
          <div className="thread-stream">{thread.data.messages.length ? thread.data.messages.map(message => <div className={`thread-message ${message.senderRole === "customer" ? "mine" : ""}`} key={message.id}><small>{message.senderRole === "customer" ? "YOU" : "WESTARA"} · {new Date(message.createdAt).toLocaleString()}</small><p>{message.body}</p></div>) : <div className="empty-state">No replies yet. Send a message if you want to add information to this request.</div>}</div>
          <form className="thread-reply-form" onSubmit={submit}><textarea className="textarea-field" value={body} onChange={event => setBody(event.target.value)} required maxLength={4000} placeholder="Write a message to Westara…" /><button className="button button-lime" type="submit" disabled={send.isPending}><Send size={14} /> {send.isPending ? "Sending…" : "Send message"}</button></form>
        </> : <div className="empty-state"><MessageCircle size={17} /><br />Choose a request to view its status and conversation.</div>}
      </section>
    </div>
  </>;
}

export function CustomerNotifications() {
  const utils = trpc.useUtils();
  const notifications = trpc.customer.notifications.useQuery();
  const markRead = trpc.customer.markNotificationRead.useMutation({ onSuccess: async () => { await Promise.all([utils.customer.notifications.invalidate(), utils.customer.dashboard.invalidate()]); }, onError: error => toast.error("Could not mark notification", { description: error.message }) });
  return <>
    <div className="page-heading"><div><p className="eyebrow">ACCOUNT UPDATES</p><h1>Notifications</h1><p>Request status changes and Westara replies are kept here.</p></div></div>
    <section className="dash-card notification-page-card"><div className="card-title-row"><div><span className="eyebrow">YOUR UPDATES</span><h2>Recent notifications</h2></div></div>
      {notifications.isLoading ? <p className="form-hint">Loading notifications…</p> : notifications.data?.length ? notifications.data.map(note => <article className={`notification-row ${note.readAt ? "is-read" : ""}`} key={note.id}><span className={`notification-mark ${note.readAt ? "read" : ""}`} /><div><h3>{note.title}</h3><p>{note.body}</p><small>{new Date(note.createdAt).toLocaleString()}</small></div>{!note.readAt && <button className="text-link" type="button" onClick={() => markRead.mutate({ notificationId: note.id })}>Mark read <ArrowUpRight size={12} /></button>}</article>) : <div className="empty-state">Updates will arrive here when a request changes or the team replies.</div>}
    </section>
  </>;
}
