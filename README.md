<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e747213c-8d6e-4cf5-86e0-f2b12a4d11b5

## Quick download

[![Download ZIP](https://img.shields.io/badge/Download-ZIP-blue?style=for-the-badge&logo=github)](https://github.com/emeneses115kv-sys/MeneElectricPower-/archive/refs/heads/main.zip)
[![Releases](https://img.shields.io/github/v/release/emeneses115kv-sys/MeneElectricPower-?style=for-the-badge)](https://github.com/emeneses115kv-sys/MeneElectricPower-/releases)
[![License](https://img.shields.io/github/license/emeneses115kv-sys/MeneElectricPower-?style=for-the-badge)](https://github.com/emeneses115kv-sys/MeneElectricPower-/blob/main/LICENSE)


## Opción A — Descarga directa (recomendada)

Esta opción está pensada para que cualquier usuario pueda obtener el código y ejecutar la aplicación localmente en su máquina con el menor número de pasos posible.

Pasos rápidos:

1. Descargar el ZIP
   - Haz clic en el badge "Download ZIP" arriba o usa este enlace directo:
     https://github.com/emeneses115kv-sys/MeneElectricPower-/archive/refs/heads/main.zip
   - Descomprime el archivo en tu carpeta de trabajo.

2. Requisitos
   - Node.js (versión recomendada >= 18)
   - npm (v9+) o pnpm/yarn

3. Instalar dependencias

```bash
cd MeneElectricPower-main
npm install
```

4. Variables de entorno

Crea un archivo `.env.local` en la raíz con las claves necesarias. Ejemplo mínimo:

```
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

5. Ejecutar en modo desarrollo

```bash
npm run dev
```

La app se servirá en http://localhost:3000 (o el puerto configurado por el proyecto). Sigue las instrucciones en consola.

6. Build y despliegue (opcional)

```bash
npm run build
npm run preview
```

7. Instalación como PWA (opcional)

La app incluye manifest y Service Worker para instalación como PWA. Para instalar en tu navegador o dispositivo:
- En Chrome/Edge (Android/PC): usa el menú del navegador "Instalar" o el badge de instalación integrado en la UI de la aplicación.
- En iOS (Safari): Compartir -> "Agregar a la pantalla de inicio".


## Notas y buenas prácticas

- Si planeas usar la integración con Google Gemini/API externas, coloca tus claves en `.env.local` y no las subas al repositorio.
- Para sincronizar proyectos en la nube (Firebase) debes configurar `firebase.ts` con credenciales de proyecto y habilitar Firestore/Auth.
- Recomendamos crear releases (GitHub Releases) y adjuntar assets (ej. ZIPs o instaladores) para facilitar descargas a usuarios que no usan git.

---

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
