import type { StoredFileReference } from "@/lib/types";

const DELETE_CHUNK = 8;

export function deleteJobUploads(keys: Array<string | undefined>): void {
  const valid = [...new Set(keys.filter((key): key is string => Boolean(key)))];
  for (let index = 0; index < valid.length; index += DELETE_CHUNK) {
    const chunk = valid.slice(index, index + DELETE_CHUNK);
    void fetch("/api/jobs/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: chunk }),
      keepalive: true,
    }).catch(() => undefined);
  }
}

export function uploadFileForJob(input: {
  body: Blob;
  name: string;
  type: string;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}): Promise<StoredFileReference> {
  const form = new FormData();
  form.append("file", input.body, input.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/jobs/uploads");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      const payload = (xhr.response ?? {}) as {
        file?: StoredFileReference;
        error?: string;
      };
      if (xhr.status >= 200 && xhr.status < 300 && payload.file) {
        resolve({
          ...payload.file,
          type: payload.file.type || input.type,
        });
        return;
      }
      reject(new Error(payload.error ?? "לא הצלחנו להעלות את הקובץ"));
    };

    xhr.onerror = () => {
      reject(new Error("לא הצלחנו להעלות את הקובץ"));
    };

    xhr.onabort = () => {
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (input.signal) {
      if (input.signal.aborted) {
        xhr.abort();
        return;
      }
      input.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(form);
  });
}

export function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type });
}
