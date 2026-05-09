export const metadata = {
  title: "BJ Fit Data Deletion",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-slate-200">
      <div className="mx-auto w-full max-w-md space-y-5">
        <h1 className="text-3xl font-black text-white">Data Deletion</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Updated: May 9, 2026</p>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Delete in App</h2>
          <p className="text-sm text-slate-300">
            Open BJ Fit, go to Profile, and tap Delete Account. This removes account access and deletes workout/profile data from active systems.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Email Request</h2>
          <p className="text-sm text-slate-300">
            If you cannot access the app, email deletion@benjulius.dev from your account email with subject: Delete BJ Fit Account.
          </p>
        </section>
      </div>
    </div>
  );
}
