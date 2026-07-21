# התראה בקליק — ארכיטקטורה וסיסטם דיזיין

מסמך זה הוא מקור האמת להבנת המערכת: מוצר, זרימות, שכבות, נתונים, אבטחה ודיפלוי.  
להרצה מקומית בלבד → ראה [`README.md`](./README.md).

---

## 1. מה זה המוצר

**התראה בקליק** (`hatraa.co.il`) — מוצר צרכני שמייצר מכתב התראה משפטי בעברית ב־AI, חינם, עם שדרוג בתשלום לחתימת עו״ד.

| | |
|--|--|
| **מודל עסקי** | לידים חינם → אפסייל חתימת עו״ד ב־**250 ₪** (`SIGNATURE_PRICE`) |
| **תשלום** | כרגע **mock בלבד** (`Payment.status = "mock"`) — אין סליקה אמיתית |
| **חשבונות משתמש** | אין. זיהוי לפי cookie סשן + `localStorage` |
| **מי מרוויח** | בעל המוצר (לידים למכירה / שותפות עם עו״ד) + עמלת חתימה |

**עקרון משפטי/שיווקי:** המוצר מייצר מסמך מבוסס תבניות — לא מחליף ייעוץ עו״ד. ניסוחי השיווק מכוונים בהתאם (אין טענות "ללא עורך דין" / סטטיסטיקות בלי מקור).

---

## 2. Tech stack

| שכבה | טכנולוגיה | גרסה (package) |
|------|-----------|----------------|
| Framework | Next.js App Router | 16.2.6 |
| UI | React + Tailwind | 19.2.4 / 4.x |
| DB | PostgreSQL + Prisma | Prisma 7.8 |
| AI — חילוץ / תמלול / שכתוב | Google Gemini | `@google/genai` → `gemini-3.5-flash` |
| AI — כתיבת מכתב | Anthropic Claude | `@anthropic-ai/sdk` → `claude-sonnet-5` |
| Jobs | Next.js `after()` + Inngest (אופציונלי) | inngest 4.x |
| Rate limit / lockout | Upstash Redis | `@upstash/redis` + `@upstash/ratelimit` |
| Files | Cloudflare R2 (S3 API) | `@aws-sdk/client-s3` |
| PDF | Puppeteer (+ Chromium ב־Vercel) + pdf-lib | puppeteer-core 25 / chromium-min 148 |
| Deploy | Vercel | `vercel.json` |

> **AGENTS.md:** Next 16 שונה מאימון ישן — לפני שינויי framework לקרוא docs תחת `node_modules/next/dist/docs/`.

---

## 3. מבנה תיקיות

```
app/                         # Next App Router — UI + API routes דקים
  page.tsx                   # Landing
  wizard/                    # אשף יצירת מכתב
  result/                    # תוצאה + אפסייל + הורדה
  database/                  # CRM לידים (סיסמה)
  admin/                     # overview / leads / pricing
  privacy|terms|accessibility/
  api/                       # Route Handlers בלבד — בלי לוגיקה כבדה

backend/
  services/
    ai/                      # extract, generate, rewrite, verify, prompts, knowledge, examples
    jobs/                    # ProcessingJob: create, claim, execute, processors, validation
    pdf/                     # template, letterhead, signature, hebrew-date, render, appendices
    security/                # admin-auth, login-guard, rate-limiter, sanitize, encryption
    storage/                 # R2
    analytics/               # sessions, events, metrics
    ai-usage/ + pricing/     # עלויות מודלים / FX
    leads/                   # מחיקת לידים וכו׳
  inngest/                   # client + process-job + cron cleanup

components/                  # UI לפי תחום: wizard, result, admin, legal, database, ui
lib/                         # types, constants, attorney/business, client helpers
hooks/                       # use-leave-guard
prisma/                      # schema + migrations
```

**כלל זהב:** API routes דקים → לוגיקה ב־`backend/services/`. אין God File ב־`app/api`.

---

## 4. ארכיטקטורה כללית

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (RTL)                                              │
│  wizard / result / admin                                    │
│  cookie: hatraa_session · localStorage: letterResult / jobs │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────────────────────┐
│  Next.js (Vercel)                                           │
│  app/api/*  →  backend/services/*                           │
│  after() לביצוע jobs · Inngest אופציונלי ל־retries          │
└───┬─────────┬─────────┬─────────┬─────────┬─────────────────┘
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
 Postgres   Gemini   Claude    R2      Upstash
 (Neon)     extract  generate  files   rate/lockout
            rewrite
```

**שכבות:**

| שכבה | אחריות |
|------|--------|
| UI | טפסים, polling, אפסייל, leave-guard |
| API | auth/rate-limit/validation → קריאה לשירות |
| Domain services | AI, PDF, jobs, leads, analytics |
| Infra | Prisma, R2, Redis, Inngest, Puppeteer |

---

## 5. זרימת משתמש מקצה לקצה

```
Landing (/)
    │
    ▼
Wizard (/wizard)
    ├─ 1. input        טקסט חופשי או הקלטה
    ├─ 2. evidence     העלאה ל-R2 דרך /api/jobs/uploads
    ├─ extracting      ProcessingJob: EXTRACTION  (poll)
    ├─ 3. confirm      עריכת פרטים שחולצו
    ├─ 4. tone         טון + מטרה
    ├─ 5. contact      פרטי שולח (פרט / חברה)
    └─ generating      ProcessingJob: LETTER_GENERATION
            │
            ▼
Result (/result)  ← localStorage["letterResult"]
    │
    ├─ Upsell pending (מכתב מטושטש חתימה)
    │     ├─ Decline → הורדת PDF לא חתום
    │     └─ Accept
    │           → POST /api/payment   (mock)
    │           → ProcessingJob: ATTORNEY_REWRITE
    │           → PDF חתום (letterhead + קשקוש + חתימה)
    │
    └─ Leave guard: אזהרה ביציאה / Back / רענון
```

### PDF חתום מול לא חתום

| | לא חתום | חתום (אחרי תשלום mock) |
|--|---------|-------------------------|
| Letterhead עו״ד | לא | כן — "שועלי משרד עו״ד" |
| חתימה | שם השולח | "בכבוד רב" + משרד + עורך דין צבר שועלי + קשקוש |
| שער אבטחה | — | `Payment.status ∈ {completed, mock}` — **לא** סומכים על `withSignature` מהלקוח |

---

## 6. Background Jobs

### סוגי משימות

| Type | תפקיד |
|------|--------|
| `EXTRACTION` | תמלול (אם אודיו) + חילוץ שדות ל־JSON |
| `LETTER_GENERATION` | יצירת מכתב + שמירת Lead/Letter/Evidence |
| `ATTORNEY_REWRITE` | שכתוב בלשון ייצוג אחרי תשלום |

סטטוסים: `QUEUED → PROCESSING → SUCCEEDED | FAILED`

### איך זה רץ

1. **Primary:** אחרי יצירת job — `after()` של Next.js מריץ `executeProcessingJob` מיד (עובד גם בלי Inngest).
2. **אופציונלי:** אם יש מפתחות Inngest — אירוע `hatraabeklik/job.requested` ל־retries / concurrency / cron cleanup.
3. **Claim אידמפוטנטי:** מונע כפל ביצוע בין `after()` ל־Inngest.
4. **Client:** polling כל ~1.5s ל־`GET /api/jobs/[id]`; `jobId` נשמר ב־`localStorage`.

### Ownership

- Cookie `hatraa_session` (httpOnly).
- Job שייך ל־`sessionId`.
- Rewrite דורש גם `Lead.analyticsSessionId === sessionId`.
- Input/result של job מוצפנים ב־DB.
- Retention: ~7 ימים + cron ניקוי ב־Inngest.

---

## 7. Pipeline AI

| שלב | מודל | הערות |
|-----|------|--------|
| תמלול | `gemini-3.5-flash` | אודיו → טקסט |
| חילוץ | `gemini-3.5-flash` | JSON + קטגוריה + ראיות |
| כתיבת מכתב | `claude-sonnet-5` | המסמך הראשי |
| Citation / guardrail retry | `claude-sonnet-5` | תיקונים ממוקדים |
| שכתוב עו״ד | `gemini-3.5-flash` | לשון ייצוג |
| Verify | **ללא LLM** | בדיקת ציטוטים מול knowledge; הסרת פסקאות לא תקינות |

### Grounding

- `backend/services/ai/knowledge/` — חוקים לפי קטגוריה + `knowledgeVersion`
- `backend/services/ai/examples/` — דוגמאות סגנון
- Prompt: system + knowledge + examples + case, עם `wrapUserInput` נגד injection

קטגוריות: צרכנות, בנקים, עבודה, שכירות, נזיקין, שכנים, רשויות (`lib/constants.ts`).

---

## 8. מודל נתונים (Prisma)

```
AnalyticsSession ──┬── Lead ──┬── Letter (1:1)
                   │          ├── Payment (1:1)
                   │          ├── Evidence (1:N)
                   │          ├── ProcessingJob (N)
                   │          ├── AnalyticsEvent (N)
                   │          └── AiCallLog (N)
                   └── AnalyticsEvent / AiCallLog (גם ישירות)
```

| מודל | תפקיד |
|------|--------|
| `Lead` | איש קשר (PII מוצפן) + קישור לסשן |
| `Letter` | תוכן מכתב, קטגוריה, טון, audit (`knowledgeVersion`, `verified`…) |
| `Payment` | סכום + סטטוס (`mock` / `completed` …) |
| `Evidence` | מטא־דאטה + מפתח R2 |
| `ProcessingJob` | תור רקע מוצפן |
| `AnalyticsSession` / `AnalyticsEvent` | משפך + UTM |
| `AiCallLog` / `AiModelPrice` / `FxRate` | עלות AI |

### הצפנת PII

- AES-256-GCM, prefix `enc:v1:` (`ENCRYPTION_KEY`)
- מוצפן: שם/ת״ז/כתובת/טלפון/מייל של Lead + payloads של jobs
- **לא מוצפן כיום:** `Letter.content` ותוכן המכתב ב־DB (גלוי למי עם גישת DB/אדמין)

---

## 9. אבטחה

| מנגנון | פירוט |
|--------|--------|
| Admin | `ADMIN_SECRET` (≥8); cookie HMAC `hatraa_admin` 12h או Bearer |
| Login lockout | 5 כישלונות / 15 דק׳ — Upstash או memory |
| Rate limit | 10/יום/IP (ברירת מחדל) — Upstash sliding window או memory |
| Sanitize | ניקוי HTML + עטיפת קלט משתמש ב־prompt |
| חתימת עו״ד | **לא** ב־`public/` — `ATTORNEY_SIGNATURE_BASE64` או R2 פרטי; API רק ל־session+paid |
| Leave guard | `beforeunload` + `popstate` + דיאלוג; ביציאה אחרי תשלום מוחק `letterResult` |
| PDF signature gate | בדיקת Payment בשרת — לא אמון בלקוח |

**חשוב:** בלי Upstash — rate limit / lockout חלשים ב־Vercel (כל instance עם memory נפרד).

---

## 10. PDF

1. בניית HTML RTL (`template` → letterhead / parties / body / signature)
2. תאריך לועזי + **עברי** בצד שמאל (`hebrew-date.ts`)
3. חתום: letterhead + קשקוש (`pdf/assets/signature-scribble.png`) + חתימת יד (אופציונלי מ־env/R2)
4. Puppeteer → PDF; נספחי ראיות (תמונות/PDF) ממוזגים ב־`pdf-lib`
5. Vercel: `puppeteer-core` + `@sparticuz/chromium-min` (pack v148; אפשר override ב־`CHROMIUM_REMOTE_EXEC_PATH`)
6. `vercel.json`: `/api/pdf` ו־`/api/attorney-rewrite` — memory 1024, maxDuration **60**

ברנדינג עו״ד: `lib/attorney.ts` (שם משרד / עורך דין צבר שועלי).

---

## 11. Admin / CRM

| מסך | תפקיד |
|-----|--------|
| `/database` | לידים: צפייה, פאנל, CSV, מחיקה / bulk-delete |
| `/admin/overview` | KPIs, funnel, trends, שימוש במודלים |
| `/admin/leads` | תצוגת לידים |
| `/admin/pricing` | מחירי מודלים / FX |

APIs מאחורי `validateAdminToken`:  
`/api/leads*`, `/api/admin/analytics`, `/api/admin/pricing`, `/api/admin/auth/*`.

---

## 12. Analytics

**Client** (מאחורי הסכמת cookies):  
`SITE_VISIT`, `WIZARD_STARTED`, `DETAILS_COMPLETED`, `PAYMENT_STARTED`

**Server:**  
`EXTRACTION_COMPLETED`, `LETTER_GENERATED`, `PAYMENT_COMPLETED`, `ATTORNEY_REWRITE_COMPLETED`, `PDF_DOWNLOADED`

---

## 13. APIs עיקריות

| Endpoint | תפקיד |
|----------|--------|
| `POST /api/jobs` | יצירת ProcessingJob |
| `GET /api/jobs/[id]` | סטטוס + תוצאה |
| `POST /api/jobs/uploads` | העלאה זמנית ל־R2 |
| `POST /api/payment` | סימון תשלום mock |
| `POST /api/pdf` | ייצור PDF (חתימה רק אחרי payment) |
| `GET /api/attorney-signature` | data-URL חתימה ל־UI (session+paid) |
| `POST /api/extract` · `/api/generate` · `/api/attorney-rewrite` | נתיבים ישנים/גיבוי — ה־wizard המודרני עובר ב־jobs |
| `POST /api/analytics/events` | אירועי אנליטיקס |
| `POST /api/inngest` | Inngest worker |
| Admin routes | לידים / אנליטיקס / pricing / auth |

---

## 14. משתני סביבה

### חובה בפרודקשן

| קבוצה | משתנים |
|-------|--------|
| DB | `DATABASE_URL` |
| AI | `GOOGLE_AI_API_KEY`, `ANTHROPIC_API_KEY` |
| Secrets | `ADMIN_SECRET`, `ENCRYPTION_KEY` |
| R2 | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |
| Site | `NEXT_PUBLIC_SITE_URL` |

### מומלץ מאוד

| קבוצה | משתנים |
|-------|--------|
| Rate limit | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Jobs | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| חתימה | `ATTORNEY_SIGNATURE_BASE64` ו/או `ATTORNEY_SIGNATURE_R2_KEY` |
| FX | `USD_ILS_FALLBACK_RATE` |

### אופציונלי

- `NEXT_PUBLIC_ATTORNEY_*` / `NEXT_PUBLIC_BUSINESS_*` — override לפרטי עו״ד/עסק
- `CHROMIUM_REMOTE_EXEC_PATH` — CDN ל־Chromium pack ב־Vercel
- `R2_ACCOUNT_ID` — מופיע ב־example; הקוד משתמש ב־`R2_ENDPOINT` + keys

רשימת שלד: [`.env.local.example`](./.env.local.example).

---

## 15. דיפלוי

1. GitHub → Vercel
2. Env ב־Production (למעלה)
3. Neon ל־`DATABASE_URL`
4. `npx prisma migrate deploy` אחרי שינוי schema
5. סנכרון Inngest ל־`https://YOUR_DOMAIN/api/inngest` (אם בשימוש)
6. Build: `prisma generate && next build`

---

## 16. החלטות חשובות / מלכודות

1. **`after()` הוא נתיב הביצוע העיקרי** — Inngest משפר עמידות, לא חובה ל־MVP.
2. **תשלום fake** — כל "שולם" הוא `mock`; gate החתימה תלוי בזה.
3. **מצב התוצאה ב־localStorage** — לא חשבון משתמש; leave-guard + באנר שחזור ב־wizard מפצים חלקית.
4. **אין חתימה ב־`public/`** — README ישן טעה; רק env/R2 פרטי + scribble ב־repo תחת `backend/services/pdf/assets/`.
5. **Verify דטרמיניסטי** — לא LLM; ציטוטים שבורים נחתכים.
6. **תוכן מכתב ב־DB לא מוצפן** — רק שדות איש קשר ב־Lead.
7. **בלי Upstash** — rate limit לא אפקטיבי בין instances.
8. **Chromium ב־Vercel** — cold start כבד; memory/timeout מוגדרים ב־`vercel.json`.
9. **Routes ישנים** (`/api/extract`, `/api/generate`) עדיין קיימים — ה־wizard משתמש ב־`/api/jobs`.
10. **`LOADER_MIN_MS`** — רצפת UX מלאכותית (40–55s), לא זמן ריצה אמיתי של ה־job.

---

## 17. מפת ניווט לקוד (איפה לגעת)

| נושא | התחלה כאן |
|------|-----------|
| אשף | `app/wizard/page.tsx`, `lib/wizard-jobs.ts`, `lib/processing-jobs.ts` |
| תוצאה / אפסייל | `app/result/page.tsx` |
| יצירת מכתב | `backend/services/ai/generate.ts` + `build-prompt` / `call-model` |
| חילוץ | `backend/services/ai/extract.ts` |
| שכתוב עו״ד | `backend/services/ai/rewrite-as-attorney.ts` |
| Jobs | `backend/services/jobs/` |
| PDF | `backend/services/pdf/` |
| עו״ד / משרד | `lib/attorney.ts` |
| מחיר חתימה | `lib/constants.ts` → `SIGNATURE_PRICE` |
| אבטחה | `backend/services/security/` |
| Schema | `prisma/schema.prisma` |

---

*עודכן לפי מצב הקוד ב־main. אם יש סתירה בין מסמך זה לקוד — הקוד מנצח; עדכן את המסמך.*
