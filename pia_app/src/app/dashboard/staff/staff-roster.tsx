"use client";

import { useMemo, useState } from "react";
import { Users, ShieldPlus, ShieldMinus, Power, PowerOff } from "lucide-react";

import type { AppRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/filter-toolbar";
import { setRole, setActive } from "./actions";

export type StaffRow = {
  id: string;
  name: string;
  username: string;
  deptLabel: string;
  isActive: boolean;
  isMessAdmin: boolean;
  isSuperAdmin: boolean;
  isSelf: boolean;
};

type RoleFilter = "all" | AppRole | "staff";
type StatusFilter = "all" | "active" | "inactive";

export function StaffRoster({
  rows,
  canManageRoles,
}: {
  rows: StaffRow[];
  canManageRoles: boolean;
}) {
  const [search, setSearch] = useState("");
  const [role, setRoleFilter] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.username.toLowerCase().includes(q)) {
        return false;
      }
      if (role === "super_admin" && !r.isSuperAdmin) return false;
      if (role === "mess_admin" && (!r.isMessAdmin || r.isSuperAdmin)) return false;
      if (role === "staff" && (r.isMessAdmin || r.isSuperAdmin)) return false;
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;
      return true;
    });
  }, [rows, search, role, status]);

  if (rows.length === 0) {
    return (
      <EmptyState icon={Users} title="No accounts yet" description="Create the first staff account above." />
    );
  }

  return (
    <>
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search name or username…"
        count={filtered.length}
        total={rows.length}
        noun="account"
      >
        <Select
          aria-label="Filter by role"
          value={role}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="h-11 w-auto"
        >
          <option value="all">All roles</option>
          <option value="staff">Staff</option>
          <option value="mess_admin">Mess admin</option>
          <option value="super_admin">Super admin</option>
        </Select>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-11 w-auto"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No matching accounts" description="Try a different search or filter." />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {p.name || p.username || "Unnamed"}
                  </span>
                  {p.isSuperAdmin ? (
                    <Badge tone="primary">Super admin</Badge>
                  ) : p.isMessAdmin ? (
                    <Badge tone="accent">Mess admin</Badge>
                  ) : (
                    <Badge tone="neutral">Staff</Badge>
                  )}
                  {!p.isActive && <Badge tone="danger">Inactive</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {p.username} · {p.deptLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canManageRoles && (
                  <>
                    <form action={setRole.bind(null, p.id, "mess_admin", !p.isMessAdmin)}>
                      <Button type="submit" variant="secondary" size="sm" disabled={p.isSuperAdmin}>
                        {p.isMessAdmin ? (
                          <>
                            <ShieldMinus aria-hidden className="size-4" /> Mess admin
                          </>
                        ) : (
                          <>
                            <ShieldPlus aria-hidden className="size-4" /> Mess admin
                          </>
                        )}
                      </Button>
                    </form>

                    <form action={setRole.bind(null, p.id, "super_admin", !p.isSuperAdmin)}>
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={p.isSelf && p.isSuperAdmin}
                        title={p.isSelf && p.isSuperAdmin ? "You can't remove your own super admin" : undefined}
                      >
                        {p.isSuperAdmin ? (
                          <>
                            <ShieldMinus aria-hidden className="size-4" /> Super admin
                          </>
                        ) : (
                          <>
                            <ShieldPlus aria-hidden className="size-4" /> Super admin
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}

                <form action={setActive.bind(null, p.id, !p.isActive)}>
                  <Button
                    type="submit"
                    variant={p.isActive ? "danger" : "secondary"}
                    size="sm"
                    disabled={p.isSelf || (p.isSuperAdmin && !canManageRoles)}
                    title={
                      p.isSelf
                        ? "You can't deactivate yourself"
                        : p.isSuperAdmin && !canManageRoles
                          ? "Only a super admin can manage super admin accounts"
                          : undefined
                    }
                  >
                    {p.isActive ? (
                      <>
                        <PowerOff aria-hidden className="size-4" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power aria-hidden className="size-4" /> Activate
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
