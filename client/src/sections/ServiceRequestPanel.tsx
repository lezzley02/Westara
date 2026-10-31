import { useState, type FormEvent } from "react";
import { ArrowUpRight, CalendarDays, CheckCircle2, LocateFixed, MapPin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type RequestKind = "roadside" | "rental" | "maintenance";
const categories: Record<RequestKind, string[]> = {
  roadside: ["Flat tyre", "Battery problems", "Vehicle breakdown", "Towing", "Lockout assistance"],
  rental: ["Model 3 Long Range · sample category"],
  maintenance: ["Vehicle inspection", "Battery diagnostics", "Tyres and brakes", "General maintenance", "Detailing"],
};
const labels: Record<RequestKind, { title: string; summary: string; submit: string; detail: string }> = {
  roadside: { title: "Roadside assistance", summary: "What is happening?", submit: "Send assistance request", detail: "Share the details that can help us understand what you need." },
  rental: { title: "EV rental request", summary: "Give your request a short title", submit: "Send rental request", detail: "Rental inventory and pricing shown here are illustrative until a provider is connected." },
  maintenance: { title: "Maintenance & service", summary: "What would you like checked?", submit: "Send service request", detail: "A request lets the team follow up; it does not confirm an appointment." },
};

type Props = { kind: RequestKind };
export default function ServiceRequestPanel({ kind }: Props) {
  const title = labels[kind];
  const vehicleQuery = trpc.customer.vehicles.useQuery();
  const availability = trpc.customer.serviceAvailability.useQuery();
  const availabilityKey = kind === "rental" ? "rentals" : kind;
  const serviceUnavailable = availability.data?.[availabilityKey] === "unavailable";
  const utils = trpc.useUtils();
  const [category, setCategory] = useState(categories[kind][0]);
  const [summary, setSummary] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");
  const [locationText, setLocationText] = useState("");
  const [pickup, setPickup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [sentId, setSentId] = useState("");
  const create = trpc.customer.createRequest.useMutation({
    onSuccess: async result => {
      setSentId(result.publicId);
      setSummary(""); setNotes(""); setLocationText(""); setCoords(null); setPickup(""); setStartDate(""); setEndDate("");
      await Promise.all([utils.customer.dashboard.invalidate(), utils.customer.requests.invalidate()]);
      toast.success("Request submitted", { description: `${result.publicId} is new and awaiting review.` });
    },
    onError: error => toast.error("Could not submit request", { description: error.message }),
  });

  const captureLocation = () => {
    if (!navigator.geolocation) { toast.error("Location is not available in this browser."); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(position => {
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationText("Current location shared with consent");
      setLocationBusy(false);
      toast.success("Location added", { description: "Your coordinates will be sent with this request." });
    }, () => {
      setLocationBusy(false);
      toast.error("Location was not shared", { description: "You can still submit using a written location or without location details." });
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (serviceUnavailable) { toast.error("This service is currently unavailable."); return; }
    if (kind === "rental" && startDate && endDate && endDate < startDate) {
      toast.error("Check the dates", { description: "Return date must be on or after pickup date." });
      return;
    }
    const details: Record<string, unknown> = { notes };
    if (kind === "rental") Object.assign(details, { pickupLocation: pickup, pickupDate: startDate, returnDate: endDate, inventoryStatus: "sample; provider not connected" });
    create.mutate({
      kind,
      category,
      summary: summary.trim(),
      vehicleId: vehicleId ? Number(vehicleId) : null,
      details,
      locationText: kind === "rental" ? pickup : locationText,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      locationConsent: Boolean(coords),
    });
  };

  return <div className="section-layout">
    <section className="dash-card form-card">
      <div className="page-heading compact-heading"><div><p className="eyebrow">{kind === "roadside" ? "HELP WHEN PLANS CHANGE" : kind === "rental" ? "RENTAL REQUEST" : "KEEP YOUR VEHICLE READY"}</p><h1>{title.title}</h1><p>{title.detail}</p></div></div>
      {serviceUnavailable && <div className="info-banner service-paused-banner"><ShieldAlert size={15} /><span>This service is marked unavailable by Westara. New requests are paused until the setting changes.</span></div>}
      {kind === "rental" && <div className="rental-sample-card"><span className="mono eyebrow">SAMPLE CATEGORY · ESTIMATE ONLY</span><strong>Model 3 Long Range</strong><span>Illustrative rate: approximately ₹7,500 / day. Not a quote or verified inventory.</span></div>}
      <form className="form-stack" onSubmit={submit}>
        <label className="form-label">Service type<select className="select-field" value={category} onChange={event => setCategory(event.target.value)}>{categories[kind].map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="form-label">{title.summary}<input className="input-field" value={summary} onChange={event => setSummary(event.target.value)} required minLength={4} maxLength={180} placeholder={kind === "rental" ? "e.g. Weekend rental request" : "A brief description"} /></label>
        <label className="form-label">Vehicle<select className="select-field" value={vehicleId} onChange={event => setVehicleId(event.target.value)}><option value="">Choose from My Garage (optional)</option>{vehicleQuery.data?.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname || vehicle.model}{vehicle.year ? ` · ${vehicle.year}` : ""}</option>)}</select></label>
        {kind === "rental" ? <div className="form-grid"><label className="form-label">Pickup location<input className="input-field" value={pickup} onChange={event => setPickup(event.target.value)} required maxLength={240} placeholder="City or preferred pickup point" /></label><label className="form-label">Pickup date<input className="input-field" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required /></label><label className="form-label">Return date<input className="input-field" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} required min={startDate || undefined} /></label></div> : <>
          <label className="form-label">{kind === "roadside" ? "Current or preferred location" : "Preferred service location"}<input className="input-field" value={locationText} onChange={event => { setLocationText(event.target.value); if (coords) setCoords(null); }} maxLength={500} placeholder="Area, street, or landmark (optional)" /></label>
          {kind === "roadside" && <div className="location-consent-box"><div><MapPin size={15} /><span>{coords ? "Current location ready to share" : "Location is optional and is never requested without your action."}</span></div><button className="location-button" type="button" disabled={locationBusy} onClick={captureLocation}><LocateFixed size={14} /> {locationBusy ? "Finding location…" : coords ? "Refresh current location" : "Use current location"}</button><small>By choosing this action, you consent to include approximate coordinates with this request.</small></div>}
        </>}
        <label className="form-label">Additional notes<textarea className="textarea-field" value={notes} onChange={event => setNotes(event.target.value)} maxLength={3000} placeholder="Anything else the team should know?" /></label>
        <div className="form-hint">Your request will be stored in your account with a new status while it awaits team review.</div>
        <button className="button button-lime" type="submit" disabled={create.isPending || serviceUnavailable}>{create.isPending ? "Sending…" : title.submit} <ArrowUpRight size={14} /></button>
        {sentId && <div className="success-banner"><CheckCircle2 size={16} /><span>Request <strong>{sentId}</strong> was recorded. You can track it in My Requests.</span></div>}
      </form>
    </section>
    <aside className="feature-aside">
      <div className="dash-card"><div className="feature-aside-icon"><CalendarDays size={19} /></div><p className="eyebrow">A NOTE ON REQUESTS</p><h2>{kind === "roadside" ? "A clear request, not a dispatch." : kind === "rental" ? "A request, not a reservation." : "A request, not a booking."}</h2><p className="form-hint">Submitting this form records your request in Westara. It does not confirm payment, provider availability, roadside dispatch, or a completed service. A team member can reply through My Requests when the provider workflow is connected.</p></div>
      <div className="info-banner"><ShieldAlert size={15} /><span>For immediate danger or urgent medical needs, contact your local emergency services directly.</span></div>
    </aside>
  </div>;
}
