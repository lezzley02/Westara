import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "./Brand";

type InfoPanel = "privacy" | "terms" | "contact" | null;
const panelContent = {
  privacy: { title: "Privacy at Westara", body: "Westara stores the profile, vehicle, and service-request information you choose to submit in your account so you can follow its status and replies. Location is requested only with your consent. Email, SMS, payments, roadside dispatch, and provider bookings are not activated unless a supported provider is configured." },
  terms: { title: "Using Westara", body: "Westara is an independent ownership-support platform and is not affiliated with Tesla, Inc. Sample station and rental information is illustrative; estimates are not quotes or availability guarantees. Submitting a request does not confirm a booking, payment, dispatch, or completed service." },
  contact: { title: "Contact Westara", body: "No public contact channel has been configured yet. If you have an account, you can send a message on a service request and view Westara replies in My Requests. Contact details can be added when the business channel is ready." },
};

export default function SiteFooter() {
  const [panel, setPanel] = useState<InfoPanel>(null);
  const selected = panel ? panelContent[panel] : null;
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand-block"><BrandMark /><p>Ownership support for the miles ahead.</p></div>
      <div className="footer-links">
        <div><span className="mono eyebrow">EXPLORE</span><a href="/#services">Services</a><a href="/#how-it-works">How it works</a><a href="/#rentals">EV rentals</a></div>
        <div><span className="mono eyebrow">ACCOUNT</span><Link href="/login">Sign in <ArrowUpRight size={13} /></Link><Link href="/app">Owner dashboard <ArrowUpRight size={13} /></Link></div>
        <div><span className="mono eyebrow">INFORMATION</span><button type="button" onClick={() => setPanel("privacy")}>Privacy Policy</button><button type="button" onClick={() => setPanel("terms")}>Terms</button><button type="button" onClick={() => setPanel("contact")}>Contact</button></div>
      </div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Westara. Built for the journey.</span><p>Westara is an independent service platform and is not affiliated with Tesla, Inc. Tesla and Model 3 are trademarks of Tesla, Inc.</p></div>
    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null); }}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="footer-modal-title"><div className="card-title-row"><span className="eyebrow">WESTARA / INFORMATION</span><button className="icon-button" type="button" aria-label="Close" onClick={() => setPanel(null)}><X size={15} /></button></div><h2 id="footer-modal-title">{selected.title}</h2><p>{selected.body}</p><button className="button button-outline" type="button" onClick={() => setPanel(null)}>Close</button></section></div>}
  </footer>;
}
