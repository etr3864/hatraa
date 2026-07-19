import type {
  ExtractedData,
  LetterInput,
  StoredFileReference,
} from "@/lib/types";

export interface ExtractionJobInput {
  text?: string;
  audio?: StoredFileReference;
  evidence: StoredFileReference[];
  workflowId: string;
}

export interface LetterGenerationJobInput {
  letterInput: LetterInput;
  extractedData: Record<string, unknown>;
  evidence: StoredFileReference[];
  workflowId: string;
}

export interface AttorneyRewriteJobInput {
  leadId: string;
  content: string;
  letterInput: LetterInput;
  workflowId: string;
}

export interface LetterGenerationJobResult {
  leadId: string;
  letterId: string;
  content: string;
  upsellMessage: string;
  fileName: string;
  letterInput: LetterInput;
}

export interface AttorneyRewriteJobResult {
  content: string;
  verified: boolean;
  attorneyVerified: true;
}

export type ProcessingJobInput =
  | ExtractionJobInput
  | LetterGenerationJobInput
  | AttorneyRewriteJobInput;

export type ProcessingJobResult =
  | ExtractedData
  | LetterGenerationJobResult
  | AttorneyRewriteJobResult;

