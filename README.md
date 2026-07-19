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

# Google AI — Gemini 3.5 Flash (תמלול, חילוץ ושכתוב)
# קבל מ: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY="your_key_here"

# Anthropic — Claude Sonnet 5 (כתיבת מכתב)
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
  wizard/page.tsx      # Wizard
  result/page.tsx      # דף תוצאה + אפסייל
  database/page.tsx    # ניהול לידים (מוגן בסיסמה)
  api/                 # API routes

backend/services/
  ai/                  # extract, generate, verify, knowledge, examples, prompts
  jobs/                # משימות רקע, ולידציה ומעבדים מודולריים
  security/            # admin-auth, rate-limiter, sanitize, encryption
  pdf/                 # Puppeteer PDF
  db/prisma.ts

lib/                   # Types, constants, utils
prisma/schema.prisma
prisma/migrations/
```

## משתני סביבה נוספים

```
ADMIN_SECRET=...       # סיסמה ל-/database ו-/api/leads
ENCRYPTION_KEY=...     # מפתח הצפנת PII (AES-256-GCM)
INNGEST_EVENT_KEY=...  # שליחת משימות רקע
INNGEST_SIGNING_KEY=... # אימות קריאות worker
```

### עיבוד ברקע

העיבוד רץ מיד אחרי יצירת המשימה דרך `after()` של Next.js, כך שה־wizard
עובד גם בלי Inngest. Inngest הוא שכבת עמידות/retries אופציונלית:

1. הוסף `INNGEST_EVENT_KEY` ו־`INNGEST_SIGNING_KEY` ב־Vercel.
2. סנכרן את ה־App ל־endpoint: `https://YOUR_DOMAIN/api/inngest`.
3. בפיתוח מקומי אפשר גם: `npx inngest-cli@latest dev`

העלאות זמניות ל-R2 עוברות דרך `/api/jobs/uploads` בשרת.
אם `DATABASE_URL` מגיע מ-Neon עם `sslmode=require`, הקוד מנרמל אוטומטית ל-`verify-full`.

לאחר שינוי schema:
```bash
npx prisma migrate deploy
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
