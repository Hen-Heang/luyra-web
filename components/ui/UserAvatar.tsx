import Link from "next/link";

import { cn } from "@/lib/utils";

type UserAvatarProps = {
  /** Tailwind sizing/shape overrides for the avatar box. */
  className?: string;
  /** When set, the avatar becomes a link (e.g. to account settings). */
  href?: string;
  /** Accessible label / tooltip. */
  title?: string;
  /** Signed-in user's email, used to derive the initials fallback. */
  email?: string | null;
};

function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return "?";
  return email.split("@")[0]!.slice(0, 2).toUpperCase();
}

/** The signed-in user's initials in a colored badge. No photo upload — that's out of scope here. */
export function UserAvatar({ className, href, title = "Your account", email }: UserAvatarProps) {
  const box = cn(
    "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm ring-1 ring-border/50",
    className
  );

  const inner = <span>{initialsFromEmail(email)}</span>;

  if (href) {
    return (
      <Link href={href} title={title} aria-label={title} className={box}>
        {inner}
      </Link>
    );
  }

  return (
    <span title={title} className={box}>
      {inner}
    </span>
  );
}
