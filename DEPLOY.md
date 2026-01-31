# Nasazení na Vercel

## 1. Připravené soubory
- `vercel.json` - konfigurace pro Vercel deploy
- `.env.example` - příklad proměnných prostředí

## 2. Kroky pro nasazení

### Vytvoření repozitáře
```bash
git init
git add .
git commit -m "Initial deploy setup"
git remote add origin <vas-github-repo>
git push -u origin main
```

### Nasazení na Vercel
1. Přihlaste se na [vercel.com](https://vercel.com)
2. Klikněte "Add New Project"
3. Propojte GitHub repozitář
4. Vercel automaticky detekuje Next.js
5. Klikněte "Deploy"

## 3. Konfigurace QR kódů
QR kódy automaticky používají `window.location.origin`, takže budou fungovat na jakékoliv doméně:
- Lokálně: `http://localhost:3000/karta/1`
- Produkce: `https://vas-domena.vercel.app/karta/1`

## 4. Omezení
- **FileStorage**: Data jsou uložena v RAM, při restartu serveru se smažou
- **Uploads**: Soubory se ukládají do `public/uploads/` a zůstávají trvale
- **SessionStorage**: Metadata pro tisk zůstávají po dobu session

## 5. Testování z mobilu
1. Nasaďte aplikaci na Vercel
2. Otevřete veřejnou URL v mobilním prohlížeči
3. Nahrajte fotky
4. Vytiskněte karty
5. Otestujte QR kódy - musí vést na veřejnou URL

## 6. Produkční build
```bash
npm run build
npm start
```

Aplikace je připravena pro produkční nasazení na Vercel.
