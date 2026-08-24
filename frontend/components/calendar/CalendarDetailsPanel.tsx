"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import type { CalendarContentItem } from "@/types/calendar";
import { pillarLabels, statusLabels } from "./CalendarContentCard";

type Props = {
  item: CalendarContentItem;
  onClose: () => void;
  onSchedule: (date: string, time?: string) => Promise<void>;
  onUnschedule: () => Promise<void>;
  onOpenContent: () => void;
};

export function CalendarDetailsPanel({ item, onClose, onSchedule, onUnschedule, onOpenContent }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDate(item.date);
    setTime(item.time ?? "");
    setEditing(false);
    setConfirming(false);
    setError("");
  }, [item.id, item.date, item.time]);

  async function save() {
    setSaving(true); setError("");
    try { await onSchedule(date, time || undefined); setEditing(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar o agendamento."); }
    finally { setSaving(false); }
  }

  async function remove() {
    setSaving(true); setError("");
    try { await onUnschedule(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remover o agendamento."); setSaving(false); }
  }

  return (
    <aside className="flex min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-l border-border bg-card">
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{item.title}</h2>
        <button type="button" onClick={onClose} aria-label="Fechar detalhe" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 text-[11px] text-muted-foreground">
        <section className="grid grid-cols-2 gap-2">
          <Info label="Data" value={new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR")} />
          <Info label="Horário" value={item.time ?? "Sem horário"} />
          <Info label="Formato" value={item.format} />
          <Info label="Pilar" value={pillarLabels[item.pillar]} />
          <Info label="Status" value={statusLabels[item.status]} />
        </section>
        {item.description ? <Detail title="Descrição">{item.description}</Detail> : null}

        {editing ? (
          <section className="space-y-3 rounded-[10px] border border-border p-3">
            <label className="block"><span className="mb-1 block">Data</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-9 w-full rounded-md border border-border px-3 text-foreground" /></label>
            <label className="block"><span className="mb-1 block">Horário (opcional)</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="h-9 w-full rounded-md border border-border px-3 text-foreground" /></label>
            <div className="flex gap-2"><button type="button" onClick={() => setEditing(false)} disabled={saving} className="h-9 flex-1 rounded-md border border-border">Cancelar</button><button type="button" onClick={save} disabled={saving || !date} className="h-9 flex-1 rounded-md bg-[#030213] text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div>
          </section>
        ) : null}

        {confirming ? (
          <section className="rounded-[10px] border border-red-200 bg-red-50 p-3">
            <p className="mb-3 text-foreground">Tem certeza que deseja remover este conteúdo do calendário?</p>
            <div className="flex gap-2"><button type="button" onClick={() => setConfirming(false)} disabled={saving} className="h-9 flex-1 rounded-md border border-border bg-card">Cancelar</button><button type="button" onClick={remove} disabled={saving} className="h-9 flex-1 rounded-md bg-red-500 text-white disabled:opacity-50">{saving ? "Removendo..." : "Remover"}</button></div>
          </section>
        ) : null}
        {error ? <p className="text-red-500">{error}</p> : null}

        <div className="space-y-2 pt-1">
          <button type="button" onClick={() => { setEditing(true); setConfirming(false); }} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#030213] font-medium text-white"><Pencil className="h-3.5 w-3.5" />Editar agendamento</button>
          <button type="button" onClick={onOpenContent} className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border font-medium text-foreground hover:bg-muted"><ExternalLink className="h-3.5 w-3.5" />Abrir conteúdo</button>
          <button type="button" onClick={() => { setConfirming(true); setEditing(false); }} className="flex h-9 w-full items-center justify-center gap-2 rounded-md font-medium text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Remover do calendário</button>
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card p-3"><div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide"><CalendarDays className="h-3 w-3" />{label}</div><div className="text-[11px] font-medium text-foreground">{value}</div></div>;
}

function Detail({ title, children }: { title: string; children: string }) {
  return <section><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide">{title}</h3><p className="whitespace-pre-line leading-5">{children}</p></section>;
}
