import type { TenantUser } from "../../types";

function getInitials(first_name: string, last_name: string): string {
  const first = first_name ? first_name[0] : "";
  const last = last_name ? last_name[0] : "";
  return (
    (first + last).toUpperCase().slice(0, 2) ||
    first_name.slice(0, 2).toUpperCase()
  );
}

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
];

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface UserAvatarProps {
  user: Pick<TenantUser, "first_name" | "last_name" | "name">;
}

export function UserAvatar({ user }: UserAvatarProps) {
  const colors = hashColor(user.name);
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.name;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${colors.bg} ${colors.text}`}
        aria-hidden="true"
      >
        {getInitials(user.first_name, user.last_name)}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {displayName}
        </p>
      </div>
    </div>
  );
}
