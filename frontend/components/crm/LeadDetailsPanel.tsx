"use client";

import { ChevronRight, CircleX, Pencil, Phone, Send, Trash2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createLeadInteraction, fetchLeadInteractions } from "@/services/crm";
import type { Lead, LeadInteraction, LeadStage } from "@/types/crm";

type Props = { lead: Lead; onClose: () => void; onStatusChange: (status: LeadStage) => Promise<void>; onEdit: () => void; onDelete: () => Promise<void>; onActivity: () => void };
const stageLabel: Record<LeadStage, string> = { novo: "Novo", qualificado: "Qualificado", em_negociacao: "Em negociação", fechado: "Fechado", perdido: "Perdido" };
const nextStage: Partial<Record<LeadStage, LeadStage>> = { novo: "qualificado", qualificado: "em_negociacao", em_negociacao: "fechado" };
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function LeadDetailsPanel({ lead, onClose, onStatusChange, onEdit, onDelete, onActivity }: Props) {
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callNote, setCallNote] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [confirmLost, setConfirmLost] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setHistoryLoading(true); setError("");
      return fetchLeadInteractions(lead.id).then((items) => { if (active) setInteractions(items); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico."); }).finally(() => { if (active) setHistoryLoading(false); });
    });
    return () => { active = false; };
  }, [lead.id]);

  async function changeStatus(status: LeadStage) {
    setSaving(true); setError("");
    try { await onStatusChange(status); setConfirmLost(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o lead."); }
    finally { setSaving(false); }
  }

  async function registerCall() {
    if (!callNote.trim()) return;
    setSaving(true); setError("");
    try { const interaction = await createLeadInteraction(lead.id, { note: callNote.trim(), nextStep: nextStep.trim() || undefined }); setInteractions((current) => [interaction, ...current]); onActivity(); setCallNote(""); setNextStep(""); setCallOpen(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível registrar a ligação."); }
    finally { setSaving(false); }
  }

  async function removeLead() {
    setSaving(true); setError("");
    try { await onDelete(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir o lead."); setSaving(false); }
  }

  const whatsapp = lead.whatsapp.replace(/\D/g, "");
  return <aside className="flex min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-l border-border bg-card">
    <div className="flex items-start justify-between border-b border-border px-5 py-4"><h2 className="truncate text-sm font-semibold text-foreground">{lead.name}</h2><button type="button" onClick={onClose} aria-label="Fechar detalhes do lead" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
      <div className="grid grid-cols-2 gap-2"><Info label="WhatsApp" value={lead.whatsapp || "Não informado"} />{lead.email ? <Info label="Email" value={lead.email} /> : null}<Info label="Origem" value={lead.source || "Não informada"} /><Info label="Status" value={stageLabel[lead.stage]} />{lead.objective ? <Info label="Objetivo" value={lead.objective} /> : null}{lead.amount ? <Info label="Valor da carta" value={money(lead.amount)} /> : null}{lead.usageDeadline ? <Info label="Prazo de uso" value={lead.usageDeadline} /> : null}{lead.knowsConsortium ? <Info label="Conhece consórcio" value={lead.knowsConsortium} /> : null}</div>
      {lead.notes ? <Section title="Observações"><p>{lead.notes}</p></Section> : null}

      <section className="space-y-2">
        <button type="button" onClick={onEdit} className="flex h-9 w-full items-center gap-2 rounded-md border border-border px-3 text-[11px] font-medium"><Pencil className="h-3.5 w-3.5" />Editar lead</button>
        <button type="button" disabled={!whatsapp} onClick={() => window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer")} className="flex h-9 w-full items-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white disabled:opacity-40"><Send className="h-3.5 w-3.5" />Enviar Mensagem</button>
        <button type="button" onClick={() => setCallOpen(true)} className="flex h-9 w-full items-center gap-2 rounded-md border border-border px-3 text-[11px] font-medium"><Phone className="h-3.5 w-3.5" />Registrar Ligação</button>
        {nextStage[lead.stage] ? <button type="button" disabled={saving} onClick={() => void changeStatus(nextStage[lead.stage]!)} className="flex h-9 w-full items-center gap-2 rounded-md border border-border px-3 text-[11px] font-medium"><ChevronRight className="h-3.5 w-3.5" />Avançar Stage</button> : null}
        {lead.stage !== "perdido" && !confirmLost ? <button type="button" onClick={() => setConfirmLost(true)} className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-[11px] font-medium text-red-500 hover:bg-red-50"><CircleX className="h-3.5 w-3.5" />Marcar como Perdido</button> : null}
        {!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-[11px] font-medium text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Excluir lead</button> : null}
      </section>

      {callOpen ? <section className="rounded-[10px] border border-border p-3"><h3 className="text-[11px] font-semibold">Registrar ligação</h3><textarea value={callNote} onChange={(event) => setCallNote(event.target.value)} rows={4} placeholder="Nota da ligação" className="mt-3 w-full rounded-md border border-border p-2 text-[11px]" /><input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Próximo passo (opcional)" className="mt-2 h-9 w-full rounded-md border border-border px-2 text-[11px]" /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={saving} onClick={() => setCallOpen(false)} className="h-8 rounded-md border border-border text-[11px]">Cancelar</button><button type="button" disabled={saving || !callNote.trim()} onClick={() => void registerCall()} className="h-8 rounded-md bg-[#030213] text-[11px] text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div></section> : null}
      {confirmLost ? <section className="rounded-[10px] border border-red-200 bg-red-50 p-3"><p className="text-[11px] text-red-600">Tem certeza que deseja marcar este lead como perdido?</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={saving} onClick={() => setConfirmLost(false)} className="h-8 rounded-md border border-border bg-card text-[11px]">Cancelar</button><button type="button" disabled={saving} onClick={() => void changeStatus("perdido")} className="h-8 rounded-md bg-red-500 text-[11px] text-white">Confirmar</button></div></section> : null}
      {confirmDelete ? <section className="rounded-[10px] border border-red-200 bg-red-50 p-3"><p className="text-[11px] text-red-600">Esta exclusão é permanente e também removerá o histórico de interações do lead.</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={saving} onClick={() => setConfirmDelete(false)} className="h-8 rounded-md border border-border bg-card text-[11px]">Cancelar</button><button type="button" disabled={saving} onClick={() => void removeLead()} className="h-8 rounded-md bg-red-500 text-[11px] text-white">{saving ? "Excluindo..." : "Excluir permanentemente"}</button></div></section> : null}
      {error ? <p className="text-[11px] text-red-500">{error}</p> : null}

      <Section title="Histórico">{historyLoading ? <p>Carregando histórico...</p> : interactions.length ? <div className="space-y-2">{interactions.map((item) => <article key={item.id} className="rounded-lg border border-border p-3"><div className="flex justify-between gap-2 text-[9px] uppercase text-muted-foreground"><span>{item.type.replaceAll("_", " ")}</span><span>{new Date(item.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.note}</p>{item.nextStep ? <p className="mt-2 text-[10px] text-foreground">Próximo passo: {item.nextStep}</p> : null}</article>)}</div> : <p>Nenhuma interação registrada.</p>}</Section>
    </div>
  </aside>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border p-3"><div className="text-[9px] font-semibold uppercase text-muted-foreground">{label}</div><div className="mt-1 break-words text-[11px] font-medium text-foreground">{value}</div></div>; }
function Section({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3><div className="text-[11px] leading-5 text-muted-foreground">{children}</div></section>; }
