"use client";

import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/crm": "CRM",
  "/research": "Pesquisa",
  "/content": "Conteúdo",
  "/calendar": "Calendário",
  "/campanhas": "Campanhas",
  "/configuracoes": "Configurações",
};

export function Topbar() {
  const pathname = usePathname();
  const label = routeLabels[pathname] ?? "Dashboard";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-6">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>ConsorIA</span>
        <span className="text-border">&gt;</span>
        <span className="font-medium text-foreground">{label}</span>
      </nav>
    </header>
  );
}
