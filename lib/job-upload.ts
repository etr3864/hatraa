import type { StoredFileReference } from "@/lib/types";

export async function uploadFileForJob(input: {
  body: Blob;
  name: string;
  type: string;
}): Promise<StoredFileReference> {
  const form = new FormData();
  form.append("file", input.body, input.name);

  const response = await fetch("/api/jobs/uploads", {
    method: "POST",
    body: form,
  });
  const payload = (await response.json()) as {
    file?: StoredFileReference;
    error?: string;
  };
  if (!response.ok || !payload.file) {
    throw new Error(payload.error ?? "לא הצלחנו להעלות את הקובץ");
  }

  return {
    ...payload.file,
    type: payload.file.type || input.type,
  };
}

export function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type });
}
