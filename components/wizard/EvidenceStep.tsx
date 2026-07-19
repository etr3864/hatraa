"use client";

import { useState, useRef, useCallback } from "react";
import { IconUpload, IconX, IconFile, IconPhoto, IconFileText } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import type { EvidenceFile } from "@/lib/types";
import {
  normalizeEvidenceMime,
  shortenFileName,
  isSupportedEvidenceMime,
  SUPPORTED_EVIDENCE_MIMES,
  resolveEvidencePayload,
  mapUploadError,
} from "@/lib/evidence-mime";
import { uploadFileForJob } from "@/lib/job-upload";

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = Array.from(SUPPORTED_EVIDENCE_MIMES);

interface EvidenceStepProps {
  initialFiles?: EvidenceFile[];
  onContinue: (files: EvidenceFile[]) => void;
  onSkip: () => void;
}

export function EvidenceStep({ initialFiles, onContinue, onSkip }: EvidenceStepProps) {
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles ?? []);
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
        const newFiles: EvidenceFile[] = await Promise.all(
          incoming.map(async (file) => {
            const prepared = await readEvidenceFile(file);
            const storage = await uploadFileForJob({
              body: file,
              name: prepared.name,
              type: prepared.type,
            });
            return { ...prepared, storage };
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
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

  const getPreview = (file: EvidenceFile) => {
    if (file.type.startsWith("image/") && file.base64) {
      return (
        // A local data URL preview cannot benefit from Next.js image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:${file.type};base64,${file.base64}`}
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
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          יש לך ראיות? צרף אותן
        </h2>
        <p className="text-sm text-[var(--color-body)] leading-relaxed">
          צילומי מסך, תמונות, חוזים, התכתבויות, חשבוניות או כל מסמך שיחזק את הטענה שלך.
          המערכת תנתח אותם ותשלב אותם במכתב.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
          ${
            dragOver
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-elevated)]"
          }
        `}
      >
        <div className={`p-3 rounded-xl transition-colors ${dragOver ? "bg-[var(--color-accent)]/10" : "bg-[var(--color-elevated)] border border-[var(--color-border)]"}`}>
          <IconUpload size={24} className="text-[var(--color-accent)]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            גרור קבצים לכאן או לחץ לבחירה
          </p>
          <p className="text-xs text-[var(--color-subtle)] mt-1.5">
            תמונות (JPG, PNG, WebP, HEIC) או PDF, עד 10MB לקובץ, מקסימום {MAX_FILES} קבצים
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
              className="flex gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/20 transition-colors"
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
        <Button
          variant="primary"
          onClick={() => onContinue(files)}
          disabled={files.length === 0 || isUploading}
          isLoading={isUploading}
          className="w-full rounded-xl py-4"
        >
          {isUploading
            ? "מעלה ראיות..."
            : files.length > 0
              ? `המשך עם ${files.length} ראיות`
              : "המשך עם ראיות"}
        </Button>
        <button
          onClick={onSkip}
          disabled={isUploading}
          className="text-sm text-[var(--color-subtle)] hover:text-[var(--color-accent)] transition-colors text-center py-2 disabled:opacity-50"
        >
          אין לי ראיות כרגע, המשך בלעדיהן
        </button>
      </div>
    </div>
  );
}

function readEvidenceFile(file: File): Promise<EvidenceFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        const prepared = resolveEvidencePayload(file.type, file.name, result);
        resolve({
          name: prepared.name,
          type: prepared.type,
          base64: prepared.base64,
          description: "",
        });
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error(mapUploadError(error))
        );
      }
    };
    reader.onerror = () => reject(new Error("לא הצלחנו לקרוא את הקובץ"));
    reader.readAsDataURL(file);
  });
}
