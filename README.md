# Kiosko Deportivo (automático)

Página + función de servidor que lee los feeds RSS de los periódicos deportivos y muestra las noticias al abrir la web (se refresca sola cada 5 min).

## Publicar en Vercel (gratis)
1. Crea un repositorio en GitHub y sube estos archivos (`index.html`, `package.json`, `api/news.js`).
2. En vercel.com → "Add New… → Project" → importa el repositorio → "Deploy". No hay que cambiar ajustes.
3. Vercel te da una dirección pública (algo como `tu-proyecto.vercel.app`).
   (Alternativa con terminal: instala la CLI y ejecuta `npx vercel` en esta carpeta.)

## Añadir o corregir periódicos
Edita la lista `FEEDS` al principio de `api/news.js` (nombre + URL del feed RSS) y vuelve a subir.
La página muestra arriba qué periódicos responden y cuáles fallan, con el motivo.
Los feeds de Marca y AS se comprobaron como activos; los de Mundo Deportivo y Sport pueden necesitar ajustar la URL.
