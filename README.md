# Mluvící karty

Next.js aplikace s App Routerem, Tailwind CSS a TypeScriptem.

## Požadavky

- Node.js 18.17 nebo novější
- npm

## Instalace a spuštění

1. **Nainstaluj závislosti**
   ```bash
   npm install
   ```

2. **Spusť vývojový server**
   ```bash
   npm run dev
   ```
   Aplikace poběží na [http://localhost:3000](http://localhost:3000).

3. **Build pro produkci**
   ```bash
   npm run build
   npm start
   ```

## Skripty

- `npm run dev` — vývojový server s Turbopackem
- `npm run build` — produkční build
- `npm start` — spuštění produkčního serveru
- `npm run lint` — ESLint kontrola

## Struktura projektu

- `app/` — App Router (layout.tsx, page.tsx, globals.css)
- `public/` — statické soubory
- Konfigurace: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
