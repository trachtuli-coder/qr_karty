# 🚀 Vytvoření GitHub repozitáře a push kódu

## 1. Vytvořte repozitář na GitHubu
1. Přihlaste se na [github.com](https://github.com)
2. Klikněte **"New"** (zelené tlačítko vpravo nahoře)
3. Název repozitáře: `ar-cards-project`
4. Popis (volitelné): `Mluvící karty s AR funkcí`
5. **Public** (nebo Private, pokud chcete)
6. **NEZAŠKRTÁVEJTE** "Add a README file", "Add .gitignore", "Choose a license"
7. Klikněte **"Create repository"**

## 2. Push kódu do GitHubu
Otevřete terminál ve složce projektu (`c:/Users/trach/Desktop/Moje_ karty`) a spusťte:

```bash
# Inicializace Git repozitáře
git init

# Přidání všech souborů
git add .

# První commit
git commit -m "Initial commit: AR cards with print functionality

✅ Features:
- FileStorage system for uploads
- A4 portrait print layout (2x4, 85x55mm cards)
- Dynamic QR codes with window.location.origin
- Batch upload and individual card management
- Print preview with TISK button
- VYMAZAT button in editor
- Vercel deployment ready

🔧 Technical:
- Next.js 14 with TypeScript
- QR code generation (qrcode.react)
- File upload API (/api/upload)
- SessionStorage for print metadata
- CSS Grid for print layout
- Responsive design with Tailwind CSS"

# Přidání GitHub repozitáře (nahraďte YOUR_USERNAME vaším GitHub jménem)
git remote add origin https://github.com/YOUR_USERNAME/ar-cards-project.git

# Push kódu
git branch -M main
git push -u origin main
```

## 3. Propojení s Vercel
1. Vraťte se na [vercel.com](https://vercel.com)
2. Klikněte **"Add New Project"**
3. Repozitář `ar-cards-project` by se měl nyní zobrazit
4. Klikněte **"Import"**
5. Vercel automaticky detekuje Next.js
6. Klikněte **"Deploy"**

## 4. Po nasazení
- Aplikace bude dostupná na: `https://ar-cards-project.vercel.app`
- QR kódy automaticky odkazují na produkční URL
- Tiskový modul je plně funkční
- Upload souborů funguje

## 🎯 Hotovo!
Po těchto krocích bude aplikace nasazena a plně funkční pro testování QR kódů z mobilu.
