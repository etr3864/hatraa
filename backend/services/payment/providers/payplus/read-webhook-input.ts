/** PayPlus dashboard may send callbacks as GET (query) or POST (JSON body). */
export async function readPayPlusWebhookInput(
  req: Request
): Promise<{ rawBody: string; parsed: unknown }> {
  if (req.method === "GET") {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    return { rawBody: JSON.stringify(params), parsed: params };
  }

  const rawBody = await req.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error("גוף הבקשה אינו תקין");
  }
  return { rawBody, parsed };
}
