export type Category =
  | "consumer"
  | "banking"
  | "employment"
  | "rental"
  | "tort"
  | "neighbors"
  | "authorities";
export type Tone = "firm" | "businesslike" | "conciliatory" | "threatening";
export type Goal = "compensation" | "fix" | "apology" | "intimidate";
export type PaymentStatus = "pending" | "completed" | "mock";

export interface ExtractedData {
  respondentName: string;
  respondentAddress?: string;
  eventDate?: string;
  amount?: string;
  description: string;
  category: Category;
  rawTranscription?: string;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  rawInput: string;
  extractedData: ExtractedData | null;
  respondentName: string;
  respondentAddress: string;
  eventDate: string;
  amount: string;
  description: string;
  category: Category | null;
  tone: Tone | null;
  goal: Goal | null;
  senderName: string;
  senderIdNumber: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
}

export type SenderType = "individual" | "company";

export interface LetterInput {
  category: Category;
  respondentName: string;
  respondentAddress?: string;
  eventDate?: string;
  amount?: string;
  description: string;
  tone: Tone;
  goal: Goal;
  rawInput: string;
  senderType: SenderType;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  senderIdNumber?: string;
  companyName?: string;
  companyNumber?: string;
  signatoryRole?: string;
  evidence?: EvidenceFile[];
}

export interface LetterOutput {
  content: string;
  upsellMessage: string;
  fileName: string;
  knowledgeVersion: string;
  promptSnapshot: string;
  modelResponse: string;
  verified: boolean;
}

export interface Lead {
  id: string;
  name: string;
  idNumber: string | null;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  letter: LetterRecord | null;
  payment: PaymentRecord | null;
  evidence?: EvidenceRecord[];
}

export interface EvidenceRecord {
  id: string;
  leadId: string;
  label: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  url?: string;
}

export interface LetterRecord {
  id: string;
  leadId: string;
  category: Category;
  rawInput: string;
  extractedData: ExtractedData;
  respondentName: string;
  respondentAddress: string | null;
  eventDate: string | null;
  amount: string | null;
  tone: Tone;
  goal: Goal;
  content: string;
  upsellMessage: string;
  fileName: string;
  knowledgeVersion: string | null;
  promptSnapshot: string | null;
  modelResponse: string | null;
  verified: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  leadId: string;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface EvidenceFile {
  name: string;
  type: string;
  base64: string;
  description?: string;
  storage?: StoredFileReference;
}

export interface StoredFileReference {
  key: string;
  name: string;
  type: string;
  sizeBytes: number;
  description?: string;
}

export interface AudioInput {
  base64: string;
  mimeType: string;
  storage?: StoredFileReference;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface StatuteEntry {
  law: string;
  sections: string[];
  appliesWhen: string;
}

export interface KnowledgeFile {
  version: string;
  updatedAt: string;
  statutes: StatuteEntry[];
}

export interface VerificationResult {
  verified: boolean;
  invalidCitations: string[];
}
