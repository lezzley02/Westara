import { useEffect, useState, type FormEvent } from "react";
import { Bell, MapPin, Plus, ShieldCheck, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const serviceNames = ["Roadside assistance", "EV rentals", "Maintenance & service", "Charging discovery"];
const serviceKeys = ["roadside", "rentals", "maintenance", "charging"];
type Availability = Record<string, "not_configured" | "available" | "unavailable">;

export default function AdminSettings({ currentUserId }: { currentUserId: number }) {
  const query = trpc.admin.settings.useQuery();
  const members = trpc.admin.teamMembers.useQuery();
  const admins = trpc.admin.administrators.useQuery();
  const customers = trpc.admin.customers.useQuery();
  const utils = trpc.useUtils();
  const [availability, setAvailability] = useState<Availability>({});
  const [locations, setLocations] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [promoteUserId, setPromoteUserId] = useState("");
  useEffect(() => {
    if (!query.data) return;
    for (const row of query.data) {
      try {
        if (row.settingKey === "service.availability") setAvailability(JSON.parse(row.value) as Availability);
        if (row.settingKey === "service.locations") setLocations(row.value);
        if (row.settingKey === "notifications.delivery") { const value = JSON.parse(row.value) as { email?: boolean; sms?: boolean }; setEmailEnabled(Boolean(value.email)); setSmsEnabled(Boolean(value.sms)); }
      } catch { /* A malformed setting remains editable in the underlying setting row. */ }
    }
  }, [query.data]);
  const save = trpc.admin.saveSetting.useMutation({ onSuccess: async () => { await utils.admin.settings.invalidate(); toast.success("Setting saved"); }, onError: error => toast.error("Could not save setting", { description: error.message }) });
  const addMember = trpc.admin.addTeamMember.useMutation({ onSuccess: async () => { setMemberName(""); setMemberEmail(""); await utils.admin.teamMembers.invalidate(); toast.success("Team member added"); }, onError: error => toast.error("Could not add team member", { description: error.message }) });
  const setMemberActive = trpc.admin.setTeamMemberActive.useMutation({ onSuccess: async () => { await utils.admin.teamMembers.invalidate(); toast.success("Team list updated"); }, onError: error => toast.error("Could not update team member", { description: error.message }) });
  const setAdmin = trpc.admin.setAdministrator.useMutation({ onSuccess: async () => { setPromoteUserId(""); await Promise.all([utils.admin.administrators.invalidate(), utils.admin.customers.invalidate()]); toast.success("Administrator roles updated"); }, onError: error => toast.error("Could not update administrator", { description: error.message }) });
  const add = (event: FormEvent) => { event.preventDefault(); addMember.mutate({ name: memberName.trim(), email: memberEmail.trim() }); };
  const saveAvailability = () => save.mutate({ key: "service.availability", value: JSON.stringify(availability) });
  const saveLocations = () => save.mutate({ key: "service.locations", value: locations.trim() });
  const saveNotifications = () => save.mutate({ key: "notifications.delivery", value: JSON.stringify({ email: emailEnabled, sms: smsEnabled }) });
  return <>
    <div className="page-heading"><div><p className="eyebrow">OPERATIONS / CONFIGURATION</p><h1>Settings</h1><p>Manage service flags, locations, notification preferences, team assignments, and administrator access.</p></div></div>
    <div className="admin-settings-grid">
      <section className="dash-card settings-card"><div className="card-title-row"><div><span className="eyebrow">SERVICE AVAILABILITY</span><h2>Services</h2></div><Wrench size={16} color="var(--lime)" /></div><p className="form-hint">Availability labels are internal settings. They do not activate provider dispatch, bookings, maps, or payments by themselves.</p>{serviceNames.map((name, index) => <label className="availability-row" key={serviceKeys[index]}><span>{name}<small>{availability[serviceKeys[index]] === "available" ? "Set by an administrator" : availability[serviceKeys[index]] === "unavailable" ? "Marked unavailable" : "Not configured"}</small></span><select className="select-field" value={availability[serviceKeys[index]] ?? "not_configured"} onChange={event => setAvailability(value => ({ ...value, [serviceKeys[index]]: event.target.value as Availability[string] }))}><option value="not_configured">Not configured</option><option value="available">Available</option><option value="unavailable">Temporarily unavailable</option></select></label>)}<button className="button button-lime" type="button" onClick={saveAvailability} disabled={save.isPending}>Save availability</button></section>
      <section className="dash-card settings-card"><div className="card-title-row"><div><span className="eyebrow">SERVICE LOCATIONS</span><h2>Locations</h2></div><MapPin size={16} color="var(--lime)" /></div><label className="form-label">Public or service-area locations<textarea className="textarea-field" value={locations} onChange={event => setLocations(event.target.value)} maxLength={6000} placeholder="Add confirmed service areas, one per line. Leave blank until verified." /></label><p className="form-hint">Only list confirmed areas. This content is saved as a business setting; it does not appear as live provider coverage until the product is wired to a service network.</p><button className="button button-outline" type="button" onClick={saveLocations} disabled={save.isPending}>Save locations</button></section>
      <section className="dash-card settings-card"><div className="card-title-row"><div><span className="eyebrow">NOTIFICATIONS</span><h2>Delivery preferences</h2></div><Bell size={16} color="var(--lime)" /></div><p className="form-hint">These flags record intended channels only. Customer email and SMS are not sent until a provider is configured.</p><label className="checkbox-row"><input type="checkbox" checked={emailEnabled} onChange={event => setEmailEnabled(event.target.checked)} /> Email delivery when configured</label><label className="checkbox-row"><input type="checkbox" checked={smsEnabled} onChange={event => setSmsEnabled(event.target.checked)} /> SMS delivery when configured</label><button className="button button-outline" type="button" onClick={saveNotifications} disabled={save.isPending}>Save notification preferences</button></section>
      <section className="dash-card settings-card"><div className="card-title-row"><div><span className="eyebrow">ASSIGNMENT TEAM</span><h2>Team members</h2></div><Users size={16} color="var(--lime)" /></div><p className="form-hint">Team entries are assignment labels, not sign-in accounts.</p><form className="settings-add-form" onSubmit={add}><input className="input-field" value={memberName} onChange={event => setMemberName(event.target.value)} required maxLength={160} placeholder="Team member name" /><input className="input-field" type="email" value={memberEmail} onChange={event => setMemberEmail(event.target.value)} maxLength={320} placeholder="Email (optional)" /><button className="button button-lime" type="submit" disabled={addMember.isPending}><Plus size={14} /> Add</button></form>{members.data?.map(member => <div className="settings-person-row" key={member.id}><span>{member.name}<small>{member.email || "No email listed"} · {member.active ? "Active" : "Inactive"}</small></span><button className="button button-quiet" type="button" onClick={() => setMemberActive.mutate({ id: member.id, active: !member.active })}>{member.active ? "Deactivate" : "Activate"}</button></div>)}</section>
      <section className="dash-card settings-card admin-role-settings"><div className="card-title-row"><div><span className="eyebrow">ACCESS CONTROL</span><h2>Administrators</h2></div><ShieldCheck size={16} color="var(--lime)" /></div><p className="form-hint">The configured business-owner account is bootstrapped on its first successful sign-in. Promote only trusted registered accounts.</p>{admins.data?.map(admin => <div className="settings-person-row" key={admin.id}><span>{admin.name || admin.email || "Administrator"}<small>{admin.email || "Account protected by OAuth"}</small></span>{admin.isOwner ? <span className="owner-lock-label">OWNER · PROTECTED</span> : admin.id === currentUserId ? <span className="owner-lock-label">YOU · ADMIN</span> : <button className="button button-quiet" type="button" disabled={setAdmin.isPending} onClick={() => setAdmin.mutate({ userId: admin.id, enabled: false })}>Revoke admin</button>}</div>)}<div className="settings-add-form"><select className="select-field" value={promoteUserId} onChange={event => setPromoteUserId(event.target.value)}><option value="">Select a registered customer</option>{customers.data?.map(customer => <option key={customer.id} value={customer.id}>{customer.name || customer.email || `Customer #${customer.id}`}</option>)}</select><button className="button button-outline" type="button" disabled={!promoteUserId || setAdmin.isPending} onClick={() => setAdmin.mutate({ userId: Number(promoteUserId), enabled: true })}>Grant admin</button></div>
        {query.data?.filter(row => !["service.availability", "service.locations", "notifications.delivery"].includes(row.settingKey)).map(row => <details className="raw-setting" key={row.settingKey}><summary>{row.settingKey}</summary><pre>{row.value}</pre></details>)}
      </section>
    </div>
  </>;
}
