import type {
  AudioInput,
  EvidenceFile,
  ExtractedData,
  LetterInput,
  StoredFileReference,
} from "@/lib/types";
import type { LetterGenerationJobResult } from "@/backend/services/jobs/types";
import { runProcessingJob } from "@/lib/processing-jobs";

const EVIDENCE_STORAGE_KEY = "hatraah:wizard-evidence";

export function rememberWizardEvidence(files: EvidenceFile[]): void {
  const resumable = files
    .filter((file) => file.storage)
    .map((file) => ({
      name: file.name,
      type: file.type,
      base64: "",
      description: file.description,
      storage: file.storage,
    }));
  localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(resumable));
}

export function restoreWizardEvidence(): EvidenceFile[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(
      localStorage.getItem(EVIDENCE_STORAGE_KEY) ?? "[]"
    );
    return Array.isArray(value) ? (value as EvidenceFile[]) : [];
  } catch {
    return [];
  }
}

export function clearWizardEvidence(): void {
  localStorage.removeItem(EVIDENCE_STORAGE_KEY);
}

export function runExtractionJob(input: {
  rawInput: string;
  audioData?: AudioInput;
  evidenceFiles: EvidenceFile[];
  signal?: AbortSignal;
  onProgress?: (stage: string) => void;
}) {
  return runProcessingJob<ExtractedData>({
    scope: "wizard-extraction",
    type: "EXTRACTION",
    signal: input.signal,
    payload: {
      text: input.rawInput,
      audio: input.audioData?.storage,
      evidence: toStoredReferences(input.evidenceFiles),
    },
    onProgress: (job) => input.onProgress?.(job.progressStage ?? "מעבד"),
  });
}

export function runLetterGenerationJob(input: {
  letterInput: LetterInput;
  extractedData: ExtractedData | null;
  evidenceFiles: EvidenceFile[];
  signal?: AbortSignal;
  onProgress?: (stage: string) => void;
}) {
  return runProcessingJob<LetterGenerationJobResult>({
    scope: "wizard-generation",
    type: "LETTER_GENERATION",
    signal: input.signal,
    payload: {
      letterInput: input.letterInput,
      extractedData: input.extractedData ?? {},
      evidence: toStoredReferences(input.evidenceFiles),
    },
    onProgress: (job) => input.onProgress?.(job.progressStage ?? "מעבד"),
  });
}

function toStoredReferences(files: EvidenceFile[]): StoredFileReference[] {
  return files.map((file) => {
    if (!file.storage) {
      throw new Error(`הקובץ ${file.name} טרם הועלה. נסה לצרף אותו מחדש.`);
    }
    return {
      ...file.storage,
      description: file.description,
    };
  });
}

