export const metadata = {
  title: "BJ Fit Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-slate-200">
      <div className="mx-auto w-full max-w-md space-y-5">
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Effective date: May 9, 2026</p>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Data We Collect</h2>
          <p className="text-sm text-slate-300">
            We collect account identifiers (such as email), workout logs, profile settings, and app usage events needed to operate BJ Fit.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">How We Use Data</h2>
          <p className="text-sm text-slate-300">
            We use your data to provide workout tracking, progress history, personalized coaching suggestions, and service security.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Data Sharing</h2>
          <p className="text-sm text-slate-300">
            We do not sell personal data. Service providers may process data strictly to host, secure, and run BJ Fit.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Retention and Deletion</h2>
          <p className="text-sm text-slate-300">
            You can request deletion at any time. In-app account deletion removes your account and associated app data, subject to legal obligations.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Contact</h2>
          <p className="text-sm text-slate-300">
            Privacy requests: privacy@benjulius.dev
          </p>
        </section>
      </div>
    </div>
  );
}
