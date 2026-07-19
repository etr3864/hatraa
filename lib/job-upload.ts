import type { StoredFileReference } from "@/lib/types";

export async function uploadFileForJob(input: {
  body: Blob;
  name: string;
  type: string;
}): Promise<StoredFileReference> {
  const metadataResponse = await fetch("/api/jobs/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      type: input.type,
      sizeBytes: input.body.size,
    }),
  });
  const metadata = (await metadataResponse.json()) as {
    uploadUrl?: string;
    file?: StoredFileReference;
    error?: string;
  };
  if (!metadataResponse.ok || !metadata.uploadUrl || !metadata.file) {
    throw new Error(metadata.error ?? "לא הצלחנו להכין את העלאת הקובץ");
  }

  const uploadResponse = await fetch(metadata.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": metadata.file.type },
    body: input.body,
  });
  if (!uploadResponse.ok) {
    throw new Error("העלאת הקובץ נכשלה. נסה שוב.");
  }

  return metadata.file;
}

export function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type });
}

