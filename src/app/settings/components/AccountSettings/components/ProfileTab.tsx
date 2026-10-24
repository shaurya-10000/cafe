import { ClerkAccountPanel } from "./ClerkAccountPanel";

export function ProfileTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase leading-none tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Account{" "}
          <span className="font-serif lowercase italic text-cafe-accent">
            settings
          </span>
        </h1>
        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Manage your profile, password and security.
        </p>
      </div>

      <ClerkAccountPanel />
    </div>
  );
}
