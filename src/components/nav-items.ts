import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ScanSearch,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", short: "Главная", label: "Главная", icon: LayoutDashboard },
  { to: "/analysis", short: "Показания", label: "Показания", icon: Activity },
  { to: "/journal", short: "Журнал", label: "Журнал событий", icon: ClipboardList },
  { to: "/defects", short: "Дефекты", label: "Дефекты", icon: ScanSearch },
  { to: "/training", short: "Обучение", label: "Обучение", icon: GraduationCap },
  { to: "/reference", short: "Справочник", label: "Справочник", icon: BookOpen },
  { to: "/analytics", short: "Аналитика", label: "Аналитика и экспорт", icon: BarChart3 },
] as const;

/** First four go to the iPhone bottom bar; the rest live in the "Ещё" sheet. */
export const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);

export function isNavActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}
