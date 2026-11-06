import { Chapter, NovelMetadata } from '@/types/novel';

export function extractSlug(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  } catch {
    return rawUrl
      .trim()
      .replace(/^https?:\/\/[^/]+\//, '')
      .split('/')
      .filter(Boolean)[0] || '';
  }
}

export function decodeHtmlEntities(str: string): string {
  if (typeof window === 'undefined') {
    return str
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8212;/g, '—')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

export function escapeXml(str: string): string {
  return (str || '').replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

export async function fetchNovelMetadata(url: string): Promise<NovelMetadata> {
  const slug = extractSlug(url);
  if (!slug) {
    throw new Error('Could not parse a valid novel slug from the provided URL.');
  }

  // Fetch category info from WordPress REST API
  const catEndpoint = `https://mydramanovel.com/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(catEndpoint);
  if (!res.ok) {
    throw new Error(`Category API error (HTTP ${res.status}): Failed to locate category for "${slug}".`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Novel not found for slug "${slug}". Please check the URL.`);
  }

  const cat = data[0];
  const descText = decodeHtmlEntities((cat.description || '').replace(/<[^>]+>/g, '\n'));

  // Regex extraction from category description
  const origMatch = descText.match(/Original Title[:\s]+([^\r\n]+)/i);
  const authorMatch = descText.match(/Author[:\s]+([^\r\n]+)/i);
  const synMatch = descText.match(/(?:Summary|Synopsis)[:\s]+([\s\S]+)/i);

  const title = cat.name ? `${cat.name} (${origMatch ? origMatch[1].trim() : ''})` : slug;
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown Author';
  const originalTitle = origMatch ? origMatch[1].trim() : '';
  const synopsis = synMatch ? synMatch[1].trim() : descText.trim();

  return {
    slug,
    url,
    categoryId: cat.id,
    title,
    originalTitle,
    author,
    synopsis,
    coverUrl: '',
    totalChapters: cat.count || 0
  };
}

export async function fetchAllChapters(
  categoryId: number,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ chapters: Chapter[]; coverUrl?: string }> {
  let page = 1;
  let hasMore = true;
  const chapters: Chapter[] = [];
  let foundCoverUrl = '';

  while (hasMore) {
    // Note: categories[]=ID bypasses Cloudflare challenge
    const url = `https://mydramanovel.com/wp-json/wp/v2/posts?categories[]=${categoryId}&per_page=100&page=${page}&order=asc&orderby=date&_embed=wp:featuredmedia`;
    
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400 && page > 1) {
        hasMore = false;
        break;
      }
      throw new Error(`Failed to fetch chapters on page ${page} (HTTP ${res.status})`);
    }

    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      hasMore = false;
      break;
    }

    for (const p of posts) {
      if (!foundCoverUrl && p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]) {
        foundCoverUrl = p._embedded['wp:featuredmedia'][0].source_url || '';
      }

      const decodedTitle = decodeHtmlEntities(p.title ? p.title.rendered : '');
      const numMatch = decodedTitle.match(/Chapter\s+(\d+)/i) || (p.slug || '').match(/chapter-(\d+)/i);
      const num = numMatch ? parseInt(numMatch[1], 10) : chapters.length + 1;

      chapters.push({
        id: p.id,
        num,
        title: decodedTitle,
        slug: p.slug || '',
        contentHtml: p.content ? p.content.rendered : '',
        selected: true
      });
    }

    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
    const totalCount = parseInt(res.headers.get('X-WP-Total') || `${chapters.length}`, 10);
    if (onProgress) {
      onProgress(chapters.length, totalCount);
    }

    if (page >= totalPages) {
      hasMore = false;
    } else {
      page++;
    }
  }

  // Ensure deterministic numerical chapter ordering
  chapters.sort((a, b) => a.num - b.num);

  return { chapters, coverUrl: foundCoverUrl };
}

export function cleanHtmlToXhtml(rawHtml: string): string {
  if (typeof window === 'undefined') {
    // Basic fallback for server-side execution
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '<p>$1</p>');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Decompose unwanted advertising and layout tags
  doc.querySelectorAll('script, style, ins, iframe, .td-a-ad, .adsbygoogle, .sharedaddy').forEach(el => el.remove());

  const blocks: string[] = [];
  doc.querySelectorAll('p, h2, h3, h4, blockquote, hr').forEach(el => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent ? el.textContent.trim() : '';

    if (!text && tag !== 'hr') return;
    if (text.toLowerCase().includes('google_ad') || text.toLowerCase().includes('adsbygoogle')) return;

    if (tag === 'hr') {
      blocks.push('<hr/>');
    } else if (['h2', 'h3', 'h4'].includes(tag)) {
      blocks.push(`<${tag}>${escapeXml(text)}</${tag}>`);
    } else if (tag === 'blockquote') {
      blocks.push(`<blockquote>${escapeXml(text)}</blockquote>`);
    } else {
      blocks.push(`<p>${escapeXml(text)}</p>`);
    }
  });

  return blocks.join('\n');
}
