import { ArrowDown, ArrowRight, ArrowUpRight, BatteryCharging, CarFront, ChevronRight, CircleHelp, Clock3, Compass, MapPin, ShieldCheck, Sparkles, Wrench, Zap } from "lucide-react";
import { Link } from "wouter";
import MarketingHeader from "@/components/MarketingHeader";
import MapPanel from "@/components/MapPanel";
import SiteFooter from "@/components/SiteFooter";

const services = [
  { icon: <CircleHelp />, number: "01", title: "Roadside assistance", text: "A clearer next step when the road gets complicated.", link: "/login", cta: "Request support" },
  { icon: <Zap />, number: "02", title: "Charging discovery", text: "Explore connector options and save places for later.", link: "#charging", cta: "Find a charge" },
  { icon: <CarFront />, number: "03", title: "EV rentals", text: "Plan a short-term drive with an estimated request.", link: "#rentals", cta: "View rentals" },
  { icon: <Wrench />, number: "04", title: "Vehicle care", text: "One place to organize inspection and upkeep requests.", link: "/login", cta: "Explore care" },
];
const steps = [
  ["01", "Create your account", "Sign in securely and add the vehicle you want to manage."],
  ["02", "Choose what you need", "Pick a service, browse charging, or map a journey."],
  ["03", "Send a request", "Share the details that help us understand your next step."],
  ["04", "Follow the updates", "Track status and replies from your account."],
];

export default function Home() {
  return <div className="site-shell">
    <MarketingHeader />
    <main>
      <section className="home-hero">
        <div className="hero-image" />
        <div className="hero-gradient" />
        <div className="hero-content page-wrap">
          <span className="eyebrow mono hero-kicker"><i /> INDEPENDENT EV OWNERSHIP SUPPORT · INDIA</span>
          <h1>Your Tesla.<br /><span>Your Journey.</span><br />Covered.</h1>
          <p>Roadside assistance, charging stations, EV rentals, maintenance and trip planning — everything you need to keep moving.</p>
          <div className="hero-actions"><Link className="button button-lime button-large" href="/login">Get Started <ArrowUpRight size={16} /></Link><a className="button button-outline button-large" href="#services">Explore Services <ArrowDown size={15} /></a></div>
          <div className="hero-bottomline"><span className="mono">BUILT AROUND OWNERSHIP</span><span className="hero-disclaimer">An independent platform. Not affiliated with Tesla, Inc.</span></div>
        </div>
        <div className="hero-side-label mono">WST / 01—04</div>
      </section>

      <section className="intro-section page-wrap" id="about">
        <div className="section-index"><span className="mono">01 / WESTARA</span><span className="section-index-line" /></div>
        <div className="intro-copy"><p className="eyebrow mono">LESS FRICTION. MORE FORWARD.</p><h2>Ownership is the whole journey.<br /><span>We’re here for the in-between.</span></h2></div>
        <p className="intro-description">Westara brings practical EV ownership services into one considered place — so the next step feels a little clearer, wherever the road takes you.</p>
      </section>

      <section className="service-section page-wrap" id="services">
        <div className="section-heading-row"><div><p className="eyebrow mono">THE WESTARA TOOLKIT</p><h2>Support that moves<br />with you.</h2></div><p>Four useful starting points. More room to grow with every mile.</p></div>
        <div className="service-grid">{services.map(item => <article className="service-card" key={item.number}><div className="service-card-top"><span className="service-icon">{item.icon}</span><span className="mono service-number">{item.number} / 04</span></div><h3>{item.title}</h3><p>{item.text}</p><Link href={item.link} className="text-link">{item.cta}<ArrowUpRight size={15} /></Link></article>)}</div>
      </section>

      <section className="how-section" id="how-it-works"><div className="page-wrap how-inner"><div className="how-heading"><p className="eyebrow mono">A FEW STEPS, NOT A MAZE</p><h2>Good support starts<br />with a clear path.</h2><Link href="/login" className="button button-outline">Create your account <ArrowUpRight size={15} /></Link></div><div className="steps-list">{steps.map(([num, title, text]) => <div className="step-row" key={num}><span className="step-number mono">{num}</span><div><h3>{title}</h3><p>{text}</p></div><ChevronRight size={18} className="step-arrow" /></div>)}</div></div></section>

      <section className="charging-section page-wrap" id="charging"><div className="charging-copy"><p className="eyebrow mono">02 / CHARGING DISCOVERY</p><h2>Know the options<br />before you <em>need</em> them.</h2><p>Explore sample station markers, compare CCS2 and Type 2 connectors, and save a stop for your next journey. Provider data is not connected yet, so sample pins are clearly marked.</p><div className="connector-pills"><span><Zap size={13} /> CCS2</span><span><Zap size={13} /> Type 2</span></div><Link href="/login" className="text-link">Open charging finder <ArrowUpRight size={15} /></Link></div><div className="charging-visual"><MapPanel compact /></div></section>

      <section className="rental-section page-wrap" id="rentals"><div className="rental-image-wrap"><img src="/images/westara-road.jpg" alt="Unbranded electric car at a public charging point at dusk" loading="lazy" /><span className="image-caption mono">ROAD NOTES / SAMPLE VISUAL</span></div><div className="rental-copy"><p className="eyebrow mono">03 / EV RENTALS</p><h2>More room<br />for the <em>long way.</em></h2><p>Browse an example rental category and send a request with your pickup point and dates. A submitted request is not a confirmed vehicle or booking.</p><div className="rental-example"><div><span className="mono eyebrow">EXAMPLE CATEGORY · ESTIMATED</span><strong>Model 3 Long Range</strong><span className="rental-approx">Indicative sample · ₹7,500 / day</span></div><CarFront size={28} /></div><Link href="/login" className="button button-lime">Request a rental <ArrowUpRight size={15} /></Link></div></section>

      <section className="care-section page-wrap"><div className="section-heading-row"><div><p className="eyebrow mono">04 / VEHICLE CARE</p><h2>Keep the little things<br />from becoming big ones.</h2></div><p>Clear options for the care that helps a vehicle feel ready for the next drive.</p></div><div className="care-grid"><div className="care-item"><BatteryCharging /><span className="mono">01</span><h3>Diagnostics</h3><p>Understand the signals before choosing a service.</p></div><div className="care-item"><Zap /><span className="mono">02</span><h3>Battery health</h3><p>Organize a battery check or diagnostics request.</p></div><div className="care-item"><Compass /><span className="mono">03</span><h3>Tyres & brakes</h3><p>Plan a practical inspection and follow up.</p></div><div className="care-item"><Sparkles /><span className="mono">04</span><h3>Maintenance & detailing</h3><p>Keep routine care together in your dashboard.</p></div></div></section>

      <section className="final-cta"><div className="page-wrap final-cta-inner"><div><p className="eyebrow mono"><ShieldCheck size={13} /> A MORE CONSIDERED OWNERSHIP EXPERIENCE</p><h2>Keep moving, with<br /><em>a clearer next step.</em></h2></div><Link href="/login" className="button button-lime button-large">Create Account <ArrowRight size={16} /></Link><span className="cta-ghost mono">WESTARA / INDIA</span></div></section>
    </main>
    <SiteFooter />
  </div>;
}
