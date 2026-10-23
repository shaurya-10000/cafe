import { Mail } from "lucide-react";
import { AvatarButton } from "./AvatarButton";

interface ProfileIdentityProps {
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly initial: string;
  readonly onChangePhoto: () => void;
}

export function ProfileIdentity({
  name,
  email,
  avatarUrl,
  initial,
  onChangePhoto,
}: ProfileIdentityProps) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-center">
      <AvatarButton
        avatarUrl={avatarUrl}
        initial={initial}
        onClick={onChangePhoto}
      />

      <div className="space-y-1">
        <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          {name || "User Name"}
        </h2>
        <div className="flex items-center gap-2 text-zinc-500">
          <Mail size={16} className="text-cafe-accent" aria-hidden="true" />
          <span className="text-sm font-bold lowercase">{email}</span>
        </div>
      </div>
    </div>
  );
}
