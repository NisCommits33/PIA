import { requireSuperAdmin } from "@/lib/roles";
import { SubNav, type NavItem } from "@/components/sub-nav";

const staffNav: NavItem[] = [
  { href: "/dashboard/staff", label: "Accounts", icon: "staff" },
  { href: "/dashboard/staff/leave", label: "Staff leave", icon: "leave" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  // Staff management is super_admin-only.
  await requireSuperAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface p-2 shadow-sm">
        <SubNav items={staffNav} />
      </div>
      {children}
    </div>
  );
}
