export async function generateAiSummary(
  groqApiKey: string,
  oldContent: string,
  newContent: string,
  diffSummary: string,
  pageUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content:
                'You summarize website changes in one clear sentence. Be specific about what changed. Example: "The price dropped from $299 to $249" or "A new job listing for Senior Engineer was added". Never say "the page changed". Be concrete and helpful.',
            },
            {
              role: 'user',
              content: `URL: ${pageUrl}\nDiff: ${diffSummary}\n\nOld (last 500 chars): ${oldContent?.slice(-500) || 'none'}\nNew (last 500 chars): ${newContent.slice(-500)}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 150,
        }),
      }
    );

    if (!response.ok) return null;

    const data: any = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';

    // Reject suspiciously short or generic responses. LLMs occasionally return
    // things like "OK" or "The page changed" despite instructions not to. In
    // those cases, returning null makes the caller fall back to the raw diff.
    if (raw.length < 15) return null;
    if (/^the page (has )?changed\.?$/i.test(raw)) return null;

    // Strip wrapping quote marks some models add.
    return raw.replace(/^["'`]|["'`]$/g, '').trim() || null;
  } catch {
    return null;
  }
}
