# Project Definition — Pokhara Fire Station Internal App

> Step 1 of the build: define the thing before any code. This is the source of truth
> for scope, users, requirements, and the data model. Edit freely — nothing here is
> locked until we agree on it.

Status: **CONFIRMED (v1 scope)** — 2026-06-23

UI/brand name: **TBD** (placeholder "Station Ops" in code until decided).

---

## 1. Problem & purpose

Pokhara Fire Station staff need a simple internal app to (a) track the shared **mess
(kitchen) finances** fairly and transparently, and (b) keep an informational **record of
staff leave**. Today this is presumably done on paper/spreadsheets, which is error-prone,
hard to audit, and hard to share.

**Purpose:** one trustworthy place where staff log their own meals/expenses/leave, and
admins manage contributions, bills, and reimbursements with an auditable history.

## 2. Goals & success criteria

- A staff member can log a meal or submit an expense in **under 30 seconds**.
- Monthly mess totals (collected, spent, per-person owed) are **always reconcilable**.
- Every money/meal change is **attributable** (who did what, when).
- Access is correct: staff see their own data; admins manage; no privilege leaks.
- Works well on a **phone** (primary device for most staff).

## 3. Scope

### In scope (v1)
- **Mess Finance Tracker:** expenses, monthly contributions, bills, reimbursements,
  per-shift meal logging, monthly summary/close.
- **Leave Information Tracker:** staff log their own leave (informational only).
- **Auth + onboarding:** login, first-time profile setup (department, shift, phone).
- **Roles & administration:** staff / mess_admin / super_admin.

### Out of scope (v1) — explicitly not building yet
- Leave **approval workflow** or leave balances (leave is informational only).
- Payroll, payslips, or bank integration.
- Public-facing pages / external users.
- Native mobile apps (responsive web only).
- pwa
- Push/SMS notifications beyond in-app + the existing meal reminder.
-export feature

## 4. Users & roles

| Role | Who | Can do |
|------|-----|--------|
| **staff** (user) | every employee | log own meals, submit expenses, log own leave, view own contributions/bills, edit own profile |
| **mess_admin** (admin) | mess managers | everything staff can, **plus** manage expenses (approve/reject/reimburse), contributions, bills, and bulk meal logging |
| **super_admin** | station admin | everything, **plus** create accounts, assign roles, and correct any staff member's leave |

> **Confirmed:** staff account/role management is **super_admin-only**. mess_admin focuses
> on mess finance and does not manage accounts or roles.

## 5. Domain model (entities)

- **Department:** Fire, Airside.
- **Shift:** Morning (meal ~9:30 AM), Day (meal ~7:00 PM).
- **Staff profile:** name, department, default shift, phone, active flag, onboarded flag.
  A staff member can have **double duty** (more than one department/shift on a day).
- **Meal log:** one row = "this staff member ate this **shift's** meal on this date."
  Unique per (staff, date, shift) — a meal can never be logged twice. Admins can bulk-log
  but must **skip** anyone who already logged themselves.
- **Expense:** item, amount (NPR), BS date, who bought it, receipt, approval status,
  reimbursement status.
- **Contribution (advance / deposit):** per staff per BS month, default Rs. 3,000,
  amount paid, paid date. Paid up front; reconciled against the computed bill at close.
- **Monthly settlement (computed, per staff per BS month):** meal count, cost per meal,
  computed bill (= meals × cost per meal), and balance (= advance paid − computed bill;
  positive ⇒ refund, negative ⇒ amount still due). Not manually entered — derived from
  approved expenses + logged meals.
- **Leave record:** type (sick/casual/annual/other), BS start/end, reason, status
  (active/cancelled). Informational only.
- **Notification:** in-app messages (meal entries, expense requests, meal reminders).
- **Roles / user_roles:** role assignments per user.
- **BS calendar:** Bikram Sambat ↔ Gregorian date mapping (all dates shown in BS).

## 5a. Billing model (core of the mess module)

The mess runs on **post-paid cost sharing with an advance deposit**:

1. Each staff member pays an **advance** at the start of the BS month (default Rs. 3,000).
2. Through the month, admins log **approved expenses** and everyone logs **meals**.
3. The **cost per meal** for the month is:

   ```
   cost_per_meal = total_approved_expenses(month) ÷ total_meals_logged(month)
   ```

   (total_meals = sum of every staff member's meals that month). This is **recomputed
   live every day** and shown on the dashboard, so the number is a running figure that
   firms up as the month progresses.

4. At month close, each staff member's **bill** is:

   ```
   staff_bill = staff_meal_count(month) × cost_per_meal(month)
   ```

5. **Reconciliation** against their advance:

   ```
   balance = advance_paid − staff_bill
   balance > 0 ⇒ refund to staff   |   balance < 0 ⇒ staff owes the difference
   ```

**Edge cases to handle:** zero total meals (cost_per_meal undefined → show "—", no bills);
expenses approved/rejected after meals are logged (figures shift — that's expected, hence
"approved expenses only"); rounding (round per-meal to 2 dp, show exact totals).

## 6. Functional requirements (by module)

### Dashboard (everyone) — daily
- **Today's running cost per meal** for the current BS month (approved expenses ÷ total
  meals), updated as data is logged. Headline number.
- Staff's own running figures: meals this month, **running bill estimate** (their meals ×
  current cost per meal), advance paid, and projected balance (refund / due).

### Mess — staff
- Log a meal: pick shift + BS date (defaults to their shift). One per shift/day.
- Submit an expense with optional receipt image.
- View own advance, running bill estimate, and month-end balance.

### Mess — admin (mess_admin / super_admin)
- Review expenses: approve / reject / edit / soft-delete; mark reimbursed.
- Record each staff member's monthly **advance** (default Rs. 3,000) and paid date.
- Bulk-log meals: by date range (one staff) or by whole shift (all/department), skipping
  self-logged entries.
- **Monthly summary / close:** total approved expenses, total meals, cost per meal, and a
  per-person breakdown showing meals, computed bill, advance, and balance (refund/due).
  The bill is **computed**, not hand-entered.

### Leave
- Staff: create/edit/cancel **their own** leave any time (full control of own records).
- super_admin: correct any staff member's leave.

### Auth & onboarding
- Login by username (mapped to email) or email + password.
- Seeded accounts: `superadmin` / `admin` for bootstrap.
- First login → onboarding (name, phone, department, default shift) before app access.

## 7. Non-functional requirements

- **Platform:** responsive web, mobile-first.
- **Security:** role checks on server *and* row-level security in the database; secrets
  never client-exposed; input validated everywhere.
- **Auditability:** money/meal mutations recorded with actor + timestamp.
- **Accessibility:** WCAG AA — labels, contrast, keyboard nav, focus states.
- **Performance:** fast on a mid-range phone over mobile data.
- **Dates:** all user-facing dates in Bikram Sambat (BS); store the BS↔AD mapping.
- **Localization:** English UI, NPR currency, Asia/Kathmandu timezone.

## 8. Key user flows

1. **First login:** sign in → onboarding wizard (details → department/shift) → dashboard.
2. **Log a meal:** dashboard → Mess → Meals → pick shift/date → done.
3. **Submit an expense:** Mess → Expenses → fill form + receipt → submitted (pending).
4. **Admin month close:** Manage mess → review expenses → record contributions/bills →
   view monthly summary.
5. **Log leave:** Leave → new record → appears in own list (no approval needed).

## 9. Decisions (resolved 2026-06-23)

1. **Scope:** both modules (Mess Finance + Leave) in v1. ✅
2. **Staff management:** super_admin-only. ✅
3. **Meal value:** simple "ate / didn't" per shift (no plate counts). ✅
4. **App/brand name:** TBD — use placeholder "Station Ops" in code until decided.
5. **Billing:** advance deposit (Rs 3,000) reconciled at close against computed bill
   (meals × cost-per-meal); bill is computed, not hand-entered. ✅
6. **Live cost per meal** on the dashboard daily, based on **approved expenses only**. ✅
