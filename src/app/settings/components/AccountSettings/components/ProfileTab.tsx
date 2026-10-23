import { useReducedMotion } from "framer-motion";
import { useClerk, useUser } from "@clerk/nextjs";
import { useProfile } from "../hooks/useProfile";
import { useProfileForm } from "../hooks/useProfileForm";
import { getInitial } from "../lib/name";
import { FeedbackBanner } from "./FeedbackBanner";
import { FullNameField } from "./FullNameField";
import { ProfileIdentity } from "./ProfileIdentity";
import { SaveProfileButton } from "./SaveProfileButton";

export function ProfileTab() {
  const { user } = useUser();
  const clerk = useClerk();
  const reducedMotion = useReducedMotion() ?? false;

  const { profile, loading, patchProfile } = useProfile(user?.id ?? null);
  const form = useProfileForm({
    user: user ?? null,
    profile,
    profileLoading: loading,
    patchProfile,
  });

  const email = user?.primaryEmailAddress?.emailAddress || profile?.email || "";
  const avatarUrl = user?.imageUrl || profile?.avatar_url || null;
  const initial = getInitial(form.normalizedName, email);

  const saveDisabled =
    form.saving || loading || !form.isNameValid || !form.isDirty;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-5xl">
          Account{" "}
          <span className="font-serif lowercase italic text-cafe-accent">
            settings
          </span>
        </h1>
        <p className="mt-4 font-medium text-zinc-500 dark:text-zinc-400">
          Manage your account preferences and digital presence.
        </p>
      </div>

      <FeedbackBanner
        banner={form.banner}
        onDismiss={form.dismissBanner}
        reducedMotion={reducedMotion}
      />

      <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-200/50 dark:border-white/5 dark:bg-zinc-900 dark:shadow-none md:p-10">
        <ProfileIdentity
          name={form.normalizedName}
          email={email}
          avatarUrl={avatarUrl}
          initial={initial}
          onChangePhoto={() => clerk.openUserProfile()}
        />

        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-zinc-100 pt-10 dark:border-white/5">
          <FullNameField
            value={form.fullName}
            onChange={form.setFullName}
            disabled={loading}
            isValid={form.isNameValid}
            showBlankError={form.showBlankError}
          />
        </div>

        <div className="mt-10 flex justify-end">
          <SaveProfileButton
            saving={form.saving}
            disabled={saveDisabled}
            onClick={() => void form.save()}
          />
        </div>
      </div>
    </div>
  );
}
