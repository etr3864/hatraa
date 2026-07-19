import { BUSINESS } from "@/lib/business";
import { SITE_NAME } from "@/lib/constants";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/LegalPageShell";

export const metadata = {
  title: `הצהרת נגישות | ${SITE_NAME}`,
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell title="הצהרת נגישות">
      <LegalSection title="1. מחויבות לנגישות">
        <p>
          {BUSINESS.legalName} שואפת להנגיש את אתר {SITE_NAME} לכלל הציבור,
          בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות ולתקן ישראלי 5568
          (מבוסס WCAG ברמת AA).
        </p>
      </LegalSection>

      <LegalSection title="2. התאמות באתר">
        <ul className="list-disc pr-6 space-y-2">
          <li>תמיכה בניווט מקלדת ובקישור &quot;דלג לתוכן&quot;.</li>
          <li>
            תפריט נגישות פונקציונלי: הגדלת טקסט, ניגודיות, הדגשת קישורים,
            הפחתת תנועה וגופן קריא.
          </li>
          <li>מבנה עמודים עם כותרות, תוויות בטפסים והודעות שגיאה בעברית.</li>
          <li>תאימות לדפדפנים מודרניים במחשב ובמובייל.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. מגבלות ידועות">
        <p>
          ייתכנו חלקים שטרם הונגשו במלואם, לרבות מסמכי PDF שנוצרים דינמית
          ותוכן שמועלה על ידי משתמשים. אנו ממשיכים לשפר את הנגישות באופן שוטף.
          תפריט הנגישות מסייע, אך אינו מחליף בדיקת נגישות מקצועית מלאה.
        </p>
      </LegalSection>

      <LegalSection title="4. רכז/ת נגישות">
        <p>
          שם: {BUSINESS.accessibilityCoordinatorName}
          <br />
          דוא״ל: {BUSINESS.accessibilityEmail}
          <br />
          טלפון: {BUSINESS.accessibilityPhone}
        </p>
        <p>
          נשמח לקבל דיווח על תקלת נגישות ולטפל בה בהקדם האפשרי.
        </p>
      </LegalSection>

      <LegalSection title="5. עדכון ההצהרה">
        <p>הצהרה זו עודכנה לאחרונה ב{BUSINESS.lastUpdatedLabel}.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
