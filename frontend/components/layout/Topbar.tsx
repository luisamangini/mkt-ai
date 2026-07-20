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
    <header className="flex h-12 shrink-0 items-center border-b border-gray-200 bg-white px-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <span>ConsorIA</span>
        <span className="text-gray-300">&gt;</span>
        <span className="font-medium text-gray-900">{label}</span>
      </nav>
    </header>
  );
}
