# התראה בקליק — README

## הגדרת סביבה מקומית

### 1. העתק את קובץ ה-env

```bash
cp .env.local.example .env.local
```

### 2. מלא את ה-API keys

ב-`.env.local`:

```bash
# Database — PostgreSQL מקומי או Neon free tier
DATABASE_URL="postgresql://user:password@localhost:5432/hatraabeklik"

# Google AI — Gemini Flash 2.5 (תמלול + חילוץ פרטים)
# קבל מ: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY="your_key_here"

# Anthropic — Claude Sonnet 4.6 (כתיבת מכתב)
# קבל מ: https://console.anthropic.com/
ANTHROPIC_API_KEY="your_key_here"

# URL של האתר
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. הגדר DB

#### אפשרות א׳ — Neon (מומלץ לפרודקשן):
1. צור חשבון חינמי ב-[neon.tech](https://neon.tech)
2. צור DB חדש
3. העתק את ה-connection string ל-`DATABASE_URL`

#### אפשרות ב׳ — PostgreSQL מקומי:
```bash
createdb hatraabeklik
```

### 4. הרץ מיגרציות

```bash
npx prisma migrate dev --name init
```

### 5. הפעל

```bash
npm run dev
```

האתר יעלה על http://localhost:3000

---

## מבנה הפרויקט

```
app/                    # Next.js App Router
  page.tsx             # דף נחיתה
  wizard/page.tsx      # Wizard 4 שלבים
  result/page.tsx      # דף תוצאה + אפסייל
  database/page.tsx    # ניהול לידים
  api/                 # API routes

backend/services/       # לוגיקת ליבה
  ai/extract.ts        # Gemini Flash — תמלול + חילוץ
  ai/generate.ts       # Claude Sonnet — כתיבת מכתב
  templates/           # 4 תבניות משפטיות
  pdf/render.ts        # Puppeteer PDF generation
  db/prisma.ts         # Prisma client

components/             # React components
lib/                    # Types, constants, utils
prisma/schema.prisma   # DB schema
```

---

## דיפלוי ל-Vercel

1. חבר את ה-GitHub repo ל-Vercel
2. הוסף את ה-environment variables ב-Vercel dashboard
3. הגדר `DATABASE_URL` ל-Neon connection string
4. ב-`vercel.json` הוסף:

```json
{
  "functions": {
    "app/api/pdf/route.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

---

## הוספת חתימת עו"ד אמיתית

החלף את `public/signature.png` בתמונת החתימה האמיתית (PNG על רקע שקוף).
אין צורך לשנות שום קוד.
