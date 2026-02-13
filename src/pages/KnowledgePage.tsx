import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../components/ui/BottomSheet';
import {
  KNOWLEDGE_CATEGORIES,
  loadKnowledgeIndex,
  type KnowledgeCategory,
  type KnowledgeEntry,
  type KnowledgeIndex,
} from '../lib/knowledge';
import { format, parseISO, isValid } from 'date-fns';

const FILTERS: Array<'All' | KnowledgeCategory> = ['All', ...KNOWLEDGE_CATEGORIES];
const KNOWLEDGE_STORAGE_KEY = 'ui.knowledge';

type KnowledgePersistedState = {
  filter?: 'All' | KnowledgeCategory;
  query?: string;
  activeEntryId?: string | null;
};

function readKnowledgeState(): KnowledgePersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as KnowledgePersistedState;
  } catch {
    return null;
  }
}

function resolveFilter(value: unknown): 'All' | KnowledgeCategory | null {
  return FILTERS.includes(value as KnowledgeCategory) ? (value as 'All' | KnowledgeCategory) : null;
}

function formatUpdatedAt(value: string) {
  const parsed = parseISO(value);
  if (!isValid(parsed)) return 'Updated recently';
  const now = new Date();
  const fmt = parsed.getFullYear() === now.getFullYear() ? 'MMM d' : 'MMM d, yyyy';
  return `Updated ${format(parsed, fmt)}`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string) {
  let safe = escapeHtml(text);
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return safe;
}

function renderMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let listOpen = false;
  let quoteOpen = false;

  const closeList = () => {
    if (listOpen) {
      out.push('</ul>');
      listOpen = false;
    }
  };

  const closeQuote = () => {
    if (quoteOpen) {
      out.push('</blockquote>');
      quoteOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        closeList();
        closeQuote();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      closeQuote();
      continue;
    }

    if (trimmed.startsWith('> ')) {
      closeList();
      if (!quoteOpen) {
        out.push('<blockquote>');
        quoteOpen = true;
      }
      out.push(`<p>${renderInline(trimmed.slice(2))}</p>`);
      continue;
    }

    closeQuote();

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = trimmed.match(/^[-*]\s+(.*)$/);
    if (listItem) {
      if (!listOpen) {
        out.push('<ul>');
        listOpen = true;
      }
      out.push(`<li>${renderInline(listItem[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${renderInline(trimmed)}</p>`);
  }

  if (inCode) {
    out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  closeList();
  closeQuote();

  return out.join('\n');
}

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function KnowledgePage() {
  const initialPersisted = readKnowledgeState();
  const initialFilter = resolveFilter(initialPersisted?.filter) ?? 'All';
  const initialQuery = typeof initialPersisted?.query === 'string' ? initialPersisted.query : '';
  const initialActiveEntryId =
    typeof initialPersisted?.activeEntryId === 'string' ? initialPersisted.activeEntryId : null;

  const [index, setIndex] = useState<KnowledgeIndex>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [filter, setFilter] = useState<'All' | KnowledgeCategory>(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(initialActiveEntryId);
  const [activeEntry, setActiveEntry] = useState<KnowledgeEntry | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadKnowledgeIndex()
      .then((data) => {
        if (!mounted) return;
        setIndex(data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load knowledge.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        KNOWLEDGE_STORAGE_KEY,
        JSON.stringify({
          filter,
          query,
          activeEntryId,
        }),
      );
    } catch {
      // Ignore storage failures (e.g. quota, disabled storage).
    }
  }, [filter, query, activeEntryId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = (event?: MediaQueryListEvent) => {
      setIsDesktop(event?.matches ?? media.matches);
    };
    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!activeEntryId) return;
    if (activeEntry?.id === activeEntryId) return;
    const match = index.items.find((entry) => entry.id === activeEntryId) ?? null;
    if (match) setActiveEntry(match);
  }, [index.items, activeEntryId, activeEntry]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return index.items
      .filter((entry) => (filter === 'All' ? true : entry.category === filter))
      .filter((entry) => {
        if (!q) return true;
        const hay = [entry.title, entry.excerpt, entry.tags.join(' '), entry.category]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [index.items, filter, query]);

  return (
    <div className="px-4 pt-4 pb-safe-nav max-w-xl mx-auto lg:max-w-6xl xl:max-w-[1280px] 2xl:max-w-[1440px]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-color-text-primary">Knowledge</h1>
          <p className="text-xs text-color-text-tertiary mt-0.5">
            {loading ? 'Syncing knowledge base...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {index.updatedAt && (
          <div className="text-[11px] text-color-text-tertiary text-right">
            {formatUpdatedAt(index.updatedAt)}
          </div>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] lg:gap-5">
        <div>
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-none lg:mx-0 lg:px-0 lg:overflow-visible">
            <div className="flex gap-2 pb-2 lg:flex-wrap lg:gap-2 lg:pb-0">
              {FILTERS.map((chip) => {
                const active = filter === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => setFilter(chip)}
                    className={
                      'rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ' +
                      (active
                        ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200 border-coral-500/30'
                        : 'bg-white/80 dark:bg-[#2c2c2e]/80 text-color-text-secondary dark:text-color-text-tertiary border-color-border')
                    }
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <div className="rounded-2xl bg-white/90 dark:bg-[#2c2c2e]/90 border border-color-border px-3 py-2 lg:px-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search knowledge"
                className="w-full bg-transparent outline-none text-sm text-gray-800 text-color-text-secondary placeholder:text-color-text-tertiary"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3 lg:space-y-2">
            {loading && <div className="text-sm text-color-text-tertiary">Loading knowledge…</div>}
            {!loading && error && (
              <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-sm text-color-text-tertiary">No knowledge matched that filter.</div>
            )}
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setActiveEntry(entry);
                  setActiveEntryId(entry.id);
                }}
                className="w-full text-left rounded-2xl bg-white/90 dark:bg-[#2c2c2e]/90 border border-color-border shadow-[0_8px_20px_rgba(0,0,0,0.06)] px-4 py-3 transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/50 lg:px-3 lg:py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-color-text-primary">{entry.title}</div>
                    <div className="mt-1 text-xs text-color-text-tertiary line-clamp-2">
                      {entry.excerpt}
                    </div>
                  </div>
                  <div className="text-[11px] text-color-text-tertiary whitespace-nowrap">
                    {formatUpdatedAt(entry.updatedAt)}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-color-bg-secondary text-color-text-secondary dark:text-color-text-tertiary">
                    {entry.category}
                  </span>
                  {entry.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-color-bg-secondary text-color-text-secondary dark:text-color-text-tertiary"
                    >
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-color-bg-secondary text-color-text-tertiary">
                      +{entry.tags.length - 4}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <div className="rounded-3xl border border-color-border bg-white/90 dark:bg-[#1f1f21]/80 shadow-[0_18px_50px_rgba(0,0,0,0.12)] p-4">
              {activeEntry ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-color-text-primary">{activeEntry.title}</div>
                    <div className="mt-1 text-xs text-color-text-tertiary">
                      {activeEntry.category} · {formatUpdatedAt(activeEntry.updatedAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeEntry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-color-bg-secondary text-color-text-secondary dark:text-color-text-tertiary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
                    <div className="max-w-[60ch]">
                      <MarkdownPreview content={activeEntry.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="text-sm font-semibold text-color-text-secondary">
                    Select an entry to preview
                  </div>
                  <p className="mt-2 text-xs text-color-text-tertiary">
                    Keep the list open while you scan details here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {!isDesktop && (
        <BottomSheet
          open={!!activeEntry}
          onClose={() => {
            setActiveEntry(null);
            setActiveEntryId(null);
          }}
          title={activeEntry?.title}
          description={activeEntry ? `${activeEntry.category} | ${formatUpdatedAt(activeEntry.updatedAt)}` : undefined}
        >
          {activeEntry && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {activeEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-color-bg-secondary text-color-text-secondary dark:text-color-text-tertiary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <MarkdownPreview content={activeEntry.content} />
              </div>
            </div>
          )}
        </BottomSheet>
      )}
    </div>
  );
}
