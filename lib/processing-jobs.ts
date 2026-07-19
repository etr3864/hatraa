export type ProcessingJobTypeName =
  | "EXTRACTION"
  | "LETTER_GENERATION"
  | "ATTORNEY_REWRITE";

export interface PublicProcessingJob<T = unknown> {
  id: string;
  type: ProcessingJobTypeName;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  progress: number;
  progressStage: string | null;
  error: string | null;
  result: T | null;
}

interface RunJobOptions<T> {
  scope: string;
  type: ProcessingJobTypeName;
  payload: Record<string, unknown>;
  signal?: AbortSignal;
  onProgress?: (job: PublicProcessingJob<T>) => void;
}

const POLL_INTERVAL_MS = 1_500;

export function hasPendingProcessingJob(scope: string): boolean {
  return Boolean(
    readStorage(jobStorageKey(scope)) ||
      readStorage(requestStorageKey(scope))
  );
}

export async function runProcessingJob<T>(
  options: RunJobOptions<T>
): Promise<T> {
  const pendingRequest = readStorage(requestStorageKey(options.scope));
  const jobId =
    readStorage(jobStorageKey(options.scope)) ??
    (await findRecoverableJob(options.type, Boolean(pendingRequest)))?.id ??
    (await startJob(options));
  writeStorage(jobStorageKey(options.scope), jobId);

  try {
    const result = await waitForJob<T>(
      jobId,
      options.signal,
      options.onProgress
    );
    clearJobStorage(options.scope);
    return result;
  } catch (error) {
    if (!isAbortError(error)) clearJobStorage(options.scope);
    throw error;
  }
}

async function startJob<T>(options: RunJobOptions<T>): Promise<string> {
  const requestKey =
    readStorage(requestStorageKey(options.scope)) ?? crypto.randomUUID();
  writeStorage(requestStorageKey(options.scope), requestKey);

  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...options.payload,
      type: options.type,
      idempotencyKey: requestKey,
    }),
    signal: options.signal,
  });
  const body = (await response.json()) as { jobId?: string; error?: string };
  if (!response.ok || !body.jobId) {
    throw new Error(body.error ?? "לא הצלחנו להתחיל את העיבוד");
  }
  return body.jobId;
}

async function waitForJob<T>(
  jobId: string,
  signal?: AbortSignal,
  onProgress?: (job: PublicProcessingJob<T>) => void
): Promise<T> {
  while (!signal?.aborted) {
    const response = await fetch(`/api/jobs/${jobId}`, {
      cache: "no-store",
      signal,
    });
    const job = (await response.json()) as PublicProcessingJob<T> & {
      error?: string | null;
    };
    if (!response.ok) throw new Error(job.error ?? "לא מצאנו את המשימה");

    onProgress?.(job);
    if (job.status === "SUCCEEDED" && job.result) return job.result;
    if (job.status === "FAILED") {
      throw new Error(job.error ?? "העיבוד נכשל. אפשר לנסות שוב.");
    }
    await sleep(POLL_INTERVAL_MS, signal);
  }
  throw new DOMException("Aborted", "AbortError");
}

async function findRecoverableJob(
  type: ProcessingJobTypeName,
  includeCompleted: boolean
) {
  const response = await fetch(
    `/api/jobs/active?type=${encodeURIComponent(type)}${includeCompleted ? "&latest=1" : ""}`,
    { cache: "no-store" }
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    job: PublicProcessingJob | null;
  };
  return body.job;
}

function sleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

function clearJobStorage(scope: string) {
  localStorage.removeItem(jobStorageKey(scope));
  localStorage.removeItem(requestStorageKey(scope));
}

function jobStorageKey(scope: string) {
  return `hatraah:job:${scope}`;
}

function requestStorageKey(scope: string) {
  return `hatraah:job-request:${scope}`;
}

function readStorage(key: string): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window !== "undefined") localStorage.setItem(key, value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

