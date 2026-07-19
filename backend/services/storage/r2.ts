import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} חסר`);
  return value;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: requireEnv("R2_ENDPOINT"),
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

function bucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

export function buildEvidenceKey(leadId: string, fileName: string, index: number): string {
  const safe = fileName.replace(/[^\w.\u0590-\u05ff-]+/g, "_").slice(0, 80);
  return `leads/${leadId}/${index}-${Date.now()}-${safe}`;
}

export function buildTemporaryJobKey(
  sessionId: string,
  fileName: string
): string {
  const safeSession = sessionId.replace(/[^a-z0-9-]/gi, "");
  const safeName = fileName
    .replace(/[^\w.\u0590-\u05ff-]+/g, "_")
    .slice(0, 80);
  return `jobs/${safeSession}/${randomUUID()}-${safeName}`;
}

export async function createTemporaryUploadUrl(input: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: input.key,
      ContentType: input.contentType,
    }),
    { expiresIn: input.expiresIn ?? 600 }
  );
}

export async function uploadEvidenceObject(opts: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    })
  );
}

export async function deleteEvidenceObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    })
  );
}

export async function deleteEvidenceObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await getClient().send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    })
  );
}

export async function getEvidenceSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn }
  );
}

export async function getEvidenceBuffer(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: bucket(), Key: key })
  );
  const bytes = await res.Body?.transformToByteArray();
  if (!bytes) throw new Error("קובץ ראיה לא נמצא");
  return {
    buffer: Buffer.from(bytes),
    contentType: res.ContentType,
  };
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}
