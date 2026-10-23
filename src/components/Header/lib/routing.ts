import { ADMIN_PATH, DASHBOARD_PATH, SETTINGS_PATH } from "../constants";

export function getDashboardPath(isAdmin: boolean): string {
  return isAdmin ? ADMIN_PATH : DASHBOARD_PATH;
}

export function getDashboardLabel(isAdmin: boolean): string {
  return isAdmin ? "Admin Panel" : "Dashboard";
}

const DASHBOARD_ROUTES = [DASHBOARD_PATH, SETTINGS_PATH, ADMIN_PATH];

export function isDashboardArea(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  return DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
