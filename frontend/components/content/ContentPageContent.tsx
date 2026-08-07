"use client";

import { useEffect, useMemo, useState } from "react";

import {
  deleteContentItem,
  fetchContentItems,
  updateContentItem,
  updateContentStatus,
} from "@/services/content";
import type {
  ContentEditPayload,
  ContentFilter,
  ContentItem,
  ContentStatus,
} from "@/types/content";

import { ContentDetailsPanel } from "./ContentDetailsPanel";
import { ContentTable } from "./ContentTable";
import { ContentToolbar } from "./ContentToolbar";

const filters: ContentFilter[] = [
  "todos",
  "aprovado",
  "publicado",
  "descartado",
];

export function ContentPageContent() {
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("todos");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    fetchContentItems()
      .then((contentItems) => {
        if (active) {
          setItems(contentItems);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Não foi possível carregar os conteúdos.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    return filters.reduce<Record<ContentFilter, number>>(
      (accumulator, filter) => {
        accumulator[filter] =
          filter === "todos"
            ? items.length
            : items.filter((item) => item.status === filter).length;
        return accumulator;
      },
      {
        todos: 0,
        aprovado: 0,
        publicado: 0,
        descartado: 0,
      },
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "todos") {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  function replaceItem(updated: ContentItem) {
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelectedContent(updated);
  }

  async function handleStatusChange(status: ContentStatus) {
    if (!selectedContent) return;
    replaceItem(await updateContentStatus(selectedContent, status));
  }

  async function handleSave(changes: ContentEditPayload) {
    if (!selectedContent) return;
    replaceItem(await updateContentItem(selectedContent, changes));
  }

  async function handleDelete() {
    if (!selectedContent) return;
    const executionId = selectedContent.executionId;
    const remaining = await deleteContentItem(selectedContent);
    setItems((current) => {
      const firstIndex = current.findIndex(
        (item) => item.executionId === executionId,
      );
      const next = current.filter((item) => item.executionId !== executionId);
      next.splice(Math.max(firstIndex, 0), 0, ...remaining);
      return next;
    });
    setSelectedContent(null);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <section className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <ContentToolbar
          activeFilter={activeFilter}
          counts={counts}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setSelectedContent(null);
          }}
        />

        {loading ? (
          <div className="p-5 text-[11px] text-[#717182]">
            Carregando conteúdos...
          </div>
        ) : error ? (
          <div className="m-5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-4 text-red-500">
            {error}
          </div>
        ) : filteredItems.length ? (
          <ContentTable
            items={filteredItems}
            selectedItemId={selectedContent?.id}
            onSelectItem={setSelectedContent}
          />
        ) : (
          <div className="p-5 text-[11px] text-[#717182]">
            Nenhum conteúdo encontrado.
          </div>
        )}
      </section>

      {selectedContent ? (
        <ContentDetailsPanel
          item={selectedContent}
          onClose={() => setSelectedContent(null)}
          onStatusChange={handleStatusChange}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}
