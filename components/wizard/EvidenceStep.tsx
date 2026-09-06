"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import { deleteJobUploads, uploadFileForJob } from "@/lib/job-upload";

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = Array.from(SUPPORTED_EVIDENCE_MIMES);

type UploadStatus = "uploading" | "ready" | "error";

interface EvidencePreview extends EvidenceFile {
  id: string;
  previewUrl?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface EvidenceStepProps {
  initialFiles?: EvidenceFile[];
  onContinue: (files: EvidenceFile[]) => void;
  onSkip: () => void;
}

function newItemId() {
  return crypto.randomUUID();
}

function toReadyItem(file: EvidenceFile): EvidencePreview {
  return {
    ...file,
    id: newItemId(),
    status: "ready",
    progress: 100,
  };
}

export function EvidenceStep({ initialFiles, onContinue, onSkip }: EvidenceStepProps) {
  const [files, setFiles] = useState<EvidencePreview[]>(
    () => (initialFiles ?? []).map(toReadyItem)
  );
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const aborts = useRef(new Map<string, AbortController>());
  const originals = useRef(new Map<string, File>());
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    return () => {
      aborts.current.forEach((controller) => controller.abort());
    };
  }, []);

  const patchFile = useCallback((id: string, patch: Partial<EvidencePreview>) => {
    setFiles((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const startUpload = useCallback(
    async (id: string, file: File) => {
      const controller = new AbortController();
      aborts.current.set(id, controller);
      originals.current.set(id, file);

      try {
        const prepared = await resolveEvidenceFile(file);
        if (controller.signal.aborted) return;
        patchFile(id, { name: prepared.name, type: prepared.type });

        const storage = await uploadFileForJob({
          body: file,
          name: prepared.name,
          type: prepared.type,
          signal: controller.signal,
          onProgress: (pct) => patchFile(id, { progress: pct, status: "uploading" }),
        });

        if (controller.signal.aborted || !filesRef.current.some((item) => item.id === id)) {
          deleteJobUploads([storage.key]);
          return;
        }

        patchFile(id, { storage, status: "ready", progress: 100, error: undefined });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        patchFile(id, { status: "error", progress: 0, error: mapUploadError(err) });
      } finally {
        aborts.current.delete(id);
      }
    },
    [patchFile]
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError("");
      const incoming = Array.from(fileList);

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

      const drafts: EvidencePreview[] = incoming.map((file) => ({
        id: newItemId(),
        name: file.name,
        type: file.type || normalizeEvidenceMime(file.type, file.name),
        base64: "",
        description: "",
        status: "uploading",
        progress: 0,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));

      let accepted = false;
      setFiles((prev) => {
        if (prev.length + drafts.length > MAX_FILES) {
          setError(`ניתן להעלות עד ${MAX_FILES} קבצים`);
          return prev;
        }
        accepted = true;
        return [...prev, ...drafts];
      });

      if (!accepted) {
        drafts.forEach((draft) => {
          if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
        });
        return;
      }

      drafts.forEach((draft, index) => {
        void startUpload(draft.id, incoming[index]);
      });
    },
    [startUpload]
  );

  const removeFile = useCallback((id: string) => {
    aborts.current.get(id)?.abort();
    aborts.current.delete(id);
    originals.current.delete(id);
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      deleteJobUploads([target?.storage?.key]);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const retryFile = useCallback(
    (id: string) => {
      const file = originals.current.get(id);
      if (!file) return;
      patchFile(id, { status: "uploading", progress: 0, error: undefined });
      void startUpload(id, file);
    },
    [patchFile, startUpload]
  );

  const updateDescription = useCallback((id: string, desc: string) => {
    setFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description: desc } : item))
    );
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const uploadingCount = files.filter((file) => file.status === "uploading").length;
  const readyFiles = files.filter((file) => file.status === "ready");
  const canContinue = readyFiles.length > 0 && uploadingCount === 0;

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        kicker="שלב 2 · ראיות"
        title="יש ראיות? לצרף אותן"
        subtitle="צילומי מסך, חוזים, התכתבויות או חשבוניות. המערכת תנתח ותשלב במכתב."
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
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
            {uploadingCount > 0
              ? `מעלה ${uploadingCount} · ${readyFiles.length} מוכנים`
              : `${readyFiles.length} קבצים צורפו`}
          </p>
          {files.map((file) => (
            <EvidenceCard
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
              onRetry={() => retryFile(file.id)}
              onDescribe={(value) => updateDescription(file.id, value)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 mt-2">
        {files.length > 0 ? (
          <Button
            variant="primary"
            onClick={() => {
              onContinue(
                readyFiles.map((file) => ({
                  name: file.name,
                  type: file.type,
                  base64: file.base64,
                  description: file.description,
                  storage: file.storage,
                }))
              );
            }}
            disabled={!canContinue}
            isLoading={uploadingCount > 0}
          >
            {uploadingCount > 0
              ? "מעלה ראיות..."
              : `המשך עם ${readyFiles.length} ראיות`}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => {
            aborts.current.forEach((controller) => controller.abort());
            deleteJobUploads(filesRef.current.map((file) => file.storage?.key));
            onSkip();
          }}
          className="w-full"
        >
          אין ראיות כרגע, להמשיך בלעדיהן
        </Button>
      </div>
    </div>
  );
}

function EvidenceCard({
  file,
  onRemove,
  onRetry,
  onDescribe,
}: {
  file: EvidencePreview;
  onRemove: () => void;
  onRetry: () => void;
  onDescribe: (value: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80">
      <div className="flex gap-3 p-3">
        <EvidenceThumb file={file} />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[var(--color-ink)] truncate">
              {file.name}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="flex-shrink-0 p-1 rounded-full hover:bg-[var(--color-error)]/10 transition-colors"
              aria-label="הסר קובץ"
            >
              <IconX size={16} className="text-[var(--color-error)]" />
            </button>
          </div>
          {file.status === "uploading" ? (
            <p className="text-xs text-[var(--color-accent)]">מעלה · {file.progress}%</p>
          ) : null}
          {file.status === "error" ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--color-error)]">{file.error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="text-xs text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                נסה שוב
              </button>
            </div>
          ) : null}
          <input
            type="text"
            placeholder="מה הראיה הזו מראה? אפשר לכתוב גם תוך כדי העלאה"
            value={file.description || ""}
            onChange={(e) => onDescribe(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/60 placeholder:text-[var(--color-placeholder)]"
          />
        </div>
      </div>
      {file.status === "uploading" ? (
        <div className="evidence-upload-track" aria-hidden>
          <div className="evidence-upload-fill" style={{ width: `${file.progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function EvidenceThumb({ file }: { file: EvidencePreview }) {
  const previewSrc =
    file.previewUrl || (file.base64 ? `data:${file.type};base64,${file.base64}` : "");
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

  const icon =
    file.type === "application/pdf" ? (
      <IconFileText size={24} className="text-red-500" />
    ) : file.type.startsWith("image/") ? (
      <IconPhoto size={24} className="text-blue-500" />
    ) : (
      <IconFile size={24} className="text-gray-500" />
    );

  return (
    <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)]">
      {icon}
    </div>
  );
}
