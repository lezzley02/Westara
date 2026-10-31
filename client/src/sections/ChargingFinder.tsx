import { useMemo, useState } from "react";
import { ArrowUpRight, Heart, MapPin, Navigation, Zap } from "lucide-react";
import { toast } from "sonner";
import MapPanel from "@/components/MapPanel";
import { trpc } from "@/lib/trpc";

const stations = [
  { key: "sample-mumbai-west", name: "Sample public charging point A", address: "Illustrative area: Bandra West, Mumbai, India", connectorTypes: ["CCS2", "Type 2"] as ("CCS2" | "Type 2")[], area: "Mumbai · sample" },
  { key: "sample-mumbai-harbour", name: "Sample public charging point B", address: "Illustrative area: Harbour approach, Mumbai, India", connectorTypes: ["CCS2"] as ("CCS2" | "Type 2")[], area: "Mumbai · sample" },
  { key: "sample-mumbai-east", name: "Sample public charging point C", address: "Illustrative area: Eastern corridor, Mumbai, India", connectorTypes: ["Type 2"] as ("CCS2" | "Type 2")[], area: "Mumbai · sample" },
];

export default function ChargingFinder() {
  const [filter, setFilter] = useState<"All" | "CCS2" | "Type 2">("All");
  const favorites = trpc.customer.favorites.useQuery();
  const utils = trpc.useUtils();
  const save = trpc.customer.saveFavorite.useMutation({ onSuccess: async () => { await utils.customer.favorites.invalidate(); toast.success("Saved to your favorites"); }, onError: error => toast.error("Could not save station", { description: error.message }) });
  const remove = trpc.customer.removeFavorite.useMutation({ onSuccess: async () => { await utils.customer.favorites.invalidate(); toast.success("Removed from favorites"); }, onError: error => toast.error("Could not update favorites", { description: error.message }) });
  const favoriteKeys = useMemo(() => new Set((favorites.data ?? []).map(item => item.stationKey)), [favorites.data]);
  const visible = stations.filter(station => filter === "All" || station.connectorTypes.includes(filter));
  const toggleFavorite = (station: typeof stations[number]) => {
    if (favoriteKeys.has(station.key)) remove.mutate({ stationKey: station.key });
    else save.mutate({ stationKey: station.key, name: station.name, address: station.address, connectorTypes: station.connectorTypes });
  };
  return <>
    <div className="page-heading"><div><p className="eyebrow">CHARGING DISCOVERY</p><h1>Find a place to plug in.</h1><p>Explore connector types and save places for later. Current station data is illustrative; Westara is not connected to a live charger network yet.</p></div></div>
    <div className="info-banner"><Zap size={15} /><span>Every station below is sample data for layout and planning only. Locations, connectors, access, pricing, and live availability are not verified.</span></div>
    <div className="section-layout charging-dashboard-layout"><div className="charging-map-column"><MapPanel /><div className="map-inline-note"><MapPin size={14} /> Sample pins are approximate and are not a source of live charging status.</div></div>
      <section className="dash-card station-list-card"><div className="card-title-row"><div><p className="eyebrow">SAMPLE STATIONS</p><h2>Explore connectors</h2></div><Navigation size={16} color="var(--lime)" /></div><div className="connector-filter">{(["All", "CCS2", "Type 2"] as const).map(value => <button type="button" className={`filter-chip ${filter === value ? "active" : ""}`} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div>
        {visible.map(station => <article className="station-card" key={station.key}><div><strong>{station.name}</strong><p>{station.address}</p><span className="mono">{station.area} · {station.connectorTypes.join(" / ")}</span><div className="station-actions"><a className="text-link" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(station.address)}`} target="_blank" rel="noreferrer">Google Maps search <ArrowUpRight size={12} /></a><span>sample location only</span></div></div><button className={`icon-button ${favoriteKeys.has(station.key) ? "favorite-on" : ""}`} type="button" aria-label={favoriteKeys.has(station.key) ? "Remove favorite" : "Save favorite"} onClick={() => toggleFavorite(station)}><Heart size={15} fill={favoriteKeys.has(station.key) ? "currentColor" : "none"} /></button></article>)}
        <div className="card-title-row favorites-title"><div><p className="eyebrow">YOUR SAVED PLACES</p><h2>Favorites</h2></div></div>
        {favorites.isLoading ? <p className="form-hint">Loading saved places…</p> : favorites.data?.length ? favorites.data.map(item => <div className="favorite-row" key={item.stationKey}><span><Heart size={13} fill="currentColor" /> {item.name}</span><small>{item.connectorTypes.join(" / ")}</small></div>) : <div className="empty-state">Save a sample location to keep it with your account.</div>}
      </section>
    </div>
  </>;
}
