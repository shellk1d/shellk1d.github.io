#!/usr/bin/env node
// ============================================================
//  scripts/build.js
//  Convierte _posts/*.md → writeups/[slug].html
//  y regenera writeups/index.html con el listado completo
//
//  Uso: node scripts/build.js
//  Dependencias: npm install marked gray-matter
// ============================================================

const fs = require('fs');
const path = require('path');

// Dependencias (instala con npm install marked gray-matter)
let marked, matter;
try {
  marked = require('marked').marked;
  matter = require('gray-matter');
} catch (e) {
  console.error('❌  Faltan dependencias. Ejecuta: npm install marked gray-matter');
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────
const POSTS_DIR = path.join(__dirname, '../_posts');
const WRITEUPS_DIR = path.join(__dirname, '../writeups');
const TEMPLATE = path.join(WRITEUPS_DIR, '_template.html');
const INDEX = path.join(WRITEUPS_DIR, 'index.html');

// ── Helpers ─────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function difficultyClass(d) {
  const map = { insane: 'critical', hard: 'high', medium: 'medium', easy: 'low', info: 'info' };
  return map[(d || '').toLowerCase()] || 'low';
}

function osIcon(os) {
  const map = { linux: 'ubuntu', windows: 'windows', freebsd: 'gear' };
  return map[(os || '').toLowerCase()] || 'hdd';
}

function tagsHtml(tags = []) {
  return tags.map(t => `<span class="tag">${t}</span>`).join(' ');
}

// ── Read template ────────────────────────────────────────────
if (!fs.existsSync(TEMPLATE)) {
  console.error(`❌  No se encuentra la plantilla: ${TEMPLATE}`);
  process.exit(1);
}
const template = fs.readFileSync(TEMPLATE, 'utf8');

// ── Process posts ────────────────────────────────────────────
if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  console.log(`📁  Creada carpeta _posts/. Pon tus write-ups en Markdown ahí.`);
  process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse(); // más recientes primero

if (files.length === 0) {
  console.log('ℹ️   No hay archivos .md en _posts/. Añade write-ups y vuelve a ejecutar.');
  process.exit(0);
}

const posts = [];

files.forEach(file => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { data: fm, content } = matter(raw);

  // Frontmatter esperado:
  // title, date, platform, difficulty, os, excerpt, tags[]
  const slug = fm.slug || slugify(fm.title || path.basename(file, '.md'));
  const htmlContent = marked(content);

  const html = template
    .replace(/\{\{TITLE\}\}/g, fm.title || 'Sin título')
    .replace(/\{\{DATE\}\}/g, fm.date || '')
    .replace(/\{\{PLATFORM\}\}/g, fm.platform || 'CTF')
    .replace(/\{\{DIFFICULTY\}\}/g, fm.difficulty || 'Medium')
    .replace(/\{\{DIFFICULTY_CLASS\}\}/g, difficultyClass(fm.difficulty))
    .replace(/\{\{OS\}\}/g, fm.os || 'Linux')
    .replace(/\{\{OS_ICON\}\}/g, osIcon(fm.os))
    .replace(/\{\{EXCERPT\}\}/g, fm.excerpt || '')
    .replace(/\{\{TAGS\}\}/g, tagsHtml(fm.tags))
    .replace(/\{\{CONTENT\}\}/g, htmlContent);

  const outFile = path.join(WRITEUPS_DIR, `${slug}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✅  ${file} → writeups/${slug}.html`);

  posts.push({ slug, ...fm });
});

// ── Regenerate writeups/index.html card list ─────────────────
// Lee el index actual y reemplaza el bloque #writeups-grid
const indexRaw = fs.readFileSync(INDEX, 'utf8');

const gridItems = posts.map(p => {
  const dc = difficultyClass(p.difficulty);
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('\n            ');
  return `
    <div class="col-md-6 col-lg-4 writeup-item" data-tags="${(p.tags || []).join(' ').toLowerCase()} ${(p.platform || '').toLowerCase()} ${(p.difficulty || '').toLowerCase()}">
      <a href="${p.slug}.html" style="text-decoration:none;">
        <div class="writeup-card h-100">
          <div class="writeup-meta">
            <span class="tag">${p.platform || 'CTF'}</span>
            <span class="ms-2 severity-${dc}">${p.difficulty || 'Medium'}</span>
            <span class="ms-2"><i class="bi bi-calendar3 me-1"></i>${p.date || ''}</span>
          </div>
          <div class="writeup-title">${p.title}</div>
          <div class="writeup-excerpt">${p.excerpt || ''}</div>
          <div class="mt-3">${tags}</div>
        </div>
      </a>
    </div>`;
}).join('\n');

const newIndex = indexRaw.replace(
  /(<div class="row g-4" id="writeups-grid">)([\s\S]*?)(<\/div><!-- \/grid -->)/,
  `$1\n${gridItems}\n  $3`
);

fs.writeFileSync(INDEX, newIndex, 'utf8');
console.log(`\n✅  writeups/index.html actualizado con ${posts.length} entradas.`);
console.log(`\n🚀  Build completo. Sube los cambios con git push.`);
