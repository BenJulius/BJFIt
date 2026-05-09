export const metadata = {
  title: "BJ Fit Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-slate-200">
      <div className="mx-auto w-full max-w-md space-y-5">
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Effective date: May 9, 2026</p>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Use of Service</h2>
          <p className="text-sm text-slate-300">
            BJ Fit is a workout tracking and coaching app. You agree to use the app lawfully and not abuse, disrupt, or reverse engineer the service.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Health Notice</h2>
          <p className="text-sm text-slate-300">
            BJ Fit provides general fitness information, not medical advice. Consult a qualified professional before beginning or changing training, nutrition, or recovery plans.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Accounts and Content</h2>
          <p className="text-sm text-slate-300">
            You are responsible for your account security and all activity under your account. You may delete your account at any time from Profile.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Payments and Virtual Items</h2>
          <p className="text-sm text-slate-300">
            If token purchases or subscriptions are enabled, charges are handled by the platform store. Virtual items have no real-world monetary value and are non-transferable.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Contact</h2>
          <p className="text-sm text-slate-300">
            Support: support@benjulius.dev
          </p>
        </section>
      </div>
    </div>
  );
}
