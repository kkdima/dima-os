export const KNOWLEDGE_CATEGORIES = ['Memory', 'Weekly', 'Research', 'Rules'] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface KnowledgeEntry {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  tags: string[];
  category: KnowledgeCategory;
  content: string;
}

export interface KnowledgeIndex {
  updatedAt?: string;
  items: KnowledgeEntry[];
}

const EXCERPT_LIMIT = 160;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createExcerpt(content: string) {
  const cleaned = stripMarkdown(content);
  if (cleaned.length <= EXCERPT_LIMIT) return cleaned;
  return `${cleaned.slice(0, EXCERPT_LIMIT - 3)}...`;
}

function normalizeEntry(raw: unknown): KnowledgeEntry | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const title = typeof raw.title === 'string' ? raw.title : '';
  const content = typeof raw.content === 'string' ? raw.content : '';
  if (!id || !title) return null;

  const category = KNOWLEDGE_CATEGORIES.includes(raw.category as KnowledgeCategory)
    ? (raw.category as KnowledgeCategory)
    : 'Memory';

  const tags = Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [];
  const excerpt = typeof raw.excerpt === 'string' && raw.excerpt.trim().length > 0
    ? raw.excerpt.trim()
    : createExcerpt(content);
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString();

  return {
    id,
    title,
    excerpt,
    updatedAt,
    tags,
    category,
    content,
  };
}

export function normalizeKnowledgeIndex(raw: unknown): KnowledgeIndex {
  if (!isRecord(raw)) return { items: [] };
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items = itemsRaw.map(normalizeEntry).filter((entry): entry is KnowledgeEntry => !!entry);
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined;
  return { updatedAt, items };
}

export async function loadKnowledgeIndex(): Promise<KnowledgeIndex> {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
  const response = await fetch(`${base}knowledge-index.json`, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load knowledge index: ${response.status}`);
  }
  const data = await response.json();
  return normalizeKnowledgeIndex(data);
}
