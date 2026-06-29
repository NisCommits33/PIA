import { isSuperAdmin, requireMessAdmin } from "@/lib/roles";
import { SubNav, type NavItem } from "@/components/sub-nav";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  // Accounts are managed by mess_admin+; role grants and staff-leave are super_admin-only.
  const ctx = await requireMessAdmin();

  const staffNav: NavItem[] = [{ href: "/dashboard/staff", label: "Accounts", icon: "staff" }];
  if (isSuperAdmin(ctx)) {
    staffNav.push({ href: "/dashboard/staff/leave", label: "Staff leave", icon: "leave" });
  }

  return (
    <div className="flex flex-col gap-5">
      {staffNav.length > 1 && (
        <div className="rounded-xl border border-border bg-surface p-2 shadow-sm">
          <SubNav items={staffNav} />
        </div>
      )}
      {children}
    </div>
  );
}
