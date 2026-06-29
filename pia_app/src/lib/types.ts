/**
 * Domain types mirroring the database enums (migrations 0001).
 * Replace/augment with generated types once `supabase gen types` is wired up.
 */
export type AppRole = "staff" | "mess_admin" | "super_admin";
export type Department = "fire" | "airside";
export type ShiftType = "morning" | "day";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type LeaveType = "sick" | "casual" | "annual" | "other";
export type LeaveStatus = "active" | "cancelled";

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "fire", label: "Fire" },
  { value: "airside", label: "Airside" },
];

export const SHIFTS: { value: ShiftType; label: string; mealLabel: string }[] = [
  { value: "morning", label: "Morning", mealLabel: "Meal ~9:30 AM" },
  { value: "day", label: "Day", mealLabel: "Meal ~7:00 PM" },
];

export const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "casual", label: "Casual" },
  { value: "annual", label: "Annual" },
  { value: "other", label: "Other" },
];

export type Profile = {
  full_name: string | null;
  phone: string | null;
  department: Department | null;
  default_shift: ShiftType | null;
  is_active: boolean;
  onboarded: boolean;
};
