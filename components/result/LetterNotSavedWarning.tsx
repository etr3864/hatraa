import { IconAlertTriangle } from "@tabler/icons-react";

export function LetterNotSavedWarning() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/12 px-4 py-3 text-right"
    >
      <IconAlertTriangle
        size={20}
        className="mt-0.5 flex-shrink-0 text-[var(--color-gold)]"
        aria-hidden
      />
      <p className="text-sm font-semibold leading-relaxed text-[var(--color-gold)]">
        מטעמי אבטחה המכתב לא נשמר במערכת, כדאי להוריד אותו עכשיו אחרת הוא יאבד!
      </p>
    </div>
  );
}
