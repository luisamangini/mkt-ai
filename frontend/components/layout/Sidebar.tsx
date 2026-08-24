"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Search,
  Settings,
  Users,
} from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  userLabel: string;
  onLogout: () => void;
};

const navigationSections = [
  {
    label: "VISÃO GERAL",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "PRODUÇÃO",
    items: [
      { label: "Pesquisa", href: "/research", icon: Search },
      { label: "Conteúdo", href: "/content", icon: FileText },
      { label: "Calendário", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { label: "CRM", href: "/crm", icon: Users },
      { label: "Campanhas", href: "/campanhas", icon: Megaphone },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggle,
  userLabel,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out ${
        collapsed ? "w-[76px]" : "w-[252px]"
      }`}
    >
      <div
        className={`flex h-16 items-center border-b border-sidebar-border ${
          collapsed ? "justify-center px-3" : "justify-between px-4"
        }`}
      >
        <Link
          href="/"
          className={collapsed ? "sr-only" : "block min-w-0"}
        >
          <div className="text-sm font-semibold leading-none text-sidebar-foreground">
            ConsorIA
          </div>
          <div className="mt-1 text-[11px] leading-none text-muted-foreground">
            Agentes de Marketing
          </div>
        </Link>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>
      </div>

      <nav
        className={`min-h-0 flex-1 overflow-y-auto py-4 ${
          collapsed ? "px-3" : "px-3"
        }`}
      >
        <div className="space-y-5">
          {navigationSections.map((section) => (
            <div key={section.label}>
              {!collapsed ? (
                <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {section.label}
                </div>
              ) : null}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex h-8 items-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        collapsed ? "justify-center px-0" : "gap-2 px-2"
                      } ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div
        className={`shrink-0 border-t border-sidebar-border py-3 ${
          collapsed ? "px-3" : "px-4"
        }`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium leading-4 text-sidebar-foreground">
                {userLabel}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair"
              title="Sair"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
