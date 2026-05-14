import type { UserInfo } from "../types";

export type AppRole = "customer" | "developer" | "admin";

const ROLE_ORDER: AppRole[] = ["customer", "developer", "admin"];

export const APP_ROLE_LABEL: Record<AppRole, string> = {
  customer: "CUSTOMER",
  developer: "DEVELOPER",
  admin: "ADMIN",
};

export const APP_ROLE_TITLE: Record<AppRole, string> = {
  customer: "Khách hàng",
  developer: "Nhà phát triển",
  admin: "Quản trị viên",
};

export function getAvailableRoles(user: UserInfo): AppRole[] {
  const roles: AppRole[] = ["customer"];
  if (user.roles.includes("DEVELOPER")) roles.push("developer");
  if (user.roles.includes("ADMIN")) roles.push("admin");
  return roles;
}

export function normalizeActiveRole(saved: string | null, available: AppRole[]): AppRole {
  if (saved && available.includes(saved as AppRole)) {
    return saved as AppRole;
  }
  return available[0] ?? "customer";
}

export function toggleRole(current: AppRole, available: AppRole[]): AppRole {
  if (available.length !== 2) return current;
  return available.find((role) => role !== current) ?? current;
}

export function defaultMenuForRole(role: AppRole): string {
  switch (role) {
    case "admin":
      return "admin-dashboard";
    case "developer":
      return "developer";
    default:
      return "deposit";
  }
}

export function sortRoles(roles: AppRole[]): AppRole[] {
  return ROLE_ORDER.filter((role) => roles.includes(role));
}
