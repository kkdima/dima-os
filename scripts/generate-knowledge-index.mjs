import { promises as fs } from 'node:fs';
import path from 'node:path';

const WORKSPACE_ROOT =
  process.env.OPENCLAW_WORKSPACE ?? '/Users/dimakononenko/.openclaw/workspace';
const PROJECT_ROOT = process.cwd();
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'public', 'knowledge-index.json');

const SOURCE_SPECS = [
  { kind: 'file', relativePath: 'MEMORY.md', category: 'Memory' },
  { kind: 'dir', relativePath: 'memory/weekly', category: 'Weekly' },
  { kind: 'dir', relativePath: 'research', category: 'Research' },
  { kind: 'file', relativePath: 'DECISION_FRAMEWORK.md', category: 'Rules' },
  { kind: 'file', relativePath: 'COMMUNICATION_STYLE.md', category: 'Rules' },
  { kind: 'file', relativePath: 'TASTE.md', category: 'Rules' },
  { kind: 'file', relativePath: 'USER.md', category: 'Rules' },
];

const MAX_EXCERPT_LENGTH = 220;

const toPosix = (inputPath) => inputPath.split(path.sep).join('/');

const splitFrontmatter = (content) => {
  if (!content.startsWith('---')) {
    return { frontmatter: '', body: content };
  }

  const lines = content.split(/\r?\n/);
  if (lines[0].trim() !== '---') {
    return { frontmatter: '', body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: '', body: content };
  }

  return {
    frontmatter: lines.slice(1, endIndex).join('\n'),
    body: lines.slice(endIndex + 1).join('\n'),
  };
};

const extractFrontmatterValue = (frontmatter, key) => {
  const matcher = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'im');
  const match = frontmatter.match(matcher);
  return match ? match[1].trim() : '';
};

const parseInlineTags = (value) =>
  value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

const extractTags = (content) => {
  const { frontmatter, body } = splitFrontmatter(content);
  const tags = new Set();

  if (frontmatter) {
    const lines = frontmatter.split(/\r?\n/);
    let inTagsBlock = false;
    for (const line of lines) {
      if (/^\s*tags\s*:/i.test(line)) {
        const value = line.split(':').slice(1).join(':').trim();
        if (value) {
          parseInlineTags(value).forEach((tag) => tags.add(tag));
          inTagsBlock = false;
        } else {
          inTagsBlock = true;
        }
        continue;
      }

      if (inTagsBlock) {
        const listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch) {
          tags.add(listMatch[1].trim());
          continue;
        }
        if (line.trim()) {
          inTagsBlock = false;
        }
      }
    }
  }

  if (tags.size === 0) {
    const bodyMatch = body.match(/^tags?\s*:\s*(.+)$/im);
    if (bodyMatch) {
      parseInlineTags(bodyMatch[1]).forEach((tag) => tags.add(tag));
    }
  }

  return Array.from(tags);
};

const extractTitle = (content, fallbackTitle) => {
  const { frontmatter, body } = splitFrontmatter(content);
  const frontmatterTitle = extractFrontmatterValue(frontmatter, 'title');
  if (frontmatterTitle) {
    return frontmatterTitle;
  }

  const headingMatch = body.match(/^#{1,2}\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return fallbackTitle;
};

const extractExcerpt = (content) => {
  const { body } = splitFrontmatter(content);
  const cleaned = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+.+$/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/\r?\n/g, '\n');

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const baseExcerpt = paragraphs[0] ?? '';
  if (baseExcerpt.length <= MAX_EXCERPT_LENGTH) {
    return baseExcerpt;
  }

  return `${baseExcerpt.slice(0, MAX_EXCERPT_LENGTH - 3).trimEnd()}...`;
};

const listMarkdownFiles = async (spec) => {
  const absolutePath = path.join(WORKSPACE_ROOT, spec.relativePath);

  if (spec.kind === 'file') {
    try {
      await fs.access(absolutePath);
      return [absolutePath];
    } catch (error) {
      console.warn(`Missing file: ${absolutePath}`);
      return [];
    }
  }

  try {
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => path.join(absolutePath, entry.name))
      .sort();
  } catch (error) {
    console.warn(`Missing directory: ${absolutePath}`);
    return [];
  }
};

const buildItem = async (filePath, category) => {
  const [content, stats] = await Promise.all([
    fs.readFile(filePath, 'utf8'),
    fs.stat(filePath),
  ]);

  const relativePath = toPosix(path.relative(WORKSPACE_ROOT, filePath));
  const fallbackTitle = path.basename(filePath, path.extname(filePath));

  return {
    id: relativePath,
    title: extractTitle(content, fallbackTitle),
    path: relativePath,
    category,
    updatedAt: new Date(stats.mtimeMs).toISOString(),
    excerpt: extractExcerpt(content),
    tags: extractTags(content),
    content,
  };
};

const main = async () => {
  const filesByCategory = await Promise.all(
    SOURCE_SPECS.map(async (spec) => ({
      category: spec.category,
      files: await listMarkdownFiles(spec),
    })),
  );

  const items = [];
  for (const { category, files } of filesByCategory) {
    for (const filePath of files) {
      try {
        items.push(await buildItem(filePath, category));
      } catch (error) {
        console.warn(`Failed to index ${filePath}: ${error.message}`);
      }
    }
  }

  items.sort((a, b) => {
    const dateDiff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    if (Number.isNaN(dateDiff) || dateDiff === 0) {
      return a.title.localeCompare(b.title);
    }
    return dateDiff;
  });

  const payload = {
    updatedAt: new Date().toISOString(),
    items,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Indexed ${items.length} knowledge files.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
