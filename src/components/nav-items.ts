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
  { to: "/", short: "Панель", label: "Главная панель", icon: LayoutDashboard },
  { to: "/analysis", short: "Анализ", label: "Анализ показаний", icon: Activity },
  { to: "/journal", short: "Журнал", label: "Архив событий", icon: ClipboardList },
  { to: "/defects", short: "Дефекты", label: "Диагностика дефектов", icon: ScanSearch },
  { to: "/training", short: "Обучение", label: "Обучение оператора", icon: GraduationCap },
  { to: "/reference", short: "Техбаза", label: "Техническая база", icon: BookOpen },
  { to: "/analytics", short: "Аналитика", label: "Архив и аналитика", icon: BarChart3 },
] as const;

/** First four go to the iPhone bottom bar; the rest live in the "Ещё" sheet. */
export const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);

export function isNavActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}
