import { BUSINESS } from "@/lib/business";
import { SITE_NAME } from "@/lib/constants";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/LegalPageShell";

export const metadata = {
  title: `מדיניות פרטיות | ${SITE_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="מדיניות פרטיות">
      <LegalSection title="1. כללי">
        <p>
          מדיניות זו מסבירה כיצד {BUSINESS.legalName} (&quot;אנחנו&quot;) אוספים,
          משתמשים ומשתפים מידע אישי באתר {SITE_NAME}, בהתאם לחוק הגנת הפרטיות,
          התשמ״א-1981, ותיקון 13 לחוק.
        </p>
      </LegalSection>

      <LegalSection title="2. איזה מידע נאסף">
        <ul className="list-disc pr-6 space-y-2">
          <li>פרטי זיהוי ויצירת קשר: שם, טלפון, דוא״ל, כתובת, ת.ז. / ח.פ.</li>
          <li>תיאור המקרה, ראיות שהועלו, הקלטות קול (אם בחרתם), ומכתבים שנוצרו.</li>
          <li>נתוני שימוש ותפעול: מזהה הפעלה, סוג מכשיר, שלבי משפך, וזמן פעולות.</li>
          <li>נתוני תשלום סטטוס (לא פרטי כרטיס אשראי מלאים מאוחסנים אצלנו).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. מטרות השימוש">
        <ul className="list-disc pr-6 space-y-2">
          <li>יצירת מכתב התראה באמצעות בינה מלאכותית.</li>
          <li>מתן שירות לקוחות, אבטחה, ומניעת שימוש לרעה.</li>
          <li>
            העברת לידים לעורכי דין / משרדים בשיתוף פעולה — זהו חלק מרכזי במודל
            העסקי של השירות.
          </li>
          <li>שיפור השירות ואנליטיקה פנימית (רק בכפוף להסכמה לעוגיות אנליטיקה).</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. שיתוף מידע">
        <p>המידע עשוי להיות משותף עם:</p>
        <ul className="list-disc pr-6 space-y-2">
          <li>עורכי דין ומשרדים לצורך פנייה והצעת שירותים משפטיים.</li>
          <li>
            ספקי תשתית: מסד נתונים, אחסון קבצים, ספקי AI (עיבוד תוכן המכתב),
            ותשתית אחסון/אירוח.
          </li>
          <li>רשויות מוסמכות כנדרש על פי דין.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. עוגיות">
        <p>
          עוגיות הכרחיות משמשות לתפעול האתר (למשל הפעלה ואבטחה). עוגיות אנליטיקה
          יופעלו רק לאחר שתאשרו זאת בבאנר העוגיות. ניתן לשנות בחירה באמצעות מחיקת
          נתוני האתר בדפדפן.
        </p>
      </LegalSection>

      <LegalSection title="6. שמירה ואבטחה">
        <p>
          אנו נוקטים אמצעי אבטחה סבירים, לרבות הצפנת פרטים רגישים במסד הנתונים.
          משך השמירה הוא למשך הזמן הדרוש למתן השירות, לצרכים עסקיים ולדרישות
          הדין.
        </p>
      </LegalSection>

      <LegalSection title="7. זכויותיך">
        <p>
          בכפוף לדין, ניתן לבקש עיון, תיקון, מחיקה או התנגדות לשימוש מסוים
          במידע. פנו אל: {BUSINESS.privacyEmail}
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
