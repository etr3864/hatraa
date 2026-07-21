import { BUSINESS } from "@/lib/business";
import { SIGNATURE_PRICE, SITE_NAME } from "@/lib/constants";
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

      <LegalSection title="4. מחירים">
        <p>
          יצירת מכתב התראה בסיסי באמצעות השירות ניתנת ללא תשלום. שדרוג למכתב
          בשם עורך דין, כולל ניסוח בלשון ייצוג וחתימה מאומתת, עולה{" "}
          <strong>{SIGNATURE_PRICE} ש״ח</strong> (כולל מע״מ, ככל שחל). המחיר
          יוצג גם במסך הרכישה לפני השלמת התשלום.
        </p>
      </LegalSection>

      <LegalSection title="5. תשלומים, ביטולים והחזרים">
        <p>
          רכישת שדרוג חתימת עו״ד מהווה עסקה מקוונת הכפופה לחוק הגנת הצרכן,
          התשמ״א-1981, ולתקנותיו.
        </p>
        <ul className="list-disc pr-6 space-y-2 mt-3">
          <li>
            <strong>זכות ביטול:</strong> לצרכן עומדת זכות לבטל עסקה מקוונת תוך{" "}
            <strong>14 יום</strong> ממועד ביצוע העסקה, בהתאם לדין.
          </li>
          <li>
            <strong>מוצר דיגיטלי שסופק:</strong> אם השירות הדיגיטלי כבר סופק
            במלואו — ובכלל זה הורדת קובץ PDF, קבלת מכתב מאומת/חתום, או השלמת
            שכתוב המכתב בשם עו״ד — לא יינתן החזר כספי, בהתאם לחריגים הקבועים
            בחוק לעניין מוצרים דיגיטליים שסופקו.
          </li>
          <li>
            בקשות ביטול/החזר שטרם סופק השירות במלואו יישלחו אל:{" "}
            {BUSINESS.email}
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. קניין רוחני">
        <p>
          כל הזכויות באתר, בממשק, בעיצוב, בלוגו, בטקסטים, בתבניות, בקוד ובתוכן
          המקורי של המפעיל — שמורות ל-{BUSINESS.legalName} ו/או לבעלי הזכויות
          הרלוונטיים. אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בתוכן האתר
          ללא אישור מראש ובכתב. תוכן שהמשתמש הזין (תיאור מקרה, ראיות וכיו״ב)
          נשאר באחריותו; המשתמש מעניק למפעיל רישיון שימוש בו לצורך מתן השירות
          והפעלתו, לרבות העברה לעורכי דין כמפורט בתנאים אלה.
        </p>
      </LegalSection>

      <LegalSection title="7. הגבלת אחריות">
        <p>
          המפעיל אינו אחראי לנזק הנובע משימוש במכתב, מטעויות של מערכת ה-AI,
          או משירותי צד שלישי לרבות עורכי דין שאליהם הופניתם.
        </p>
      </LegalSection>

      <LegalSection title="8. פרטיות">
        <p>
          השימוש במידע אישי כפוף ל
          <a href="/privacy" className="text-[var(--color-accent)] underline mx-1">
            מדיניות הפרטיות
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. דין וסמכות שיפוט">
        <p>
          התנאים כפופים לדין הישראלי. סמכות השיפוט הייחודית לבתי המשפט במחוז תל
          אביב-יפו.
        </p>
      </LegalSection>

      <LegalSection title="10. יצירת קשר">
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
