# Refinamiento de la landing · noviembre de 2026

## Criterio

Se aplica [landing-page-design](https://github.com/elayadesign/ai-design-skills/blob/main/skills/landing-page-design/SKILL.md) y su guía complementaria [redesign-existing-projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md).

El pedido de conservar los colores y el branding tiene prioridad sobre los valores genéricos de las skills. Se mantienen el negro mineral `#111410`, el lima `#d7f45b`, el papel `#f1f2e9`, el logotipo, Space Grotesk y DM Sans. Se conserva el diseño de hero más secciones: los casos de uso se entienden con imágenes de la operación y ejemplos de registro.

## Diagnóstico y decisiones

- Los recuadros de detección, barridos, polígonos y etiquetas competían con los videos y las fotos. Se eliminan; controles y descripciones quedan fuera de la imagen.
- Los registros ilustrativos se muestran en un panel separado. El plano de acceso restringido se identifica como un esquema, sin simular resultados sobre una operación real.
- La tipografía y los espacios se organizan en escalas consistentes. El texto pequeño parte de 12 px; los párrafos principales de 16 px. Se conserva la identidad tipográfica.
- Una navegación compacta, un menú móvil completo y un CTA coherente hacen más claro el recorrido. Se mantienen navegación por teclado, estados de foco, reproducción manual y movimiento reducido.
- Las seis preguntas se pueden leer directamente. El cierre presenta una única acción principal, con el alcance real del brief explicado antes de abrirlo.
- El mensaje intermedio se revela suavemente por palabras. No se agregan movimientos continuos ni efectos de seguimiento sobre los medios.

## Alcance funcional

La página sigue siendo HTML, CSS y JavaScript estáticos. Se mantienen las pestañas, el estimador con supuestos editables y el brief descargable. No se agregan dependencias de ejecución, analítica, datos de clientes inventados ni resultados de producción simulados.

La fuente pública de esta versión es `docs/` en la rama `voxxel-landing`. Los archivos de la versión inicial en otros proyectos no se usan para publicar GitHub Pages.
