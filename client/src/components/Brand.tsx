import { Link } from "wouter";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`brand-lockup ${compact ? "brand-lockup-compact" : ""}`} aria-label="Westara home">
      <span className="brand-symbol" aria-hidden="true"><i /><i /></span>
      {!compact && <span className="brand-wordmark">WESTARA</span>}
    </Link>
  );
}
