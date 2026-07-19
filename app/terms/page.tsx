import { BUSINESS } from "@/lib/business";
import { SITE_NAME } from "@/lib/constants";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/LegalPageShell";

export const metadata = {
  title: `תנאי שימוש | ${SITE_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="תנאי שימוש">
      <LegalSection title="1. כללי">
        <p>
          השירות &quot;{SITE_NAME}&quot; מופעל על ידי {BUSINESS.legalName}{" "}
          ({BUSINESS.registrationType}: {BUSINESS.registrationNumber}). השימוש
          בשירות מהווה הסכמה לתנאים אלה.
        </p>
      </LegalSection>

      <LegalSection title="2. מהות השירות">
        <p>
          השירות מאפשר ליצור מכתבי התראה באמצעות בינה מלאכותית. המכתבים אינם
          מהווים ייעוץ משפטי ואינם תחליף להתייעצות עם עורך דין. רק מכתב שנחתם
          על ידי עורך דין (בכפוף לתשלום) עשוי להיחשב מכתב חתום.
        </p>
      </LegalSection>

      <LegalSection title="3. הסכמה להעברת מידע לעורכי דין">
        <p>בשימוש בשירות אתם מאשרים כי:</p>
        <ul className="list-disc pr-6 space-y-2">
          <li>
            פרטיכם ותיאור המקרה יועברו לעורכי דין / משרדים לצורך פנייה והצעת
            שירות.
          </li>
          <li>המפעיל עשוי לקבל תמורה בגין הפניית לידים.</li>
          <li>ניתן לבטל הסכמה לפניות עתידיות בפנייה בכתב למפעיל.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. תשלומים וביטולים">
        <p>
          אם בוצעה רכישת שדרוג (למשל ניסוח/חתימת עו״ד), יחולו דיני הגנת הצרכן
          הרלוונטיים לעסקאות מקוונות. לבירור ביטול/החזר: {BUSINESS.email}
        </p>
      </LegalSection>

      <LegalSection title="5. הגבלת אחריות">
        <p>
          המפעיל אינו אחראי לנזק הנובע משימוש במכתב, מטעויות של מערכת ה-AI,
          או משירותי צד שלישי לרבות עורכי דין שאליהם הופניתם.
        </p>
      </LegalSection>

      <LegalSection title="6. פרטיות">
        <p>
          השימוש במידע אישי כפוף ל
          <a href="/privacy" className="text-[var(--color-accent)] underline mx-1">
            מדיניות הפרטיות
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. דין וסמכות שיפוט">
        <p>
          התנאים כפופים לדין הישראלי. סמכות השיפוט הייחודית לבתי המשפט במחוז תל
          אביב-יפו.
        </p>
      </LegalSection>

      <LegalSection title="8. יצירת קשר">
        <p>
          {BUSINESS.legalName}
          <br />
          {BUSINESS.address}
          <br />
          {BUSINESS.email} · {BUSINESS.phone}
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
