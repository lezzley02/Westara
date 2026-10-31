import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "./Brand";

const links = [
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
  { label: "EV Rentals", href: "#rentals" },
  { label: "About", href: "#about" },
];

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="marketing-header">
      <BrandMark />
      <nav className={`marketing-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
        {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
        <Link href="/login" className="nav-mobile-link" onClick={() => setOpen(false)}>Sign in</Link>
        <Link href="/login" className="button button-lime nav-mobile-cta" onClick={() => setOpen(false)}>Get Started <ArrowUpRight size={15} /></Link>
      </nav>
      <div className="header-actions">
        <Link href="/login" className="header-signin">Sign in</Link>
        <Link href="/login" className="button button-lime header-cta">Get Started <ArrowUpRight size={15} /></Link>
      </div>
      <button className="mobile-menu-button" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
}
