import { GroundShots } from "@/components/landing/GroundShots";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const LAWS = [
  "חוק הגנת הצרכן",
  "חוק השכירות והשאילה",
  "פקודת הנזיקין",
  "חוק הבנקאות (שירות ללקוח)",
  "חוק הגנת השכר",
  "חוק למניעת מפגעים",
];

const PILLARS = [
  {
    num: "01",
    title: "מאגר סגור",
    body: "לכל סוג מקרה יש רשימת חוקים וסעיפים. המודל כותב מתוכה. לא מכל האינטרנט.",
  },
  {
    num: "02",
    title: "אימון עם עו״ד",
    body: "אימנו מודל יחד עם עורך דין מוסמך, וסגרנו אותו על המאגר. זה לא זיכרון כללי של מודל.",
  },
  {
    num: "03",
    title: "בלי להמציא",
    body: "סעיף שלא במאגר לא נכנס למכתב. עדיף ניסוח עובדתי מאשר חוק שנשמע נכון.",
  },
];

export function GroundedInLaw() {
  return (
    <section data-glow="ledger" className="ground-section relative overflow-hidden">
      <div className="ground-section-grain" aria-hidden />
      <div className="ground-section-rule" />

      <div className="relative z-[1] max-w-5xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
          <div>
            <ScrollReveal>
              <p className="why-kicker">המאגר</p>
              <h2 className="why-heading">לא ממציא חוק.</h2>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <p className="ground-lead">
                אימנו מודל יחד עם עורך דין מוסמך, וסגרנו אותו על מאגר ידע משפטי.
                הוא לא מחפש בגוגל, ולא ממציא סעיף שנשמע משכנע.
              </p>
            </ScrollReveal>
            <GroundShots items={PILLARS} />
          </div>

          <ScrollReveal delay={120} direction="scale">
            <div className="ground-ledger" aria-hidden>
              <div className="ground-ledger-bar" />
              <p className="ground-ledger-kicker">מאגר ידע · לפי סוג מקרה</p>
              <ul className="ground-ledger-list">
                {LAWS.map((law) => (
                  <li key={law}>
                    <span className="ground-ledger-mark" />
                    {law}
                  </li>
                ))}
              </ul>
              <p className="ground-ledger-foot">סעיף שלא כאן, לא במכתב.</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
