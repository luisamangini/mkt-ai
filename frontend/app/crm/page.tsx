"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Plus, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CrmBoard } from "@/components/crm/CrmBoard";
import { LeadDetailsPanel } from "@/components/crm/LeadDetailsPanel";
import { createLead, deleteLead, fetchCrmLeads, updateLead, updateLeadStatus } from "@/services/crm";
import type { CreateLeadInput, Lead, LeadStage } from "@/types/crm";

const emptyLead: CreateLeadInput = { name: "", whatsapp: "", source: "outro", stage: "novo" };

const amountOptions = [
  { value: 100000, label: "Até R$ 100 mil" },
  { value: 250000, label: "R$ 100 mil a R$ 250 mil" },
  { value: 500000, label: "R$ 250 mil a R$ 500 mil" },
  { value: 1000000, label: "R$ 500 mil a R$ 1 milhão" },
  { value: 1000001, label: "Acima de R$ 1 milhão" },
];

const stageOptions: Array<{ value: LeadStage; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "qualificado", label: "Qualificado" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const sourceOptions = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "instagram_organico", label: "Instagram orgânico" },
  { value: "indicacao", label: "Indicação" },
  { value: "direct", label: "Direct" },
  { value: "outro", label: "Outra origem" },
];

const deadlineOptions = [
  { value: "imediato", label: "Imediatamente" },
  { value: "1_ano", label: "Até 1 ano" },
  { value: "2_anos", label: "Em até 2 anos" },
  { value: "sem_pressa", label: "Sem pressa" },
];

const consortiumOptions = [
  { value: "sim", label: "Sim" },
  { value: "parcialmente", label: "Conhece pouco / superficialmente" },
  { value: "nao", label: "Não" },
];

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateLeadInput>(emptyLead);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await fetchCrmLeads();
      setLeads(result);
      setSelectedLead((current) => current ? result.find((lead) => lead.id === current.id) ?? null : null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar o CRM."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadLeads); }, [loadLeads]);

  async function handleLeadStatusChange(leadId: string, status: LeadStage) {
    const previous = leads.find((lead) => lead.id === leadId);
    if (!previous || previous.stage === status) return;

    setError("");
    setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, stage: status } : lead));
    setSelectedLead((current) => current?.id === leadId ? { ...current, stage: status } : current);
    try {
      const response = await updateLeadStatus(leadId, status);
      const updated = { ...previous, ...response, inactiveDays: 0, needsFollowup: false, lastActivity: new Date().toISOString() };
      setLeads((current) => current.map((lead) => lead.id === leadId ? updated : lead));
      setSelectedLead((current) => current?.id === leadId ? updated : current);
    } catch (cause) {
      setLeads((current) => current.map((lead) => lead.id === leadId ? previous : lead));
      setSelectedLead((current) => current?.id === leadId ? previous : current);
      setError("Não foi possível mover o lead. A alteração foi desfeita.");
      throw cause;
    }
  }

  async function handleSelectedLeadStatusChange(status: LeadStage) {
    if (!selectedLead) return;
    await handleLeadStatusChange(selectedLead.id, status);
  }

  function openEditor(lead: Lead) {
    setEditingLeadId(lead.id);
    setDraft({ name: lead.name, whatsapp: lead.whatsapp, email: lead.email, source: lead.source, stage: lead.stage, objective: lead.objective, amount: lead.amount, usageDeadline: lead.usageDeadline, knowsConsortium: lead.knowsConsortium, notes: lead.notes });
    setCreateError("");
    setNewOpen(true);
  }

  async function handleSave() {
    if (!draft.name.trim() || !draft.whatsapp.trim()) return;
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setCreateError("Informe um e-mail válido.");
      return;
    }
    setCreating(true); setCreateError("");
    try {
      const input = { ...draft, name: draft.name.trim(), whatsapp: draft.whatsapp.trim() };
      if (editingLeadId) {
        const previous = leads.find((lead) => lead.id === editingLeadId);
        const response = await updateLead(editingLeadId, input);
        let updated = { ...previous, ...response, stage: previous?.stage ?? input.stage, inactiveDays: previous?.inactiveDays ?? 0, needsFollowup: previous?.needsFollowup };
        if (previous && previous.stage !== input.stage) {
          const statusResponse = await updateLeadStatus(editingLeadId, input.stage);
          updated = { ...updated, ...statusResponse, inactiveDays: 0, needsFollowup: false, lastActivity: new Date().toISOString() };
        }
        setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
        setSelectedLead(updated);
      } else {
        const created = await createLead(input);
        setLeads((current) => [created, ...current.filter((lead) => lead.id !== created.id)]);
        setSelectedLead(created);
      }
      setDraft(emptyLead); setEditingLeadId(null); setNewOpen(false);
    } catch (cause) { setCreateError(cause instanceof Error ? cause.message : editingLeadId ? "Não foi possível editar o lead." : "Não foi possível criar o lead."); }
    finally { setCreating(false); }
  }

  async function handleDelete(leadId: string) {
    await deleteLead(leadId);
    setLeads((current) => current.filter((lead) => lead.id !== leadId));
    setSelectedLead(null);
  }

  function handleLeadActivity(leadId: string) {
    const lastActivity = new Date().toISOString();
    setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, lastActivity, inactiveDays: 0, needsFollowup: false } : lead));
    setSelectedLead((current) => current?.id === leadId ? { ...current, lastActivity, inactiveDays: 0, needsFollowup: false } : current);
  }

  return <div className="flex min-h-[calc(100vh-96px)] min-w-0 flex-1 flex-col">
    <header className="flex flex-wrap items-center justify-end gap-3 border-b border-border px-5 py-4">
      <button type="button" onClick={() => void loadLeads()} disabled={loading} className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-[11px] font-medium hover:bg-muted disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Sincronizar</button>
      <button type="button" onClick={() => { setEditingLeadId(null); setDraft(emptyLead); setCreateError(""); setNewOpen(true); }} className="flex h-9 items-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"><Plus className="h-3.5 w-3.5" />Novo</button>
    </header>
    {error ? <div className="m-5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-500">{error}</div> : null}
    {loading && !leads.length ? <div className="p-5 text-[11px] text-muted-foreground">Carregando leads...</div> : null}
    {!loading && !error && !leads.length ? <div className="p-5 text-[11px] text-muted-foreground">Nenhum lead encontrado.</div> : null}
    <div className="flex min-h-0 flex-1 overflow-hidden"><section className={selectedLead ? "min-h-0 min-w-0 flex-1" : "min-h-0 w-full"}><CrmBoard compact={Boolean(selectedLead)} leads={leads} selectedLead={selectedLead} onSelectLead={setSelectedLead} onMoveLead={handleLeadStatusChange} /></section>{selectedLead ? <LeadDetailsPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={handleSelectedLeadStatusChange} onEdit={() => openEditor(selectedLead)} onDelete={() => handleDelete(selectedLead.id)} onActivity={() => handleLeadActivity(selectedLead.id)} /> : null}</div>

    {newOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[10px] bg-card p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{editingLeadId ? "Editar lead" : "Novo lead"}</h2><button type="button" onClick={() => setNewOpen(false)} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><div className="mt-4 space-y-3">
      <Field label="Nome *"><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="field" /></Field>
      <Field label="WhatsApp *"><input value={draft.whatsapp} onChange={(event) => setDraft((current) => ({ ...current, whatsapp: event.target.value }))} className="field" /></Field>
      <Field label="Email"><input type="email" value={draft.email ?? ""} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value || undefined }))} className="field" /></Field>
      <Field label="Origem"><FormSelect value={draft.source} options={sourceOptions} onChange={(value) => setDraft((current) => ({ ...current, source: value }))} /></Field>
      <Field label="Objetivo"><input value={draft.objective ?? ""} onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value || undefined }))} className="field" /></Field>
      <Field label="Valor da carta"><FormSelect value={draft.amount?.toString() ?? ""} placeholder="Selecione uma faixa" options={amountOptions.map((option) => ({ ...option, value: option.value.toString() }))} onChange={(value) => setDraft((current) => ({ ...current, amount: value ? Number(value) : undefined }))} /></Field>
      <Field label="Prazo de uso"><FormSelect value={draft.usageDeadline ?? ""} placeholder="Selecione um prazo" options={deadlineOptions} onChange={(value) => setDraft((current) => ({ ...current, usageDeadline: value || undefined }))} /></Field>
      <Field label="Conhece consórcio"><FormSelect value={draft.knowsConsortium ?? ""} placeholder="Selecione uma opção" options={consortiumOptions} onChange={(value) => setDraft((current) => ({ ...current, knowsConsortium: value || undefined }))} /></Field>
      <Field label="Status"><FormSelect value={draft.stage} options={stageOptions} onChange={(value) => setDraft((current) => ({ ...current, stage: value as LeadStage }))} /></Field>
      <Field label="Observações"><textarea rows={3} value={draft.notes ?? ""} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value || undefined }))} className="field" /></Field>
    </div>{createError ? <p className="mt-3 text-[11px] text-red-500">{createError}</p> : null}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setNewOpen(false)} disabled={creating} className="h-9 rounded-md border border-border px-4 text-[11px]">Cancelar</button><button type="button" onClick={() => void handleSave()} disabled={creating || !draft.name.trim() || !draft.whatsapp.trim()} className="h-9 rounded-md bg-[#030213] px-4 text-[11px] text-white disabled:opacity-50">{creating ? "Salvando..." : editingLeadId ? "Salvar alterações" : "Criar lead"}</button></div></div></div> : null}
    <style jsx>{`.field { margin-top: 0.25rem; min-height: 2.25rem; width: 100%; border-radius: 0.375rem; border: 1px solid var(--border); background: var(--card); padding: 0.5rem 0.75rem; font-size: 11px; color: var(--foreground); outline: none; transition: background-color 150ms, border-color 150ms, box-shadow 150ms; } .field:hover { background: var(--muted); } .field:focus { border-color: color-mix(in oklab, var(--foreground) 20%, transparent); box-shadow: 0 0 0 2px color-mix(in oklab, var(--foreground) 5%, transparent); }`}</style>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}{children}</label>; }

function FormSelect({ value, options, onChange, placeholder }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; placeholder?: string }) {
  return <Select.Root items={options} value={value || null} onValueChange={(nextValue) => onChange(nextValue ?? "")}>
    <Select.Trigger className="mt-1 flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 text-left text-[11px] font-normal normal-case text-foreground outline-none transition-colors hover:bg-muted focus:border-foreground/20 focus:ring-2 focus:ring-foreground/5">
      <Select.Value placeholder={placeholder} />
      <Select.Icon><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Positioner side="bottom" align="start" sideOffset={4} className="z-[60]"><Select.Popup className="w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg shadow-black/10 outline-none"><Select.List>{options.map((option) => <Select.Item key={option.value} value={option.value} className="flex h-8 cursor-default items-center justify-between rounded-md px-2 text-[11px] font-normal normal-case text-foreground outline-none transition-colors data-[highlighted]:bg-muted"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check className="h-3.5 w-3.5" strokeWidth={1.8} /></Select.ItemIndicator></Select.Item>)}</Select.List></Select.Popup></Select.Positioner></Select.Portal>
  </Select.Root>;
}
