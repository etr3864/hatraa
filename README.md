# התראה בקליק — README

> **ארכיטקטורה, סיסטם דיזיין וזרימות מלאות:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## הגדרת סביבה מקומית

### 1. העתק את קובץ ה-env

```bash
cp .env.local.example .env.local
```

### 2. מלא את ה-API keys

ב-`.env.local` לפחות:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/hatraabeklik"
GOOGLE_AI_API_KEY="..."
ANTHROPIC_API_KEY="..."
ADMIN_SECRET="..."          # ≥ 8 תווים
ENCRYPTION_KEY="..."        # מפתח להצפנת PII
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

מומלץ בפרוד (וגם ללוקאל אם בודקים): `UPSTASH_*`, R2, Inngest — ראה `.env.local.example` ו־`ARCHITECTURE.md`.

### 3. הגדר DB

#### אפשרות א׳ — Neon (מומלץ לפרודקשן):
1. צור חשבון ב-[neon.tech](https://neon.tech)
2. העתק connection string ל-`DATABASE_URL`

#### אפשרות ב׳ — PostgreSQL מקומי:
```bash
createdb hatraabeklik
```

### 4. הרץ מיגרציות

```bash
npx prisma migrate dev
```

### 5. הפעל

```bash
npm run dev
```

http://localhost:3000

---

## מבנה בקצרה

```
app/                 # UI + API routes
backend/services/    # AI, jobs, PDF, security, storage, analytics
components/          # UI לפי תחום
lib/                 # types, constants, attorney config
prisma/              # schema + migrations
```

פירוט מלא → [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## עיבוד ברקע

העיבוד רץ דרך `after()` של Next.js מיד אחרי יצירת המשימה — עובד גם בלי Inngest.  
Inngest הוא שכבת retries / cron אופציונלית (`INNGEST_*` + sync ל־`/api/inngest`).

---

## דיפלוי ל-Vercel

1. חבר את ה-repo ל-Vercel
2. הוסף environment variables (ראה `.env.local.example` + `ARCHITECTURE.md`)
3. `DATABASE_URL` → Neon
4. אחרי שינוי schema: `npx prisma migrate deploy`

מגבלות פונקציות מוגדרות ב־`vercel.json` (PDF / attorney-rewrite: 1024MB, 60s).

---

## חתימת עו״ד

**לא** לשים ב־`public/`.  
טעינה פרטית: `ATTORNEY_SIGNATURE_BASE64` ו/או קובץ ב־R2 (`ATTORNEY_SIGNATURE_R2_KEY`).  
קשקוש המותג נמצא ב־`backend/services/pdf/assets/signature-scribble.png`.
