"use client";

import { Button } from "@/components/ui/Button";

interface WizardDialogsProps {
  resetOpen: boolean;
  homeOpen: boolean;
  cancelOpen: boolean;
  onCloseReset: () => void;
  onConfirmReset: () => void;
  onCloseHome: () => void;
  onConfirmHome: () => void;
  onCloseCancel: () => void;
  onConfirmCancel: () => void;
}

export function WizardDialogs(props: WizardDialogsProps) {
  return (
    <>
      {props.resetOpen && (
        <Dialog
          title="לחזור להתחלה?"
          description="חזרה לשלב הראשון תמחק את המידע שחולץ מההקלטה או מהטקסט. יהיה צורך לתאר שוב את המקרה."
          onClose={props.onCloseReset}
          actions={
            <>
              <Button
                variant="primary"
                className="flex-1"
                onClick={props.onConfirmReset}
              >
                כן, התחל מחדש
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={props.onCloseReset}
              >
                ביטול
              </Button>
            </>
          }
        />
      )}

      {props.homeOpen && (
        <Dialog
          title="לעזוב את הוויזרד?"
          description="אפשר לחזור מאוחר יותר. משימה שכבר נשלחה תמשיך לעבוד ברקע ותשוחזר אוטומטית."
          onClose={props.onCloseHome}
          actions={
            <>
              <Button
                variant="primary"
                className="flex-1"
                onClick={props.onConfirmHome}
              >
                כן, חזור לדף הבית
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={props.onCloseHome}
              >
                להישאר כאן
              </Button>
            </>
          }
        />
      )}

      {props.cancelOpen && (
        <Dialog
          title="להפסיק להמתין כרגע?"
          description="העיבוד ימשיך ברקע. כשתחזור לכאן, המערכת תציג את ההתקדמות או את המכתב שהושלם."
          onClose={props.onCloseCancel}
          actions={
            <>
              <Button
                variant="ghost"
                className="flex-1 !border-[var(--color-error)] !text-[var(--color-error)]"
                onClick={props.onConfirmCancel}
              >
                כן, הפסק להמתין
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={props.onCloseCancel}
              >
                המשך ליצור
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

function Dialog(props: {
  title: string;
  description: string;
  onClose: () => void;
  actions: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={props.onClose}
      />
      <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-8 flex flex-col gap-4 scale-in">
        <h3 className="text-lg font-bold text-[var(--color-ink)]">
          {props.title}
        </h3>
        <p className="text-sm text-[var(--color-body)] leading-relaxed">
          {props.description}
        </p>
        <div className="flex gap-3 mt-2">{props.actions}</div>
      </div>
    </div>
  );
}

