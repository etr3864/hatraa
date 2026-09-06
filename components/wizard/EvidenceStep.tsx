"use client";

import { useState, useRef, useCallback } from "react";
import { IconUpload, IconX, IconFile, IconPhoto, IconFileText } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { StepHeading } from "@/components/wizard/StepHeading";
import type { EvidenceFile } from "@/lib/types";
import {
  normalizeEvidenceMime,
  shortenFileName,
  isSupportedEvidenceMime,
  SUPPORTED_EVIDENCE_MIMES,
  mapUploadError,
  resolveEvidenceFile,
} from "@/lib/evidence-mime";
import { uploadFileForJob } from "@/lib/job-upload";

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = Array.from(SUPPORTED_EVIDENCE_MIMES);

interface EvidencePreview extends EvidenceFile {
  previewUrl?: string;
}

interface EvidenceStepProps {
  initialFiles?: EvidenceFile[];
  onContinue: (files: EvidenceFile[]) => void;
  onSkip: () => void;
}

export function EvidenceStep({ initialFiles, onContinue, onSkip }: EvidenceStepProps) {
  const [files, setFiles] = useState<EvidencePreview[]>(initialFiles ?? []);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError("");
      const incoming = Array.from(fileList);

      if (files.length + incoming.length > MAX_FILES) {
        setError(`ניתן להעלות עד ${MAX_FILES} קבצים`);
        return;
      }

      for (const file of incoming) {
        const mime = normalizeEvidenceMime(file.type, file.name);
        if (!isSupportedEvidenceMime(mime) && !/\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name)) {
          setError(`סוג קובץ לא נתמך: ${shortenFileName(file.name)}. ניתן להעלות JPG, PNG, WebP, HEIC או PDF`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`הקובץ ${shortenFileName(file.name)} גדול מדי. מקסימום 10MB לקובץ`);
          return;
        }
      }

      try {
        setIsUploading(true);
        const newFiles: EvidencePreview[] = await Promise.all(
          incoming.map(async (file) => {
            const prepared = await resolveEvidenceFile(file);
            const storage = await uploadFileForJob({
              body: file,
              name: prepared.name,
              type: prepared.type,
            });
            return {
              name: prepared.name,
              type: prepared.type,
              base64: "",
              description: "",
              storage,
              previewUrl: file.type.startsWith("image/")
                ? URL.createObjectURL(file)
                : undefined,
            };
          })
        );

        setFiles((prev) => [...prev, ...newFiles]);
      } catch (err) {
        setError(mapUploadError(err));
      } finally {
        setIsUploading(false);
      }
    },
    [files.length]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateDescription = useCallback((index: number, desc: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description: desc } : f))
    );
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return <IconFileText size={24} className="text-red-500" />;
    if (type.startsWith("image/")) return <IconPhoto size={24} className="text-blue-500" />;
    return <IconFile size={24} className="text-gray-500" />;
  };

  const getPreview = (file: EvidencePreview) => {
    const previewSrc =
      file.previewUrl ||
      (file.base64 ? `data:${file.type};base64,${file.base64}` : "");
    if (file.type.startsWith("image/") && previewSrc) {
      return (
        // Local blob/data preview cannot benefit from Next.js image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt={file.name}
          className="w-16 h-16 object-cover rounded-lg border border-[var(--color-border)]"
        />
      );
    }
    return (
      <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)]">
        {getFileIcon(file.type)}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        kicker="שלב 2 · ראיות"
        title="יש ראיות? לצרף אותן"
        subtitle="צילומי מסך, חוזים, התכתבויות או חשבוניות. המערכת תנתח ותשלב במכתב."
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`wizard-dropzone flex flex-col items-center justify-center gap-4 ${
          dragOver ? "is-over" : ""
        }`}
      >
        <div className="wizard-mode-icon">
          <IconUpload size={22} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            לגרור לכאן או ללחוץ לבחירה
          </p>
          <p className="text-xs text-[var(--color-subtle)] mt-1.5">
            תמונות או PDF, עד 10MB, עד {MAX_FILES} קבצים
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={[...ACCEPTED_TYPES, ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".pdf"].join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-[var(--color-body)]">
            {files.length} קבצים צורפו
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 hover:border-[var(--color-accent)]/25 transition-colors"
            >
              {getPreview(file)}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--color-ink)] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-[var(--color-error)]/10 transition-colors"
                  >
                    <IconX size={16} className="text-[var(--color-error)]" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="מה הראיה הזו מראה? (אופציונלי)"
                  value={file.description || ""}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/60 placeholder:text-[var(--color-placeholder)]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 mt-2">
        {files.length > 0 ? (
          <Button
            variant="primary"
            onClick={() =>
              onContinue(
                files.map((file) => ({
                  name: file.name,
                  type: file.type,
                  base64: file.base64,
                  description: file.description,
                  storage: file.storage,
                }))
              )
            }
            disabled={isUploading}
            isLoading={isUploading}
          >
            {isUploading ? "מעלה ראיות..." : `המשך עם ${files.length} ראיות`}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isUploading}
          className="w-full"
        >
          אין ראיות כרגע, להמשיך בלעדיהן
        </Button>
      </div>
    </div>
  );
}
