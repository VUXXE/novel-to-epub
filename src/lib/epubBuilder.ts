import JSZip from 'jszip';
import { Chapter, EpubOptions, NovelMetadata } from '@/types/novel';
import { cleanHtmlToXhtml, escapeXml } from './extractor';

export async function fetchOrGenerateCover(
  coverUrl: string,
  title: string,
  author: string
): Promise<ArrayBuffer> {
  if (coverUrl) {
    try {
      // wsrv.nl converts image formats and adds Access-Control-Allow-Origin: *
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(coverUrl)}&output=jpg`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 1000) {
          return buffer;
        }
      }
    } catch {
      // Fallback to canvas below
    }
  }

  // Generate dynamic cover using HTML5 Canvas on the client device
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1800;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 1800);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1800);

      // Gold frame lines
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(70, 70, 1060, 1660);
      ctx.lineWidth = 2;
      ctx.strokeRect(85, 85, 1030, 1630);

      // Header Tag
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = '600 28px sans-serif';
      ctx.fillText('WEB NOVEL EDITION', 600, 320);

      // Book Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px serif';
      const words = title.split(' ');
      let line = '';
      let y = 680;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > 880 && line !== '') {
          ctx.fillText(line, 600, y);
          line = w + ' ';
          y += 85;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, 600, y);

      // Author Name
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'italic 46px serif';
      ctx.fillText(`By ${author}`, 600, y + 160);

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '24px sans-serif';
      ctx.fillText('Converted with Novel-to-EPUB Client', 600, 1600);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(new ArrayBuffer(0));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as ArrayBuffer);
          reader.readAsArrayBuffer(blob);
        }, 'image/jpeg', 0.95);
      });
    }
  }

  return new ArrayBuffer(0);
}

export async function buildEpubBlob(
  novel: NovelMetadata,
  chapters: Chapter[],
  options: EpubOptions,
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (Must be first, stored uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. CSS Stylesheet
  const fontFamily =
    options.fontFamily === 'serif'
      ? 'Georgia, "Times New Roman", "Songti SC", serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif';
  const textIndent = options.indentStyle === 'indent' ? '1.5em' : '0';
  const pMargin = options.indentStyle === 'indent' ? '0.6em 0' : '1em 0';

  const css = `
body {
  font-family: ${fontFamily};
  line-height: 1.75;
  margin: 5% 5%;
  text-align: justify;
  color: #1e293b;
}
h1.chapter-title {
  font-size: 1.5em;
  font-weight: 600;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  padding-bottom: 0.5em;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
}
p {
  margin: ${pMargin};
  text-indent: ${textIndent};
}
.no-indent, .metadata p, .intro-box p {
  text-indent: 0;
}
.intro-box {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1.2em 1.5em;
  background-color: #f8fafc;
  margin: 1.5em 0;
}
.intro-box h2 {
  margin-top: 0;
  font-size: 1.2em;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 0.3em;
  color: #334155;
}
.metadata {
  margin-top: 2em;
  font-size: 0.95em;
  color: #475569;
}
.metadata p {
  margin: 0.4em 0;
}
blockquote {
  margin: 1em 2em;
  font-style: italic;
  color: #64748b;
  border-left: 3px solid #cbd5e1;
  padding-left: 1em;
}
hr {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 2em 0;
}
`;
  zip.file('EPUB/style/main.css', css);

  // 4. Cover Art
  if (onProgress) onProgress(5, 'Generating & formatting cover art...');
  const coverBuffer = await fetchOrGenerateCover(novel.coverUrl, novel.title, novel.author);
  const hasCover = coverBuffer.byteLength > 0;
  if (hasCover) {
    zip.file('EPUB/cover.jpg', coverBuffer);
    zip.file(
      'EPUB/cover.xhtml',
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>Cover</title>
  <style>
    body { margin: 0; padding: 0; text-align: center; background-color: #000; }
    img { max-width: 100%; max-height: 100vh; height: auto; }
  </style>
</head>
<body>
  <div>
    <img src="cover.jpg" alt="Cover" />
  </div>
</body>
</html>`
    );
  }

  // 5. About / Synopsis Page
  const aboutHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>About This Novel</title>
  <link rel="stylesheet" href="style/main.css" type="text/css" />
</head>
<body>
  <h1 style="font-size: 2em; text-align: center; margin-bottom: 0.2em;">${escapeXml(novel.title)}</h1>
  ${novel.originalTitle ? `<h2 style="font-size: 1.3em; text-align: center; color: #64748b; font-weight: normal; margin-top: 0;">${escapeXml(novel.originalTitle)}</h2>` : ''}

  <div class="metadata">
    <p><strong>Author:</strong> ${escapeXml(novel.author)}</p>
    ${novel.originalTitle ? `<p><strong>Original Title:</strong> ${escapeXml(novel.originalTitle)}</p>` : ''}
    <p><strong>Source:</strong> ${escapeXml(novel.url)}</p>
    <p><strong>Total Chapters:</strong> ${chapters.length}</p>
  </div>

  <div class="intro-box">
    <h2>Synopsis</h2>
    <p>${escapeXml(novel.synopsis).replace(/\n\n+/g, '</p><p>')}</p>
  </div>
</body>
</html>`;
  zip.file('EPUB/about.xhtml', aboutHtml);

  // 6. Chapter XHTML files
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const pct = Math.round(10 + (i / chapters.length) * 75);
    if (onProgress) {
      onProgress(pct, `Formatting chapter ${i + 1}/${chapters.length}: ${ch.title}`);
    }

    const cleanBody = cleanHtmlToXhtml(ch.contentHtml);
    const chHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" href="style/main.css" type="text/css" />
</head>
<body>
  <h1 class="chapter-title">${escapeXml(ch.title)}</h1>
  ${cleanBody}
</body>
</html>`;

    const fileName = `chapter_${String(i + 1).padStart(2, '0')}.xhtml`;
    zip.file(`EPUB/${fileName}`, chHtml);
  }

  // 7. EPUB 3 Navigation Document (nav.xhtml)
  if (onProgress) onProgress(88, 'Building EPUB 3 navigation tables...');
  const navItems = chapters
    .map((ch, i) => {
      const fn = `chapter_${String(i + 1).padStart(2, '0')}.xhtml`;
      return `      <li><a href="${fn}">${escapeXml(ch.title)}</a></li>`;
    })
    .join('\n');

  const navHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" href="style/main.css" type="text/css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>Table of Contents</h2>
    <ol>
      <li><a href="about.xhtml">About This Novel</a></li>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('EPUB/nav.xhtml', navHtml);

  // 8. EPUB 2 NCX Document (toc.ncx)
  const ncxItems = [
    `    <navPoint id="navpoint-about" playOrder="1">
      <navLabel><text>About This Novel</text></navLabel>
      <content src="about.xhtml"/>
    </navPoint>`
  ];
  chapters.forEach((ch, i) => {
    const fn = `chapter_${String(i + 1).padStart(2, '0')}.xhtml`;
    ncxItems.push(`    <navPoint id="navpoint-${i + 2}" playOrder="${i + 2}">
      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
      <content src="${fn}"/>
    </navPoint>`);
  });

  const tocNcx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3998/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:novel-${novel.slug}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(novel.title)}</text></docTitle>
  <navMap>
${ncxItems.join('\n')}
  </navMap>
</ncx>`;
  zip.file('EPUB/toc.ncx', tocNcx);

  // 9. EPUB Package Document (content.opf)
  const manifestItems: string[] = [
    '<item id="style" href="style/main.css" media-type="text/css"/>',
    '<item id="about" href="about.xhtml" media-type="application/xhtml+xml"/>',
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
  ];
  const spineItems: string[] = ['<itemref idref="about"/>'];

  if (hasCover) {
    manifestItems.unshift(
      '<item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>',
      '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>'
    );
    spineItems.unshift('<itemref idref="cover"/>');
  }

  chapters.forEach((_, i) => {
    const fn = `chapter_${String(i + 1).padStart(2, '0')}.xhtml`;
    const id = `ch_${i + 1}`;
    manifestItems.push(`<item id="${id}" href="${fn}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${id}"/>`);
  });

  const opfXml = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:novel-${novel.slug}</dc:identifier>
    <dc:title>${escapeXml(novel.title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>${escapeXml(novel.author)}</dc:creator>
    <dc:publisher>${escapeXml(options.publisher || 'Novel-to-EPUB Client')}</dc:publisher>
    <dc:description>${escapeXml(novel.synopsis)}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
    ${hasCover ? '<meta name="cover" content="cover-image"/>' : ''}
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  zip.file('EPUB/content.opf', opfXml);

  // 10. Generate In-Memory Binary EPUB Blob
  if (onProgress) onProgress(95, 'Compressing EPUB archive in browser memory...');
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  if (onProgress) onProgress(100, 'EPUB compiled successfully!');
  return blob;
}
