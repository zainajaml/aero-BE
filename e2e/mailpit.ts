const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8026";

type Summary = { ID: string; To: { Address: string }[]; Subject: string };

/** Waits for the newest email to `to` and returns its first link containing `contains`. */
export async function linkFromLatestEmail(
  to: string,
  contains: string,
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    );
    const { messages } = (await response.json()) as { messages: Summary[] };
    if (messages[0]) {
      const message = (await (
        await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)
      ).json()) as { HTML: string };
      const match = new RegExp(`href="([^"]*${contains}[^"]*)"`).exec(message.HTML);
      if (match?.[1]) return match[1].replaceAll("&amp;", "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no email with a ${contains} link for ${to}`);
}
