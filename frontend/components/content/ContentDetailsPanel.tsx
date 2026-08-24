import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Download, Pencil, Save, Trash2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type {
  ContentEditPayload,
  ContentItem,
  ContentPillar,
  ContentStatus,
} from "@/types/content";

import { ContentFormatBadge } from "./ContentFormatBadge";
import { ScheduleDatePicker, ScheduleTimePicker } from "./SchedulePickers";

type ContentDetailsPanelProps = {
  item: ContentItem;
  onClose: () => void;
  onStatusChange: (status: ContentStatus) => Promise<void>;
  onSave: (changes: ContentEditPayload) => Promise<void>;
  onDelete: () => Promise<void>;
  onSchedule: (date: string, time?: string) => Promise<void>;
  onUnschedule: () => Promise<void>;
};

const pillarLabel: Record<ContentPillar, string> = {
  educacao_financeira: "Educação Financeira",
  prova_social: "Prova Social",
  mitos: "Mitos",
  atualidades: "Atualidades",
  conversao: "Conversão",
};

const statusLabel: Record<ContentStatus, string> = {
  sem_status: "Sem status",
  aprovado: "Aprovado",
  publicado: "Publicado",
  descartado: "Descartado",
};
const statusOptions = Object.entries(statusLabel).map(([value, label]) => ({
  value: value as ContentStatus,
  label,
}));

function createDraft(item: ContentItem): ContentEditPayload {
  return {
    title: item.title,
    script: {
      hook: item.script.hook,
      development: [...item.script.development],
      slides: item.script.slides ? [...item.script.slides] : undefined,
      cta: item.script.cta,
      hashtags: [...item.script.hashtags],
    },
  };
}

export function ContentDetailsPanel({
  item,
  onClose,
  onStatusChange,
  onSave,
  onDelete,
  onSchedule,
  onUnschedule,
}: ContentDetailsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => createDraft(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(item.scheduledDate ?? "");
  const [scheduleTime, setScheduleTime] = useState(item.scheduledTime ?? "");
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [confirmingUnschedule, setConfirmingUnschedule] = useState(false);
  const isCarousel = item.format === "carrossel";

  useEffect(() => {
    setScheduleDate(item.scheduledDate ?? "");
    setScheduleTime(item.scheduledTime ?? "");
    setScheduleError("");
    setConfirmingUnschedule(false);
  }, [item.id, item.scheduledDate, item.scheduledTime]);

  async function handleStatusChange(status: ContentStatus) {
    setSaving(true);
    setError("");
    try {
      await onStatusChange(status);
    } catch {
      setError("Não foi possível atualizar o status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setError("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError("");
    try {
      await onDelete();
    } catch {
      setError("Não foi possível excluir este roteiro. Tente novamente.");
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  async function handleSchedule() {
    if (!scheduleDate) return;
    setScheduleSaving(true);
    setScheduleError("");
    try {
      await onSchedule(scheduleDate, scheduleTime || undefined);
    } catch {
      setScheduleError("Não foi possível salvar o agendamento.");
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleUnschedule() {
    setScheduleSaving(true);
    setScheduleError("");
    try {
      await onUnschedule();
      setConfirmingUnschedule(false);
    } catch {
      setScheduleError("Não foi possível remover o agendamento.");
    } finally {
      setScheduleSaving(false);
    }
  }

  function handleDownload() {
    const development = item.script.development.map((line) => `- ${line}`).join("\n");
    const slides = item.script.slides?.length
      ? `\n## Slides\n\n${item.script.slides.map((slide, index) => `${index + 1}. ${slide}`).join("\n")}`
      : "";
    const markdown = `# ${item.title}\n\n**Formato:** ${item.format}\n**Pilar:** ${pillarLabel[item.pillar]}\n**Status:** ${statusLabel[item.status]}\n\n## Hook\n\n${item.script.hook}\n\n## Desenvolvimento\n\n${development}${slides}\n\n## CTA\n\n${item.script.cta}\n\n## Hashtags\n\n${item.script.hashtags.join(" ")}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "conteudo"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="flex min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-l border-border bg-card">
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
          {item.title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Fechar detalhe do conteúdo" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
        <div className="flex flex-wrap gap-2">
          <ContentFormatBadge format={item.format} />
          <span className="inline-flex h-6 items-center rounded-md border border-border px-2 text-[11px] font-medium">{pillarLabel[item.pillar]}</span>
          <span className="inline-flex h-6 items-center rounded-md bg-muted px-2 text-[10px] text-muted-foreground">Gerado por IA</span>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Status
          <Select.Root
            items={statusOptions}
            value={item.status}
            disabled={saving}
            onValueChange={(value) => {
              if (value) void handleStatusChange(value as ContentStatus);
            }}
          >
            <Select.Trigger className="mt-2 flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 text-left text-[11px] font-normal normal-case text-foreground outline-none transition-colors hover:bg-muted focus:border-black/20 focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:opacity-60">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner side="bottom" align="start" sideOffset={4} className="z-50">
                <Select.Popup className="w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg shadow-black/10 outline-none">
                  <Select.List>
                    {statusOptions.map(({ value, label }) => (
                      <Select.Item
                        key={value}
                        value={value}
                        className="flex h-8 cursor-default items-center justify-between rounded-md px-2 text-[11px] font-normal normal-case text-foreground outline-none transition-colors data-[highlighted]:bg-muted"
                      >
                        <Select.ItemText>{label}</Select.ItemText>
                        <Select.ItemIndicator>
                          <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>

        <section className="rounded-[10px] border border-border p-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Agendamento
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="text-[10px] text-muted-foreground">
              Data de publicação
              <span className="mt-1 block"><ScheduleDatePicker value={scheduleDate} onChange={setScheduleDate} disabled={scheduleSaving} /></span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Horário
              <span className="mt-1 block"><ScheduleTimePicker value={scheduleTime} onChange={setScheduleTime} disabled={scheduleSaving} /></span>
            </div>
          </div>
          <button type="button" onClick={() => void handleSchedule()} disabled={scheduleSaving || !scheduleDate} className="mt-3 h-9 w-full rounded-md bg-[#030213] text-[11px] font-medium text-white disabled:opacity-60">
            {scheduleSaving ? "Salvando..." : item.scheduledDate ? "Salvar alterações" : "Agendar"}
          </button>
          {item.scheduledDate && !confirmingUnschedule ? (
            <button type="button" onClick={() => setConfirmingUnschedule(true)} disabled={scheduleSaving} className="mt-2 w-full text-center text-[10px] text-muted-foreground hover:text-red-500">
              Remover agendamento
            </button>
          ) : null}
          {confirmingUnschedule ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-[11px] text-red-600">Remover este conteúdo do calendário?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmingUnschedule(false)} disabled={scheduleSaving} className="h-8 rounded-md border border-border bg-card text-[11px]">Cancelar</button>
                <button type="button" onClick={() => void handleUnschedule()} disabled={scheduleSaving} className="h-8 rounded-md bg-red-500 text-[11px] text-white disabled:opacity-60">{scheduleSaving ? "Removendo..." : "Remover"}</button>
              </div>
            </div>
          ) : null}
          {scheduleError ? <p className="mt-2 text-[11px] text-red-500">{scheduleError}</p> : null}
        </section>

        {editing ? (
          <div className="space-y-3">
            <EditField label="Título" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
            <EditField label="Hook" value={draft.script.hook} onChange={(value) => setDraft((current) => ({ ...current, script: { ...current.script, hook: value } }))} multiline />
            <EditField label="Desenvolvimento" value={draft.script.development.join("\n")} onChange={(value) => setDraft((current) => ({ ...current, script: { ...current.script, development: value.split("\n").filter(Boolean) } }))} multiline />
            {isCarousel ? <EditField label="Slides" value={draft.script.slides?.join("\n") || ""} onChange={(value) => setDraft((current) => ({ ...current, script: { ...current.script, slides: value.split("\n").filter(Boolean) } }))} multiline /> : null}
            <EditField label="CTA" value={draft.script.cta} onChange={(value) => setDraft((current) => ({ ...current, script: { ...current.script, cta: value } }))} multiline />
            <EditField label="Hashtags" value={draft.script.hashtags.join(" ")} onChange={(value) => setDraft((current) => ({ ...current, script: { ...current.script, hashtags: value.split(/\s+/).filter(Boolean) } }))} />
            <button type="button" onClick={() => void handleSave()} disabled={saving} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#030213] text-[11px] font-medium text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" />{saving ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        ) : (
          <>
            <DetailSection title="Título completo"><p>{item.title}</p></DetailSection>
            <DetailSection title="Roteiro">
              <ScriptBlock title="Hook">{item.script.hook}</ScriptBlock>
              <ScriptList title={isCarousel ? "Slides" : "Desenvolvimento"} items={isCarousel ? item.script.slides || [] : item.script.development} numbered={isCarousel} />
              <ScriptBlock title="CTA">{item.script.cta}</ScriptBlock>
            </DetailSection>
            <DetailSection title="Hashtags"><div className="flex flex-wrap gap-1.5">{item.script.hashtags.map((hashtag) => <span key={hashtag} className="rounded bg-muted px-2 py-0.5 text-[10px]">{hashtag}</span>)}</div></DetailSection>
          </>
        )}

        {error ? <p className="text-[11px] text-red-500">{error}</p> : null}
        {!editing ? <div className="space-y-2 pt-1"><button type="button" onClick={handleDownload} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#030213] text-[11px] font-medium text-white"><Download className="h-3.5 w-3.5" />Baixar</button><button type="button" onClick={() => { setDraft(createDraft(item)); setEditing(true); }} className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border text-[11px] font-medium"><Pencil className="h-3.5 w-3.5" />Editar manualmente</button>{confirmingDelete ? <div className="rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-[11px] leading-4 text-red-600">Tem certeza que deseja excluir este roteiro?</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setConfirmingDelete(false)} disabled={saving} className="h-8 rounded-md border border-border bg-card text-[11px] font-medium">Cancelar</button><button type="button" onClick={() => void handleDelete()} disabled={saving} className="h-8 rounded-md bg-red-500 text-[11px] font-medium text-white disabled:opacity-60">{saving ? "Excluindo..." : "Excluir"}</button></div></div> : <button type="button" onClick={() => setConfirmingDelete(true)} className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-200 text-[11px] font-medium text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Excluir</button>}</div> : null}
      </div>
    </aside>
  );
}

function EditField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const className = "mt-1 w-full rounded-md border border-border px-2 py-2 text-[11px] text-foreground";
  return <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}{multiline ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={className} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3><div className="text-[11px] leading-5 text-muted-foreground">{children}</div></section>; }
function ScriptBlock({ title, children }: { title: string; children: string }) { return <div className="mt-3 rounded-md border border-border bg-muted p-2"><div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{title}</div><p className="text-[11px] leading-5 text-muted-foreground">{children}</p></div>; }
function ScriptList({ title, items, numbered }: { title: string; items: string[]; numbered: boolean }) { return <div className="mt-3"><div className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">{title}</div><ol className="space-y-2">{items.map((text, index) => <li key={`${index}-${text}`} className="rounded-md border border-border bg-muted p-2 text-[11px] leading-5 text-muted-foreground">{numbered ? `${index + 1}. ` : ""}{text}</li>)}</ol></div>; }
