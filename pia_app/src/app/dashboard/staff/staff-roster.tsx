"use client";

import { useMemo, useState } from "react";
import {
  Users,
  ShieldPlus,
  ShieldMinus,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

import type { AppRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionButton } from "@/components/ui/action-button";
import { FilterToolbar } from "@/components/filter-toolbar";
import { setRole, setActive } from "./actions";

/** The default login password for an account, derived from its username. */
function defaultPassword(username: string): string {
  return `${username}2026`;
}

/** Super-admin-only reveal/copy control for an account's default password. */
function PasswordReveal({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-foreground">
        {shown ? value : "••••••••"}
      </code>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="rounded p-0.5 text-muted transition-colors hover:text-foreground"
      >
        {shown ? (
          <EyeOff aria-hidden className="size-3.5" />
        ) : (
          <Eye aria-hidden className="size-3.5" />
        )}
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy password"
        className="rounded p-0.5 text-muted transition-colors hover:text-foreground"
      >
        {copied ? (
          <Check aria-hidden className="size-3.5 text-success" />
        ) : (
          <Copy aria-hidden className="size-3.5" />
        )}
      </button>
    </span>
  );
}

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
      <EmptyState
        icon={Users}
        title="No accounts yet"
        description="Create the first staff account above."
      />
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
        <EmptyState
          icon={Users}
          title="No matching accounts"
          description="Try a different search or filter."
        />
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
                {canManageRoles && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>
                      User:{" "}
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-foreground">
                        {p.username}
                      </code>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      Pass: <PasswordReveal value={defaultPassword(p.username)} />
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canManageRoles && (
                  <>
                    <ActionButton
                      action={() => setRole(p.id, "mess_admin", !p.isMessAdmin)}
                      disabled={p.isSuperAdmin}
                      successMessage={p.isMessAdmin ? "Mess admin removed" : "Mess admin granted"}
                    >
                      {p.isMessAdmin ? (
                        <>
                          <ShieldMinus aria-hidden className="size-4" /> Mess admin
                        </>
                      ) : (
                        <>
                          <ShieldPlus aria-hidden className="size-4" /> Mess admin
                        </>
                      )}
                    </ActionButton>

                    <ActionButton
                      action={() => setRole(p.id, "super_admin", !p.isSuperAdmin)}
                      disabled={p.isSelf && p.isSuperAdmin}
                      title={
                        p.isSelf && p.isSuperAdmin
                          ? "You can't remove your own super admin"
                          : undefined
                      }
                      successMessage={
                        p.isSuperAdmin ? "Super admin removed" : "Super admin granted"
                      }
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
                    </ActionButton>
                  </>
                )}

                <ActionButton
                  action={() => setActive(p.id, !p.isActive)}
                  variant={p.isActive ? "danger" : "secondary"}
                  disabled={p.isSelf || (p.isSuperAdmin && !canManageRoles)}
                  title={
                    p.isSelf
                      ? "You can't deactivate yourself"
                      : p.isSuperAdmin && !canManageRoles
                        ? "Only a super admin can manage super admin accounts"
                        : undefined
                  }
                  successMessage={p.isActive ? "Account deactivated" : "Account activated"}
                  confirm={
                    p.isActive
                      ? {
                          title: "Deactivate account?",
                          body: `${p.name || p.username} won't be able to sign in until reactivated.`,
                          confirmLabel: "Deactivate",
                        }
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
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
