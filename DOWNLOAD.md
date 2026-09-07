Descargas y Releases

Este repositorio ahora está configurado para generar paquetes descargables y publiacar el sitio en GitHub Pages automáticamente.

Qué se ha añadido:

- LICENSE (MIT)
- .gitattributes para excluir node_modules/dist en los ZIP generados por GitHub
- .github/workflows/release.yml — construye el proyecto y crea una Release con un ZIP (release.zip) como asset.
- .github/workflows/pages.yml — construye y publica la carpeta `dist/` en GitHub Pages.

Cómo descargar la aplicación (para cualquier usuario):

1. Espera a que exista una Release en la pestaña "Releases" del repositorio (se crearán automáticamente al hacer push en `main` o `master` o puedes lanzar el workflow manualmente desde la pestaña Actions).
2. En la Release encontrarás `release.zip` — descárgalo y descomprímelo. Contendrá el contenido de `dist/` (build de frontend) y, si aplica, archivos de servidor.
3. Para ejecutar la app localmente:
   - Instala dependencias: `npm ci`
   - Si el paquete contiene solo frontend estático (dist), puedes servirlo con cualquier servidor estático (ej: `npx serve dist` o desplegar en Netlify/Vercel).
   - Si incluye servidor (server bundle), sigue las instrucciones del README para ejecutar.

Cómo publicar una Release manualmente:

- Ve a la pestaña Actions > Build and Create Release > Run workflow (workflow_dispatch) y ejecútalo.

Notas y recomendaciones:

- Asegúrate de que la rama principal se llame `main` o `master`. Los workflows escuchan ambas.
- Para publicar GitHub Pages, en "Settings > Pages" selecciona la rama `gh-pages` (peaceiris/actions-gh-pages publica allí automáticamente). La URL se mostrará en esa sección.
- Si quieres, puedo también añadir un badge en README con el enlace a la página y otro a la última Release. ¿Lo agrego ahora?
