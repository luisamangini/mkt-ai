"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { ContentFormat, ContentPillar, ManualContentInput } from "@/types/content";

type Props = {
  onClose: () => void;
  onCreate: (input: ManualContentInput) => Promise<void>;
};

const formatOptions: Array<{ value: ContentFormat; label: string }> = [
  { value: "reel", label: "Reel" },
  { value: "carrossel", label: "Carrossel" },
  { value: "stories", label: "Stories" },
];

const pillarOptions: Array<{ value: ContentPillar; label: string }> = [
  { value: "educacao_financeira", label: "Educação Financeira" },
  { value: "prova_social", label: "Prova Social" },
  { value: "mitos", label: "Mitos e Verdades" },
  { value: "atualidades", label: "Atualidades e Mercado" },
  { value: "conversao", label: "Conversão" },
];

export function ManualContentModal({ onClose, onCreate }: Props) {
  const [draft, setDraft] = useState<ManualContentInput>({ title: "", format: "reel", pillar: "educacao_financeira", text: "", cta: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!draft.title.trim() || !draft.text.trim()) {
      setError("Título e conteúdo são obrigatórios.");
      return;
    }
    setSaving(true); setError("");
    try { await onCreate({ ...draft, title: draft.title.trim(), text: draft.text.trim(), cta: draft.cta?.trim(), notes: draft.notes?.trim() }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar o conteúdo."); setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[10px] border border-border bg-card p-5 shadow-xl">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-foreground">Novo conteúdo</h2><p className="mt-1 text-[11px] text-muted-foreground">Crie uma peça manual sem executar a IA.</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <div className="mt-5 space-y-3">
        <Field label="Título *"><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="field" /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Formato"><FormSelect value={draft.format} options={formatOptions} onChange={(value) => setDraft((current) => ({ ...current, format: value as ContentFormat }))} /></Field><Field label="Pilar"><FormSelect value={draft.pillar} options={pillarOptions} onChange={(value) => setDraft((current) => ({ ...current, pillar: value as ContentPillar }))} /></Field></div>
        <Field label="Texto / roteiro / conteúdo *"><textarea rows={7} value={draft.text} onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))} className="field resize-y" /></Field>
        <Field label="CTA (opcional)"><textarea rows={2} value={draft.cta} onChange={(event) => setDraft((current) => ({ ...current, cta: event.target.value }))} className="field resize-y" /></Field>
        <Field label="Observações (opcional)"><textarea rows={2} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className="field resize-y" /></Field>
      </div>
      {error ? <p className="mt-3 text-[11px] text-red-500">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={saving} className="h-9 rounded-md border border-border px-4 text-[11px] text-foreground hover:bg-muted">Cancelar</button><button type="button" onClick={() => void handleCreate()} disabled={saving || !draft.title.trim() || !draft.text.trim()} className="h-9 rounded-md bg-[#030213] px-4 text-[11px] text-white disabled:opacity-50">{saving ? "Criando..." : "Criar conteúdo"}</button></div>
    </div>
    <style jsx>{`.field { margin-top: .25rem; min-height: 2.25rem; width: 100%; border-radius: .375rem; border: 1px solid var(--border); background: var(--card); padding: .5rem .75rem; font-size: 11px; color: var(--foreground); outline: none; } .field:hover { background: var(--muted); } .field:focus { border-color: color-mix(in oklab, var(--foreground) 20%, transparent); box-shadow: 0 0 0 2px color-mix(in oklab, var(--foreground) 5%, transparent); }`}</style>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}{children}</label>; }

function FormSelect({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <Select.Root items={options} value={value} onValueChange={(next) => { if (next) onChange(next); }}><Select.Trigger className="mt-1 flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 text-left text-[11px] text-foreground outline-none transition-colors hover:bg-muted focus:border-foreground/20 focus:ring-2 focus:ring-foreground/5"><Select.Value /><Select.Icon><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></Select.Icon></Select.Trigger><Select.Portal><Select.Positioner side="bottom" align="start" sideOffset={4} className="z-[60]"><Select.Popup className="w-[var(--anchor-width)] rounded-lg border border-border bg-card p-1 shadow-lg outline-none"><Select.List>{options.map((option) => <Select.Item key={option.value} value={option.value} className="flex h-8 items-center justify-between rounded-md px-2 text-[11px] text-foreground outline-none data-[highlighted]:bg-muted"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check className="h-3.5 w-3.5" /></Select.ItemIndicator></Select.Item>)}</Select.List></Select.Popup></Select.Positioner></Select.Portal></Select.Root>;
}
