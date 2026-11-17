import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BOTTOM_NAV, NAV_ITEMS, isNavActive } from "./nav-items";
import { DemoBadge, SAFETY_TEXT, SafetyStrip } from "./notices";
import { store, useAppData } from "@/lib/store";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-sm border border-primary/60 bg-primary/10 font-display text-sm font-bold text-primary glow-primary">
        SM
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold tracking-[0.14em] text-foreground">STEELMIND</span>
        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Помощник оператора ГПС</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const data = useAppData();
  const hasDemo = data.events.some((e) => e.demo) || data.readings.some((r) => r.demo);

  useEffect(() => {
    try {
      store.ensureSeeded();
    } catch {
      /* storage unavailable — app still works read-only */
    }
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh bg-background scada-grid">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <Brand />
        </div>
        <nav className="flex-1 space-y-0.5 p-2" aria-label="Разделы">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-sidebar-accent text-primary"
                    : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="border-t border-sidebar-border p-4 text-[11px] leading-snug text-muted-foreground">{SAFETY_TEXT}</p>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4">
            <div className="md:hidden">
              <Brand />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {hasDemo && <DemoBadge label="ДЕМО" className="sm:hidden" />}
              {hasDemo && <DemoBadge className="hidden sm:inline-flex" />}
              <span className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                Оборудование не подключено · справочный режим
              </span>
            </div>
          </div>
          <SafetyStrip />
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:pb-12">{children}</main>
      </div>

      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const active = isNavActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />}
                <item.icon className="size-5" />
                {item.short}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
              NAV_ITEMS.slice(4).some((i) => isNavActive(pathname, i.to)) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Menu className="size-5" />
            Ещё
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-xl border-border bg-popover pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display uppercase tracking-wider">Все разделы</SheetTitle>
            <SheetDescription>STEELMIND — справочно-аналитический помощник</SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border px-3 py-3 text-sm",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-panel text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] leading-snug text-muted-foreground">{SAFETY_TEXT}</p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
