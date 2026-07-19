"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconDownload, IconCheck } from "@tabler/icons-react";
import { LetterNotSavedWarning } from "@/components/result/LetterNotSavedWarning";
import type { LetterInput } from "@/lib/types";

interface DownloadSectionProps {
  leadId: string;
  fileName: string;
  content: string;
  letterInput: LetterInput;
  withSignature: boolean;
}

export function DownloadSection({
  leadId,
  fileName,
  content,
  letterInput,
  withSignature,
}: DownloadSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, withSignature, letterInput, content, fileName }),
      });

      if (!res.ok) throw new Error("שגיאה בייצור PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה בהורדה";
      console.error("PDF download error:", msg);
      alert(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-md">
        <LetterNotSavedWarning />
      </div>
      <Button
        variant={withSignature ? "gold" : "primary"}
        onClick={handleDownload}
        isLoading={isDownloading}
        className="w-full sm:w-auto px-10"
      >
        {downloaded ? (
          <>
            <IconCheck size={18} />
            הורד שוב
          </>
        ) : (
          <>
            <IconDownload size={18} />
            הורד PDF
            {withSignature && " עם חתימת עו&quot;ד"}
          </>
        )}
      </Button>
      <p className="text-xs text-[var(--color-subtle)] text-center">
        {fileName}.pdf
        {withSignature && " · כולל חתימת עורך דין"}
      </p>
    </div>
  );
}
