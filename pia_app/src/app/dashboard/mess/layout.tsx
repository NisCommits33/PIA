import { requireMessAdmin } from "@/lib/roles";
import { SubNav, type NavItem } from "@/components/sub-nav";

const messNav: NavItem[] = [
  { href: "/dashboard/mess", label: "Overview", icon: "mess" },
  { href: "/dashboard/mess/expenses", label: "Review expenses", icon: "expenses" },
  { href: "/dashboard/mess/meals", label: "Bulk meals", icon: "meals" },
  { href: "/dashboard/mess/contributions", label: "Advances", icon: "wallet" },
  { href: "/dashboard/mess/settlement", label: "Settlement", icon: "settlement" },
];

export default async function MessLayout({ children }: { children: React.ReactNode }) {
  // Guards the whole mess admin section (non-admins are redirected away).
  await requireMessAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface p-2 shadow-sm">
        <SubNav items={messNav} />
      </div>
      {children}
    </div>
  );
}
