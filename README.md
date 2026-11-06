# Novel to EPUB Converter (Next.js + TypeScript)

A production-ready Next.js application that converts serialized web novel series into reader-ready EPUB books. All heavy processing (content sanitization, formatting, and EPUB zip compilation) runs **100% client-side in the user's browser**.

Designed for one-click deployment to **Vercel**.

---

## 🚀 One-Click Deploy to Vercel

### Method A: Deploy with Vercel CLI (Fastest)

1. Ensure the Vercel CLI is installed:
   ```bash
   npm i -g vercel
   ```
2. Run deployment from the project directory:
   ```bash
   cd /home/exu/novel-to-epub-app
   vercel
   ```
3. To deploy directly to production:
   ```bash
   vercel --prod
   ```

### Method B: Deploy via GitHub / GitLab

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete web novel to epub converter"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Select your repository and click **Deploy**. Vercel will automatically detect Next.js and build it with zero configuration.

---

## 💻 Local Development

```bash
# Using Bun (fastest)
bun install
bun run dev

# Or using npm
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Architecture & Features

- **100% In-Browser Computation**:
  - The browser queries the novel's WordPress REST API directly with CORS support.
  - HTML content is sanitized into strict XHTML using native `DOMParser`.
  - EPUB archives are built entirely in browser memory using `JSZip` and downloaded via in-memory `Blob` URLs.
  - Zero server database or background jobs needed.
- **Auto Metadata & Cover Art**:
  - Automatically parses English title, author, Chinese original title, and chapter count.
  - Automatically pulls official cover art, with an automatic client-side HTML5 Canvas fallback cover generator if images are missing.
- **Customizable Reading Styles**:
  - Typography options: Classic Serif or Modern Sans-Serif.
  - Indentation styles: Standard 1.5em first-line indent or block spacing.
- **Dual EPUB 3 & EPUB 2 Navigation**:
  - Generates both `nav.xhtml` (EPUB 3) and `toc.ncx` (EPUB 2) for universal compatibility with Kindle, Apple Books, Kobo, and Android e-readers.
- **Optional Edge Proxy Route (`/api/proxy`)**:
  - Built-in Next.js Edge route available if any third-party host ever requires a serverless CORS relay.
