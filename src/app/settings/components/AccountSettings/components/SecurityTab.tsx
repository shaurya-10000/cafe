import { useClerk } from "@clerk/nextjs";

export function SecurityTab() {
  const clerk = useClerk();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Security Portal
        </h2>
        <p className="mt-2 font-medium text-zinc-500">
          Manage your credentials, password, and session security.
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-8 dark:border-white/5 dark:bg-zinc-900 md:p-10">
        <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-sm font-bold leading-relaxed text-amber-800 dark:text-amber-400">
            Manage your password, multi-factor authentication, and connected
            devices securely through Clerk.
          </p>
        </div>

        <button
          type="button"
          onClick={() => clerk.openUserProfile()}
          className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
        >
          Manage Security &amp; Credentials
        </button>
      </div>
    </div>
  );
}
