# Web de interiorismo

Web estática para una interiorista: proyectos, noticias, biografía y currículum, con un panel de edición en `/admin` para actualizarla sin tocar código. Se publica gratis en Cloudflare Pages con una dirección del tipo `nombre.pages.dev`.

## Qué hay dentro

| Carpeta / archivo | Para qué sirve |
|---|---|
| `content/` | Todo el contenido (proyectos, noticias, perfil, ajustes). Es lo que edita el panel. |
| `public/uploads/` | Fotos. Las de muestra son ilustraciones para sustituir. |
| `public/admin/` | El panel de edición (Decap CMS) y su configuración. |
| `public/estilos.css` | Todo el diseño. Colores y tipografías arriba del todo. |
| `functions/api/` | El acceso con GitHub para el panel (funciona dentro de Cloudflare). |
| `build.mjs` | Convierte el contenido en páginas web. |

## Publicar por primera vez (unos 20 minutos)

Necesitas una cuenta gratuita de **GitHub** y otra de **Cloudflare**.

### 1. Subir el proyecto a GitHub
1. En github.com, pulsa **New repository**. Ponle un nombre, por ejemplo `web-ines`. Puede ser privado.
2. En la página del repositorio vacío, pulsa **uploading an existing file** y arrastra todo el contenido de esta carpeta (no la carpeta en sí, lo de dentro). Pulsa **Commit changes**.

### 2. Crear la web en Cloudflare Pages
1. En dash.cloudflare.com ve a **Workers & Pages → Create → Pages → Connect to Git**.
2. Elige el repositorio. En la configuración:
   - **Project name**: será la dirección, por ejemplo `inescalvo` → `inescalvo.pages.dev`
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Pulsa **Save and Deploy**. En un par de minutos la web está en línea.

### 3. Activar el panel de edición
1. En GitHub: **Settings (de tu perfil) → Developer settings → OAuth Apps → New OAuth App**.
   - **Homepage URL**: `https://inescalvo.pages.dev`
   - **Authorization callback URL**: `https://inescalvo.pages.dev/api/callback`
   - Guarda, copia el **Client ID** y genera un **Client secret**.
2. En Cloudflare, en tu proyecto de Pages: **Settings → Variables and Secrets**, añade:
   - `GITHUB_CLIENT_ID` = el Client ID
   - `GITHUB_CLIENT_SECRET` = el secret (márcalo como *Encrypt*)
3. En GitHub, edita `public/admin/config.yml` y cambia las dos líneas marcadas con `CAMBIAR` (el repositorio `usuario/web-ines` y la dirección de la web). Al guardar, Cloudflare vuelve a publicar solo.
4. Si la web no se llama `inescalvo.pages.dev`, cambia también la dirección en **Sobre mí y ajustes → Datos de contacto** desde el panel.

Listo: entrando en `https://inescalvo.pages.dev/admin` y pulsando **Iniciar sesión con GitHub** se puede editar todo. Cada vez que se guarda un cambio, la web se actualiza sola en uno o dos minutos.

> Si quiere que otra persona (por ejemplo, la propia interiorista) edite con su propia cuenta de GitHub, añádela como colaboradora en el repositorio: **Settings → Collaborators**.

## Uso diario del panel

- **Proyectos → Nuevo proyecto**: título, fotos, texto. Marcar *Destacado* para que salga en portada. El de *Orden 1* ocupa el arco grande de la portada.
- **Noticias → Nueva noticia**: fecha, titular, resumen e imagen opcional.
- **Sobre mí y ajustes**: biografía, retrato, currículum (formación, experiencia, premios, publicaciones), PDF del CV y datos de contacto.

Fotos: mejor en JPG, entre 1600 y 2400 píxeles de ancho y por debajo de 1 MB. Para reducirlas sirve squoosh.app.

## Dominio propio (opcional)

`*.pages.dev` es gratis para siempre. Si más adelante compra un dominio (`inescalvo.es`, unos 10 € al año), se conecta en Cloudflare Pages → **Custom domains**, y hay que actualizar la dirección en el panel y en la OAuth App de GitHub.

## Probar en tu ordenador

```
npm install
npm run build
npx serve dist
```
