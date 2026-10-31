import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { BrandMark } from "@/components/Brand";

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const continueWithAccount = () => {
    try {
      setBusy(true);
      setError("");
      startLogin();
    } catch {
      setBusy(false);
      setError("Secure sign-in is not available right now. Please try again in a moment.");
    }
  };

  return <main className="auth-page">
    <section className="auth-visual">
      <BrandMark />
      <h1>Your Tesla.<br /><em>Your journey.</em><br />Covered.</h1>
      <p className="auth-visual-foot">INDEPENDENT EV OWNERSHIP SUPPORT · INDIA</p>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <Link href="/" className="auth-back"><ArrowLeft size={14} /> Back to Westara</Link>
        <p className="eyebrow">YOUR OWNER ACCOUNT</p>
        <h2>Good to have you here.</h2>
        <p>Create an account or sign in securely to manage vehicles, request services, and keep up with updates.</p>
        <div className="auth-provider-grid">
          <button className="auth-provider-button primary" type="button" onClick={continueWithAccount} disabled={busy}><Fingerprint size={16} /> {busy ? "Opening secure sign-in…" : "Continue with your account"} <ArrowUpRight size={14} /></button>
        </div>
        <div className="auth-separator">secure account portal</div>
        <p className="form-hint auth-method-note">The account portal displays only sign-in and registration methods supported for your account. Google, Apple, email, or phone may appear when enabled by the provider; Westara does not claim or simulate an unavailable method.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="auth-security-note"><LockKeyhole size={15} /><span>Sign-in is handled by the secure account provider. Westara never sees your provider password.</span></div>
        <p className="auth-legal">By continuing, you agree to use Westara as an independent ownership-support platform. Westara is not affiliated with Tesla, Inc.</p>
        <p className="auth-legal"><ShieldCheck size={12} /> Sign-in success returns you to your owner dashboard.</p>
      </div>
    </section>
  </main>;
}
