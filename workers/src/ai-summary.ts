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
          model: 'llama-3.3-70b-versatile',
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
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
