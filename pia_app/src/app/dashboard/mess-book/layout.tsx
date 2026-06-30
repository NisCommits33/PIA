import { SubNav, type NavItem } from "@/components/sub-nav";

const messBookNav: NavItem[] = [
  { href: "/dashboard/mess-book", label: "Ledger", icon: "messbook" },
  { href: "/dashboard/mess-book/activity", label: "Activity", icon: "activity" },
];

export default function MessBookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface p-2 shadow-sm">
        <SubNav items={messBookNav} />
      </div>
      {children}
    </div>
  );
}
