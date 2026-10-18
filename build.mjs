// Generador estático: lee /content (JSON editado desde /admin) y escribe la web en /dist.
// Sin frameworks: solo Node y "marked" para convertir el texto con formato.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { marked } from 'marked';

const ROOT = dirname(new URL(import.meta.url).pathname);
const OUT = join(ROOT, 'dist');
const C = join(ROOT, 'content');

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const collection = (dir) =>
  existsSync(join(C, dir))
    ? readdirSync(join(C, dir))
        .filter((f) => f.endsWith('.json'))
        .map((f) => ({ slug: f.replace(/\.json$/, ''), ...readJSON(join(C, dir, f)) }))
    : [];

const site = readJSON(join(C, 'ajustes.json'));
const perfil = readJSON(join(C, 'perfil.json'));
const proyectos = collection('proyectos').sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99) || String(b.anio).localeCompare(String(a.anio)));
const noticias = collection('noticias').sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s = '') => marked.parse(String(s));
const fecha = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? esc(iso) : new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
};
const meta = (p) => [p.tipo, p.ubicacion, p.anio].filter(Boolean).map(esc).join(', ');
const year = new Date().getFullYear();
const igUrl = site.instagram ? `https://www.instagram.com/${site.instagram.replace(/^@/, '')}/` : '';

const nav = [
  ['/proyectos/', 'Proyectos'],
  ['/estudio/', 'Estudio'],
  ['/noticias/', 'Noticias'],
  ['/contacto/', 'Contacto'],
];

function layout({ title, description, path, body, image }) {
  const fullTitle = title ? `${title}, ${site.nombre}` : `${site.nombre}, ${site.subtitulo}`;
  const desc = description || site.descripcion_seo || site.intro;
  const ogImg = image ? site.url + image : '';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(site.url + path)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
${ogImg ? `<meta property="og:image" content="${esc(ogImg)}">` : ''}
<meta name="theme-color" content="#F5F6F2">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;1,400&family=Young+Serif&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/estilos.css">
</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
<header class="cabecera">
  <a class="marca" href="/" aria-label="${esc(site.nombre)}, inicio">
    <span class="marca-nombre">${esc(site.nombre)}</span>
    <span class="marca-oficio">${esc(site.subtitulo)}</span>
  </a>
  <button class="menu-boton" aria-expanded="false" aria-controls="menu">Menú</button>
  <nav id="menu" class="menu" aria-label="Principal">
    ${nav.map(([href, label]) => `<a href="${href}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('\n    ')}
  </nav>
</header>
<main id="contenido">
${body}
</main>
<footer class="zocalo">
  <div class="zocalo-dentro">
    <p class="zocalo-frase">¿Tienes una casa entre manos?</p>
    <a class="zocalo-email" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
    <div class="zocalo-datos">
      <p>${esc(site.telefono)}<br>${esc(site.ciudad)}</p>
      ${igUrl ? `<p><a href="${igUrl}" rel="noopener">Instagram</a></p>` : ''}
      <p class="zocalo-pie">© ${year} ${esc(site.nombre)}</p>
    </div>
  </div>
</footer>
<script src="/web.js" defer></script>
</body>
</html>`;
}

const img = (src, alt, cls = '', eager = false) =>
  `<img src="${esc(src)}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

const tarjetaProyecto = (p, i) => `
    <article class="obra obra-${i % 4}" data-tipo="${esc(p.tipo)}">
      <a href="/proyectos/${p.slug}/">
        <div class="obra-foto">${img(p.portada, p.titulo)}</div>
        <h3 class="obra-titulo">${esc(p.titulo)}</h3>
        <p class="obra-meta">${meta(p)}</p>
      </a>
    </article>`;

const filaNoticia = (n) => `
      <li class="nota">
        <time datetime="${esc(n.fecha)}">${fecha(n.fecha)}</time>
        <a href="/noticias/${n.slug}/">${esc(n.titulo)}</a>
        ${n.medio ? `<span class="nota-medio">${esc(n.medio)}</span>` : ''}
      </li>`;

// ---------- Páginas ----------
const pages = {};

const destacado = proyectos.find((p) => p.destacado) || proyectos[0];
const seleccion = proyectos.filter((p) => p.destacado && p !== destacado).slice(0, 4);
if (seleccion.length < 4) seleccion.push(...proyectos.filter((p) => p !== destacado && !seleccion.includes(p)).slice(0, 4 - seleccion.length));

pages['index.html'] = layout({
  path: '/',
  image: destacado?.portada,
  body: `
<section class="portada">
  <div class="portada-texto">
    <h1>${esc(site.lema)}</h1>
    <p>${esc(site.intro)}</p>
    <a class="enlace-fuerte" href="/proyectos/">Ver todos los proyectos</a>
  </div>
  ${destacado ? `
  <figure class="portada-arco">
    <a href="/proyectos/${destacado.slug}/" class="arco">
      ${img(destacado.portada, destacado.titulo, '', true)}
      <span class="arco-luz" aria-hidden="true"></span>
    </a>
    <figcaption><a href="/proyectos/${destacado.slug}/">${esc(destacado.titulo)}</a>, ${esc(destacado.ubicacion)}</figcaption>
  </figure>` : ''}
</section>

<section class="bloque">
  <div class="bloque-cabeza">
    <h2>Proyectos recientes</h2>
    <a href="/proyectos/">Ver los ${proyectos.length}</a>
  </div>
  <div class="obras">${seleccion.map(tarjetaProyecto).join('')}
  </div>
</section>

<section class="bloque estudio-avance">
  <div class="arco arco-pequeno">${img(perfil.retrato, `Retrato de ${site.nombre}`)}</div>
  <div>
    <h2>${esc(perfil.titular)}</h2>
    ${md(perfil.bio.split('\n\n')[0])}
    <a class="enlace-fuerte" href="/estudio/">Trayectoria y currículum</a>
  </div>
</section>

${noticias.length ? `
<section class="bloque">
  <div class="bloque-cabeza">
    <h2>Noticias</h2>
    <a href="/noticias/">Todas las noticias</a>
  </div>
  <ul class="notas">${noticias.slice(0, 3).map(filaNoticia).join('')}
  </ul>
</section>` : ''}
`,
});

const tipos = [...new Set(proyectos.map((p) => p.tipo).filter(Boolean))];
pages['proyectos/index.html'] = layout({
  title: 'Proyectos',
  path: '/proyectos/',
  description: `Proyectos de interiorismo de ${site.nombre}: viviendas y locales.`,
  body: `
<section class="cabeza-pagina">
  <h1>Proyectos</h1>
  <p>Viviendas y locales terminados desde que abrí el estudio. Los más recientes, primero.</p>
  ${tipos.length > 1 ? `
  <div class="filtros" role="group" aria-label="Filtrar por tipo">
    <button type="button" aria-pressed="true" data-filtro="">Todos</button>
    ${tipos.map((t) => `<button type="button" aria-pressed="false" data-filtro="${esc(t)}">${esc(t)}</button>`).join('\n    ')}
  </div>` : ''}
</section>
<section class="bloque bloque-sin-cabeza">
  <div class="obras obras-todas">${proyectos.map(tarjetaProyecto).join('')}
  </div>
</section>`,
});

proyectos.forEach((p, idx) => {
  const sig = proyectos[(idx + 1) % proyectos.length];
  const galeria = (p.galeria || []).filter((g) => g.imagen && g.imagen !== p.portada);
  pages[`proyectos/${p.slug}/index.html`] = layout({
    title: p.titulo,
    path: `/proyectos/${p.slug}/`,
    description: p.resumen,
    image: p.portada,
    body: `
<article class="ficha">
  <header class="ficha-cabeza">
    <a class="volver" href="/proyectos/">Proyectos</a>
    <h1>${esc(p.titulo)}</h1>
    <p class="ficha-resumen">${esc(p.resumen)}</p>
  </header>
  <figure class="ficha-arco">
    <div class="arco">${img(p.portada, p.galeria?.[0]?.pie || p.titulo, '', true)}</div>
  </figure>
  <div class="ficha-cuerpo">
    <dl class="ficha-datos">
      ${p.tipo ? `<div><dt>Tipo</dt><dd>${esc(p.tipo)}</dd></div>` : ''}
      ${p.ubicacion ? `<div><dt>Lugar</dt><dd>${esc(p.ubicacion)}</dd></div>` : ''}
      ${p.anio ? `<div><dt>Año</dt><dd>${esc(p.anio)}</dd></div>` : ''}
      ${p.superficie ? `<div><dt>Superficie</dt><dd>${esc(p.superficie)}</dd></div>` : ''}
      ${p.fotografia ? `<div><dt>Fotografía</dt><dd>${esc(p.fotografia)}</dd></div>` : ''}
    </dl>
    <div class="texto">${md(p.cuerpo)}</div>
  </div>
  ${galeria.length ? `
  <div class="galeria">
    ${galeria.map((g) => `<figure>${img(g.imagen, g.pie || p.titulo)}${g.pie ? `<figcaption>${esc(g.pie)}</figcaption>` : ''}</figure>`).join('\n    ')}
  </div>` : ''}
  ${sig && sig !== p ? `
  <nav class="siguiente" aria-label="Siguiente proyecto">
    <span>Siguiente proyecto</span>
    <a href="/proyectos/${sig.slug}/">${esc(sig.titulo)}</a>
  </nav>` : ''}
</article>`,
  });
});

const cvSeccion = (titulo, items) =>
  items?.length
    ? `
    <section class="cv-seccion">
      <h2>${titulo}</h2>
      <ol class="cv-lista">
        ${items.map((it) => `<li><span class="cv-anio">${esc(it.anio)}</span><span class="cv-texto"><strong>${esc(it.titulo)}</strong>${it.lugar ? `<br>${esc(it.lugar)}` : ''}</span></li>`).join('\n        ')}
      </ol>
    </section>`
    : '';

pages['estudio/index.html'] = layout({
  title: 'Estudio',
  path: '/estudio/',
  description: `Trayectoria y currículum de ${site.nombre}.`,
  image: perfil.retrato,
  body: `
<section class="estudio">
  <div class="estudio-lado">
    <div class="arco">${img(perfil.retrato, `Retrato de ${site.nombre}`, '', true)}</div>
  </div>
  <div class="estudio-texto">
    <h1>${esc(perfil.titular)}</h1>
    <div class="texto">${md(perfil.bio)}</div>
    <p class="estudio-zona">${esc(site.zona)}</p>
    <div class="cv">
      ${cvSeccion('Formación', perfil.formacion)}
      ${cvSeccion('Experiencia', perfil.experiencia)}
      ${cvSeccion('Reconocimientos', perfil.reconocimientos)}
      ${cvSeccion('Publicaciones', perfil.publicaciones)}
    </div>
    ${perfil.cv_pdf ? `<p><a class="enlace-fuerte" href="${esc(perfil.cv_pdf)}" download>Descargar currículum en PDF</a></p>` : ''}
  </div>
</section>`,
});

pages['noticias/index.html'] = layout({
  title: 'Noticias',
  path: '/noticias/',
  description: `Publicaciones, premios y novedades del estudio de ${site.nombre}.`,
  body: `
<section class="cabeza-pagina">
  <h1>Noticias</h1>
  <p>Publicaciones, premios, charlas y lo que va pasando en el estudio.</p>
</section>
<section class="bloque bloque-sin-cabeza">
  ${noticias.length ? `<div class="noticias">
    ${noticias.map((n) => `
    <article class="noticia">
      ${n.imagen ? `<a class="noticia-foto" href="/noticias/${n.slug}/" tabindex="-1" aria-hidden="true">${img(n.imagen, '')}</a>` : ''}
      <div>
        <time datetime="${esc(n.fecha)}">${fecha(n.fecha)}</time>
        <h2><a href="/noticias/${n.slug}/">${esc(n.titulo)}</a></h2>
        <p>${esc(n.resumen)}</p>
      </div>
    </article>`).join('')}
  </div>` : '<p>Todavía no hay noticias publicadas.</p>'}
</section>`,
});

noticias.forEach((n) => {
  pages[`noticias/${n.slug}/index.html`] = layout({
    title: n.titulo,
    path: `/noticias/${n.slug}/`,
    description: n.resumen,
    image: n.imagen,
    body: `
<article class="articulo">
  <a class="volver" href="/noticias/">Noticias</a>
  <time datetime="${esc(n.fecha)}">${fecha(n.fecha)}${n.medio ? `, ${esc(n.medio)}` : ''}</time>
  <h1>${esc(n.titulo)}</h1>
  <p class="ficha-resumen">${esc(n.resumen)}</p>
  ${n.imagen ? `<figure class="articulo-foto">${img(n.imagen, n.titulo, '', true)}</figure>` : ''}
  <div class="texto">${md(n.cuerpo)}</div>
  ${n.enlace ? `<p><a class="enlace-fuerte" href="${esc(n.enlace)}" rel="noopener">Leer en ${esc(n.medio || 'la fuente original')}</a></p>` : ''}
</article>`,
  });
});

pages['contacto/index.html'] = layout({
  title: 'Contacto',
  path: '/contacto/',
  description: `Contacta con ${site.nombre} para tu proyecto de interiorismo.`,
  body: `
<section class="contacto">
  <h1>Cuéntame qué casa tienes entre manos.</h1>
  <p>Respondo en dos o tres días laborables. Si puedes, incluye dónde está, cuántos metros tiene y alguna foto del estado actual.</p>
  <a class="contacto-email" href="mailto:${esc(site.email)}?subject=${encodeURIComponent('Proyecto de interiorismo')}">${esc(site.email)}</a>
  <dl class="contacto-datos">
    <div><dt>Teléfono</dt><dd><a href="tel:${esc(site.telefono.replace(/\s/g, ''))}">${esc(site.telefono)}</a></dd></div>
    <div><dt>Estudio</dt><dd>${esc(site.ciudad)}</dd></div>
    ${igUrl ? `<div><dt>Instagram</dt><dd><a href="${igUrl}" rel="noopener">@${esc(site.instagram.replace(/^@/, ''))}</a></dd></div>` : ''}
  </dl>
  <p class="estudio-zona">${esc(site.zona)}</p>
</section>`,
});

pages['404.html'] = layout({
  title: 'Página no encontrada',
  path: '/404',
  body: `
<section class="contacto">
  <h1>Esta página no existe o ha cambiado de sitio.</h1>
  <p><a class="enlace-fuerte" href="/proyectos/">Ir a los proyectos</a></p>
</section>`,
});

// ---------- Escritura ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'public'), OUT, { recursive: true });
for (const [file, html] of Object.entries(pages)) {
  const dest = join(OUT, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
}
const urls = Object.keys(pages).filter((f) => f !== '404.html').map((f) => site.url + '/' + f.replace(/index\.html$/, ''));
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nDisallow: /admin/\nSitemap: ${site.url}/sitemap.xml\n`);
console.log(`Web generada: ${Object.keys(pages).length} páginas en /dist`);
