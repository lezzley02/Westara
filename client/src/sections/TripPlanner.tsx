import { useCallback, useState, type FormEvent } from "react";
import { ArrowUpRight, Clock3, MapPin, Route, Save } from "lucide-react";
import { toast } from "sonner";
import MapPanel from "@/components/MapPanel";
import { trpc } from "@/lib/trpc";

export default function TripPlanner() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState<{ origin: string; destination: string } | null>(null);
  const [estimate, setEstimate] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);
  const utils = trpc.useUtils();
  const trips = trpc.customer.journeys.useQuery();
  const save = trpc.customer.saveJourney.useMutation({ onSuccess: async () => { await utils.customer.journeys.invalidate(); toast.success("Journey saved"); }, onError: error => toast.error("Could not save journey", { description: error.message }) });
  const onEstimate = useCallback((value: { distanceKm: number; durationMinutes: number }) => setEstimate(value), []);
  const plan = (event: FormEvent) => {
    event.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setEstimate(null);
    setRoute({ origin: origin.trim(), destination: destination.trim() });
  };
  const saveTrip = () => {
    if (!origin.trim() || !destination.trim()) { toast.error("Enter a start and destination first."); return; }
    save.mutate({
      origin: origin.trim(), destination: destination.trim(),
      distanceKm: estimate?.distanceKm, durationMinutes: estimate?.durationMinutes,
      chargingStops: [], estimateSource: estimate ? "Google Maps route estimate" : "Locations saved; route estimate unavailable",
    });
  };
  return <>
    <div className="page-heading"><div><p className="eyebrow">TRIP PLANNER</p><h1>Map the miles ahead.</h1><p>Estimate your drive and keep a route with your account. Charging availability is not live or route-verified.</p></div></div>
    <div className="info-banner"><Route size={15} /><span>Route distance and drive time are provided only when the configured Google Maps service responds. Charger markers are sample data and are not matched to your route.</span></div>
    <div className="trip-planner-layout"><section className="dash-card trip-form-card"><div className="card-title-row"><div><span className="eyebrow">YOUR ROUTE</span><h2>Where to?</h2></div><MapPin size={17} color="var(--lime)" /></div>
      <form className="form-stack" onSubmit={plan}><label className="form-label">Starting location<input className="input-field" value={origin} onChange={event => setOrigin(event.target.value)} required maxLength={240} placeholder="City, address, or landmark" /></label><label className="form-label">Destination<input className="input-field" value={destination} onChange={event => setDestination(event.target.value)} required maxLength={240} placeholder="City, address, or landmark" /></label><div className="inline-actions"><button className="button button-outline" type="submit">Estimate route <ArrowUpRight size={14} /></button><button className="button button-lime" type="button" onClick={saveTrip} disabled={save.isPending}><Save size={14} /> Save journey</button></div></form>
      {estimate ? <div className="trip-estimate"><div><Route size={16} /><strong>{estimate.distanceKm} km</strong><span>Estimated distance</span></div><div><Clock3 size={16} /><strong>{estimate.durationMinutes} min</strong><span>Estimated drive time</span></div></div> : route && <p className="form-hint route-unavailable">Waiting for a route estimate. If Maps is not configured, you can still save the start and destination without invented distance or duration.</p>}
    </section><section className="trip-map-card"><MapPanel route={route} onEstimate={onEstimate} /></section></div>
    <section className="dash-card route-charging-card"><div className="card-title-row"><div><span className="eyebrow">ROUTE SUPPORT</span><h2>Charging stops along this route</h2></div><MapPin size={16} color="var(--lime)" /></div><div className="empty-state">{route ? "No live charging network is connected, so Westara cannot verify station addresses, connectors, or stops along this route yet. The sample map pins are not route matches." : "Enter a starting location and destination to plan a route. Verified charging stops will appear here when a supported charging-data provider is connected."}</div></section>
    <section className="dash-card saved-trips-card"><div className="card-title-row"><div><span className="eyebrow">YOUR ROUTES</span><h2>Saved journeys</h2></div></div>
      {trips.isLoading ? <p className="form-hint">Loading journeys…</p> : trips.data?.length ? <div className="saved-trip-grid">{trips.data.map(trip => <article className="saved-trip" key={trip.id}><span className="eyebrow mono">{trip.estimateSource}</span><h3>{trip.origin} <span>→</span> {trip.destination}</h3><p>{trip.distanceKm ? `${trip.distanceKm} km` : "Distance estimate not available"}{trip.durationMinutes ? ` · ${trip.durationMinutes} min` : ""}</p><small>Charging data: not verified</small></article>)}</div> : <div className="empty-state">Your saved journeys will appear here.</div>}
    </section>
  </>;
}
