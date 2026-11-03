# Voxxel.ai

Landing estática en español sobre visión artificial para minería: eficiencia de camiones, seguridad de personas, protección patrimonial y acceso a zonas restringidas.

## Publicación

- Repositorio: https://github.com/blusa/blog
- Sitio: https://voxxel.ai/
- Rama de GitHub Pages: `voxxel-landing`
- Carpeta publicada: `/docs`
- `docs/CNAME` conserva el dominio; `docs/.nojekyll` publica los archivos sin Jekyll.
- No requiere compilación ni dependencias de ejecución. HTML, CSS, JavaScript, videos y fuentes se sirven desde `docs/`.
- `docs/404.html` ofrece una página de error con acceso al inicio. Los cambios de estilo y JavaScript usan un identificador de versión en sus URLs para evitar mezclar archivos en caché durante una publicación.

Para actualizar el sitio, modificar `docs/` en esta rama y hacer un push. No publicar la raíz del repositorio: contiene el blog anterior.

Los workflows tutoriales de GitHub Skills (Step 0 a Step 4) estaban deshabilitados al preparar esta publicación y deben permanecer así. Pueden recrear archivos del blog y publicar comentarios de ejercicios.

## Recuperar el blog

El blog anterior permanece intacto en `main`, commit `d991bf50648f09684aef88356a268a1ba534795e`. También se conserva en la etiqueta `archive/blog-before-voxxel-2026-10-31`.

Para volver a publicarlo, cambiar la fuente de GitHub Pages a la rama `main`, carpeta `/`. El CNAME original sigue presente allí. No es necesario borrar archivos ni reescribir el historial.

## Contenido y alcance

La página incluye demostraciones ilustrativas y un estimador de ahorro. No se conecta a cámaras ni ejecuta detección en producción. Los supuestos del estimador son editables.

El formulario del piloto genera un brief descargable en el navegador. No envía datos, no crea leads en un CRM y no usa un correo inventado; la integración comercial queda pendiente de definir el canal de contacto.

Videos y fotografía bajo licencia Pexels; los enlaces de origen y la licencia están en el diálogo de créditos de la landing. Las licencias SIL de las fuentes se incluyen en `docs/assets/`.

El criterio del refinamiento visual de noviembre está documentado en `VOXXEL_DESIGN.md`.

La landing anterior al refinamiento se conserva en la etiqueta `archive/voxxel-before-refinement-2026-11-03`, commit `37ee5452fafb899a4ba0948571fbbeb7c45d8ba2`. Para volver a esa versión se puede revertir el commit del refinamiento y publicar el revert en `voxxel-landing`, sin cambiar el dominio ni reescribir el historial.
