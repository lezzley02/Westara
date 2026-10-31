import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Radio, Zap } from "lucide-react";

const sampleStations = [
  { id: "sample-west", name: "Sample charging point A", place: "Western Mumbai · sample", lat: 19.071, lng: 72.827, connectors: "CCS2 · Type 2" },
  { id: "sample-harbor", name: "Sample charging point B", place: "Harbour approach · sample", lat: 19.044, lng: 72.895, connectors: "CCS2" },
  { id: "sample-east", name: "Sample charging point C", place: "Eastern corridor · sample", lat: 19.103, lng: 72.914, connectors: "Type 2" },
];

type MapPanelProps = {
  compact?: boolean;
  route?: { origin: string; destination: string } | null;
  onEstimate?: (estimate: { distanceKm: number; durationMinutes: number }) => void;
};

export default function MapPanel({ compact = false, route = null, onEstimate }: MapPanelProps) {
  const container = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "fallback">("loading");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapMessage, setMapMessage] = useState("Checking map availability…");

  useEffect(() => {
    let disposed = false;
    const config = window.__MANUS_CONFIG__;
    if (!config?.apiUrl || !config.apiBrowserKey) {
      setMapState("fallback");
      setMapMessage("Interactive map provider is not configured. Sample markers below are illustrative only.");
      return;
    }
    const boot = async () => {
      try {
        if (!window.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            const apiBase = config.apiUrl.replace(/\/$/, "");
            script.src = `${apiBase}/v1/maps/proxy/maps/api/js?key=${encodeURIComponent(config.apiBrowserKey)}&v=weekly`;
            script.async = true;
            const timer = window.setTimeout(() => reject(new Error("Map service timed out")), 8000);
            script.onload = () => { window.clearTimeout(timer); resolve(); };
            script.onerror = () => { window.clearTimeout(timer); reject(new Error("Map service is unavailable")); };
            document.head.appendChild(script);
          });
        }
        if (disposed || !container.current || !window.google?.maps) return;
        const instance = new window.google.maps.Map(container.current, {
          center: { lat: 19.076, lng: 72.8777 },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          backgroundColor: "#121719",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#20272a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#aeb7b3" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#20272a" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#394247" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#111a1d" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
          ],
        });
        sampleStations.forEach(station => new window.google!.maps.Marker({
          map: instance,
          position: { lat: station.lat, lng: station.lng },
          title: `${station.name} · sample only`,
          label: { text: "•", color: "#c8f169", fontSize: "26px" },
        }));
        setMap(instance);
        setMapState("ready");
        setMapMessage("Sample pins shown · not verified live charging locations");
      } catch {
        if (disposed) return;
        setMapState("fallback");
        setMapMessage("Map provider is unavailable right now. Sample markers below are illustrative only.");
      }
    };
    void boot();
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!map || !route || !window.google?.maps) return;
    const renderer = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: false, polylineOptions: { strokeColor: "#c8f169", strokeOpacity: 0.9, strokeWeight: 4 } });
    new window.google.maps.DirectionsService().route({ origin: route.origin, destination: route.destination, travelMode: window.google.maps.TravelMode.DRIVING }, (result, status) => {
      if (status !== "OK" || !result) {
        setMapMessage("Route estimate unavailable. Check locations or try again.");
        return;
      }
      renderer.setDirections(result);
      const leg = result.routes[0]?.legs[0];
      if (leg?.distance?.value && leg.duration?.value) {
        onEstimate?.({ distanceKm: Math.round(leg.distance.value / 100) / 10, durationMinutes: Math.round(leg.duration.value / 60) });
        setMapMessage("Route estimate supplied by Google Maps · charging availability is not verified");
      }
    });
    return () => renderer.setMap(null);
  }, [map, route?.origin, route?.destination, onEstimate]);

  return (
    <div className={`map-panel ${compact ? "map-panel-compact" : ""}`}>
      <div className="map-panel-top"><span className="map-label"><span className="live-dot" /> {mapState === "ready" ? "MAP PREVIEW" : "MAP DISCOVERY"}</span><span className="map-provider-label"><Radio size={13} /> {mapState === "ready" ? "Google Maps" : "Illustrative view"}</span></div>
      <div className={`map-canvas ${mapState === "fallback" ? "map-canvas-fallback" : ""}`}>
        <div ref={container} className="google-map-canvas" aria-label="Charging station discovery map" />
        {mapState !== "ready" && <div className="map-fallback-grid" aria-hidden="true"><span className="map-road map-road-a" /><span className="map-road map-road-b" /><span className="map-road map-road-c" />{sampleStations.map((station, index) => <span className={`map-pin map-pin-${index + 1}`} key={station.id}><MapPin size={17} fill="currentColor" /></span>)}</div>}
        {mapState === "loading" && <div className="map-loading"><span className="spinner" /> Loading map layer</div>}
        <div className="map-zoom-control"><button type="button" aria-label="Zoom in" onClick={() => map?.setZoom((map.getZoom() ?? 10) + 1)}>+</button><button type="button" aria-label="Zoom out" onClick={() => map?.setZoom((map.getZoom() ?? 10) - 1)}>−</button></div>
        <span className="map-disclaimer">{mapMessage}</span>
      </div>
      <div className="map-station-preview">{sampleStations.slice(0, compact ? 2 : 3).map((station, index) => <div className="map-station-row" key={station.id}><span className="station-index">0{index + 1}</span><div><strong>{station.name}</strong><span>{station.place}</span></div><small><Zap size={12} /> {station.connectors}</small></div>)}</div>
      <div className="map-provider-foot"><span><Navigation size={13} /> Locations and connector details are samples, not live availability.</span></div>
    </div>
  );
}
