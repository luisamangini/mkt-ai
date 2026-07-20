"use client";

import { useState } from "react";
import { Bell, Plus, RefreshCw } from "lucide-react";

import { CrmBoard } from "@/components/crm/CrmBoard";
import { LeadDetailsPanel } from "@/components/crm/LeadDetailsPanel";
import type { Lead } from "@/types/crm";

export default function CrmPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <div className="flex min-h-[calc(100vh-96px)] min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-end gap-3 border-b border-black/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-[#717182] hover:bg-gray-50"
            aria-label="Notificações"
          >
            <span className="flex items-start gap-0.5">
              <Bell className="h-4 w-4" strokeWidth={1.8} />
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
          </button>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-[11px] font-medium text-[#0A0A0A] hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
            Sincronizar
          </button>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Novo
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section
          className={`min-h-0 ${
            selectedLead ? "min-w-0 flex-1" : "w-full"
          }`}
        >
          <CrmBoard
            compact={Boolean(selectedLead)}
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
          />
        </section>

        {selectedLead ? (
          <LeadDetailsPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
